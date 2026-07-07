# server/ — behavioral contracts

The invariants a change to `@devdigest/api` must preserve. These are the
**testable guarantees** behind the design in [`../docs/`](../docs/README.md);
break one and a downstream assumption (UI, CI, tenancy, security) breaks. Most are
pinned by the integration suite (`*.it.test.ts`).

## Validation & errors
- **Invalid input never reaches a handler.** A route's zod `params`/`body`/
  `querystring` schema rejects with **422** `{error:{code:"validation_error",details}}`
  before the handler runs. Handlers don't hand-roll `Schema.parse(req.body)`.
- **A response that fails its own schema returns a generic 500**, never the raw
  object (no info leak). It's logged server-side.
- **All errors share the envelope** `{ error: { code, message, details } }`.
  `AppError` subclasses map to fixed statuses (404/422/502/500); the frontend
  branches the toast/inline/full-screen UX on `code`/`status`.

## Rate limiting
- Global **120 req/min**; **disabled under `NODE_ENV=test`** so suites can hammer
  via `inject()`.
- `POST /pulls/:id/review` is capped **10/min** (fans out to LLM calls).
- `/health`, `/health/ready`, and `GET /runs/:id/events` (SSE) are **exempt**.

## Boot & lifecycle
- **Migrations are NOT applied on boot** — `pnpm db:migrate` is required; pgvector
  comes from migration `0000`.
- **Stale `running` runs are reaped on boot, awaited before listening.** No run can
  start before the server listens, so every `running` row at boot is orphaned.
  (Single-instance assumption — multi-replica would need heartbeats.)
- `POST /pulls/:id/review` **returns run ids immediately**; execution is async.
  The client subscribes to `GET /runs/:id/events` for progress.

## Secrets & config
- **Secrets never enter `AppConfig`, logs, or the DB.** API keys / `GITHUB_TOKEN`
  flow only through `SecretsProvider` (`~/.devdigest/secrets.json`, `process.env`
  fallback). The server boots with no keys; a missing key throws `ConfigError` only
  when that provider is actually used.

## Review enrichment & repo-intel
- **The repo-intel facade degrades, never throws.** Array methods → `[]`, object
  methods → `degraded: true`. An unindexed repo yields a prompt **identical** to the
  ripgrep-only baseline.
- **Per-agent `repo_intel = false` omits all enrichment** for that agent,
  independent of the global `REPO_INTEL_ENABLED` flag.
- **The blocker count is deterministic** (`countBlockers`, severity ≥ the agent's
  gate), not the model's self-reported verdict.

## Tenancy & tests
- **Every domain query is workspace-scoped** (`workspace_id`); resources are never
  visible across workspaces.
- **A DB-backed test MUST use the `*.it.test.ts` suffix** — that suffix is the
  unit/integration split (`pnpm exec vitest run .it.test` spins real Postgres via
  testcontainers). Mis-suffixing a DB test breaks the hermetic unit run.

See [`../../TESTING.md`](../../TESTING.md) for the suite layout.

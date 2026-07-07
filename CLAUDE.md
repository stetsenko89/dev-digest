# DevDigest — root map

Local-first AI pull-request reviewer. **Course starter template**: does one thing
end to end — import a PR and run an agent review on it. Later lessons (L01–L08)
add features back. This file is a thin **map**, not documentation — see the
`Read when…` pointers; the linked docs are the single source of truth.

## Answering questions — docs before code

Before answering a question about a package, look for the answer in that package's
docs FIRST, in this order, and stop at the first that answers it:
`<pkg>/CLAUDE.md` → `<pkg>/docs/` → `<pkg>/specs/` → `<pkg>/INSIGHTS.md`.
These (plus each `README.md`) are the primary source. Read the source code only
when the docs don't cover it — then, if the gap was durable, record it back in the
relevant `INSIGHTS.md`.

## Packages (NOT a monorepo workspace)

Each folder has its own `package.json` + lockfile. Cross-package code is shared
via **tsconfig path aliases**, not published modules — consumers import the TS
**source** directly (tsx in dev, vitest in tests).

| Folder | Package | What | Port |
|--------|---------|------|------|
| `server/` | `@devdigest/api` | Fastify 5 + Drizzle/Postgres (pgvector) | 3001 |
| `client/` | `@devdigest/web` | Next.js 15 studio UI | 3000 |
| `reviewer-core/` | `@devdigest/reviewer-core` | Pure engine: diff → prompt → LLM → grounded findings | — |
| `e2e/` | `@devdigest/e2e` | Deterministic browser e2e (no LLM) | — |
| `server/src/vendor/shared` | `@devdigest/shared` | Zod contracts (vendored; mirrored into client) | — |

## Run / build / test

- Boot everything: `./scripts/dev.sh` (Postgres in Docker + API + web). Flags:
  `--no-seed` · `--no-client` · `--db-only`.
- Per package: `pnpm dev` · `pnpm build` · `pnpm test` · `pnpm typecheck`. Server
  also: `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:generate`.
- Prereqs: Node ≥22 · pnpm ≥10 · Docker (Postgres only).

## Gotchas (can't guess from code)

- **Migrations are NOT applied on boot** — run `cd server && pnpm db:migrate`.
  `relation … does not exist` on first run = you skipped it.
- **The DB schema already holds EVERY table**; unused ones sit empty until a
  lesson fills them. Don't delete "dead" tables/schema files.
- **Secrets live outside git and the DB** in `~/.devdigest/secrets.json` (mode
  `0600`), with `process.env` as fallback; only read through `LocalSecretsProvider`.
  The server boots with no keys.
- **`@devdigest/shared` is vendored**, not an npm dep: edit
  `server/src/vendor/shared` and mirror into `client/src/vendor/shared`.
- **Grounding gate is mandatory**: a finding that doesn't cite a real diff line is
  dropped, and the score is recomputed from survivors — the model's self-score is
  ignored. Don't weaken this.

## Read when…

Docs are the single source of truth — **link, don't duplicate** here.

- Working inside a package → its own `CLAUDE.md` auto-loads when you touch its
  files; read that first.
- Need the end-to-end review flow / architecture diagrams → read `README.md`
  (root) and each package's `README.md`.
- Need agent system prompts / how to choose a model → read `docs/agent-prompts/`.
- Need the testing strategy / unit-vs-integration split → read `TESTING.md`.
- Learned something durable or hit a non-obvious gotcha → record it in the
  relevant module's `INSIGHTS.md` (don't inline it in this map).

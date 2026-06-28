# server/ — @devdigest/api (Fastify + Postgres)

Fastify 5 + Drizzle ORM over Postgres (pgvector). Imports repos/PRs, indexes
repos (`repo-intel`), stores agents, and runs the reviewer. Adapters sit behind a
DI container so tests swap in mocks. Thin map only — see `Read when…`.

## Layout

- `src/modules/<name>/` — feature plugins, each `routes.ts → service.ts →
  repository.ts`. Registered statically in `src/modules/index.ts`.
  core: `repos` `pulls` `reviews` `agents` · intel: `repo-intel` · platform:
  `settings` `workspace` `polling`. Review orchestration: `reviews/run-executor.ts`.
- `src/adapters/<port>/` — ports (llm, github, git, astgrep, tokenizer, secrets,
  …); test doubles in `src/adapters/mocks.ts`.
- `src/platform/` — `container.ts` (DI composition root), `config.ts`, `sse.ts`
  (runBus), error handling.
- `src/db/schema/` — Drizzle tables · `src/db/migrations/` · `src/vendor/shared`
  — Zod contracts.

## Commands

`pnpm dev` (:3001) · `pnpm build` · `pnpm typecheck` · `pnpm db:migrate` ·
`pnpm db:seed` · `pnpm db:generate`. Tests: `pnpm test` (both suites). Split by
filename — `*.it.test.ts` = DB-backed (testcontainers Postgres); everything else
hermetic.
- unit only: `pnpm exec vitest run --exclude '**/*.it.test.ts'`
- integration only: `pnpm exec vitest run .it.test`

## Conventions (non-default)

- **Schema-first routes**: declare zod `params`/`body` via
  `fastify-type-provider-zod`; invalid input → `422` before the handler. Don't
  hand-roll `Schema.parse(req.body)`. One contract drives validation AND
  response serialization.
- Services reach adapters through `container.*`, never by importing another
  module's folder (shared repos live on the container).
- **A DB-backed test MUST use the `*.it.test.ts` suffix** or the unit/integration
  split breaks.
- Plugins (helmet/cors/rate-limit/SSE/error-handler) register **before** modules
  so encapsulated module plugins inherit them.

## Gotchas / do-not-touch

- Migrations are NOT auto-applied on boot; pgvector is enabled by migration `0000`.
- repo-intel degrades silently when a repo is unindexed (facade returns empty,
  never throws) — don't "fix" it to throw.

## Read when…

- Need the API map / request+DI flow / review-context rules → read
  `server/README.md`.
- Working in repo-intel → read `src/modules/repo-intel/README.md`.
- Need deep architecture or a design decision → read `docs/`.
- Need exact behavioral contracts for a feature → read `specs/`.
- Hit a non-obvious gotcha → record it in `INSIGHTS.md` here (don't inline above).

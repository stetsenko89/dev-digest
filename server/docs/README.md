# server/ — architecture deep-dive

Deeper design notes for `@devdigest/api`. The module **[`../README.md`](../README.md)**
is the high-level map (stack, API map, env table); this file documents the
internals behind it. Code is the source of truth — every section links the file
it describes.

## App bootstrap & plugin order — `src/app.ts`

`buildApp(opts)` builds the Fastify instance (exported so tests use `app.inject()`
without a port). Registration order is deliberate and load-bearing:

1. **Zod type provider** — `setValidatorCompiler` / `setSerializerCompiler` from
   `fastify-type-provider-zod`. One zod schema per route drives **both** request
   validation and response serialization.
2. **DI container** — `app.decorate('container', container)` (see below).
3. **Stale-run reaping** — `new ReviewService(container).reapStaleRuns()`, **awaited
   before listening** (a fresh process has no in-flight runs, so any `running` row
   is genuinely orphaned). Assumes a single API instance per DB.
4. **Transport/security** — `helmet`, `cors` (`origin: [config.webOrigin]`), `FastifySSEPlugin`.
5. **Rate limit** — global `120/min`, skipped when `NODE_ENV=test`.
6. **Health** — `GET /health` (liveness), `GET /health/ready` (DB `select 1` → 200/503).
7. **Error handler** — registered **before** modules so encapsulated module plugins inherit it.
8. **Modules** — `for (const plugin of Object.values(modules)) await app.register(plugin)`.

Body limit is 1 MB. Modules are a static registry — `src/modules/index.ts` —
registered in order: `settings, repos, pulls, polling, workspace, agents, reviews, repoIntel`.

## DI container — `src/platform/container.ts`

One `Container` per app instance; the composition root. Holds `config`, `db`,
`secrets`, `auth`, `jobs` (JobRunner), `runBus` (SSE). Adapters are **lazy** and
cached (`_field ??= new …`): `git`, `github()`, `codeIndex`, `embedder()`,
`repoIntel`, `depgraph`, `tokenizer`. `llm(provider)` resolves OpenAI/Anthropic/
OpenRouter through a `Map` cache; each provider constructor throws `ConfigError`
if its key is missing. Shared repositories (`agentsRepo`, `reviewRepo`) live here
so modules never cross-import each other's folders. `ContainerOverrides` lets
tests inject mocks (`src/adapters/mocks.ts`); overridden adapters skip the cache.
After a Settings key change, secret-dependent caches are invalidated.

## Config & secrets split — `src/platform/config.ts`

`loadConfig(env)` zod-parses env once into `AppConfig` (`databaseUrl`, ports,
`cloneDir`, `secretsPath`, `nodeEnv`, `logLevel`, `webOrigin`, `embeddingsEnabled`,
`repoIntelEnabled`). **Secrets are deliberately NOT in `AppConfig`** — API keys and
`GITHUB_TOKEN` are read only through `SecretsProvider` (`adapters/secrets/local.ts`,
`~/.devdigest/secrets.json`), the single chokepoint touching `process.env`. Notable
defaults: `EMBEDDINGS_ENABLED` off (zero OpenAI calls), `REPO_INTEL_ENABLED` on,
empty `LOG_LEVEL` coerces to the default, `logLevel` → `silent` under test.

## Error envelope — `src/platform/errors.ts` + the handler in `app.ts`

Every error returns the stable body `{ error: { code, message, details } }`.
`AppError(code, message, statusCode=400, details)` is the base; subclasses:
`NotFoundError` (404 `not_found`), `ValidationError` (422 `validation_error`),
`ExternalServiceError` (502), `ConfigError` (500). The handler resolves, in order:
zod request-validation → **422**; response-serialization failure → logged + generic
**500** (never leak the raw object); service-level `ZodError` (matched by
`instanceof` **or** shape, to survive duplicate zod instances) → 422; `AppError` →
its `statusCode`; anything else → 500.

## Review run lifecycle (the hot path)

`POST /pulls/:id/review` (`modules/reviews/routes.ts`, capped 10/min) →
`ReviewService` creates `agent_runs` rows and returns run ids **immediately**, then
kicks `ReviewRunExecutor.executeRuns()` **fire-and-forget**. The executor
(`modules/reviews/run-executor.ts`) loads the diff once, then per agent: resolves
the LLM, builds best-effort repo-intel context (callers/repo-map/rank note), calls
`reviewPullRequest` from `@devdigest/reviewer-core`, persists review + findings +
one `run_traces` doc, and streams events on the **runBus**. Per-agent failures are
isolated. Background work that can be retried (clone/index/refresh/resync) goes
through the **JobRunner** (`src/platform/jobs.ts`, p-queue, timeout + retries).

## SSE / runBus — `src/platform/sse.ts`

In-memory per-run event bus. `GET /runs/:id/events` (rate-limit exempt) is
**replay-first**: a subscriber gets the buffered events, then the live stream, then
auto-close on `runBus.complete(runId)`. The full buffer is persisted as the run's
`RunTrace.log` so the Live Log survives a reload. `runBus.cancel(runId)` sets a flag
the executor checks between map files.

## DB layer — `src/db/`

`client.ts` wires Drizzle over postgres-js. `schema/` holds **every** table the
course will use (starter modules fill only some): `core`, `repos`, `pulls`,
`reviews`, `runs`, `agents`, `skills`, `knowledge`, `context`, `eval`, `ci`, `ops`,
`repo-intel`. Migrations live in `db/migrations/` and are **not** applied on boot
(`pnpm db:migrate`); pgvector is enabled by migration `0000`.

## repo-intel facade — `src/modules/repo-intel/`

The `RepoIntel` interface (`types.ts`) is the single contract features code
against — library complexity (ast-grep, dependency-cruiser, graphology, tokenizer)
hides behind it. **Degraded contract:** object methods carry `degraded?: boolean`
(+`reason`); array methods return `[]` when degraded — never throw. Status is always
observable via `getIndexState()`. See [`src/modules/repo-intel/README.md`](../src/modules/repo-intel/README.md)
for the indexing pipeline.

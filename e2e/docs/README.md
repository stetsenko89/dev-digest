# e2e/ — harness deep-dive

Deeper design notes for `@devdigest/e2e`. The module **[`../README.md`](../README.md)**
covers how to run the suite, the env knobs, and the per-flow coverage table; this
file documents how the harness works and why it's shaped this way. The executable
flow specs live next door in [`../specs/`](../specs/) (`*.flow.json`).

## Why agent-browser (not Playwright)

Flows are driven by Vercel **agent-browser** — a native Rust + CDP browser-automation
CLI. The suite uses **no Playwright, no LLM, and no API key**. agent-browser is a CLI
rather than a test framework, so this package adds a thin convention on top of it.

## The flow runner — `run.ts`

Each spec is a JSON list of agent-browser commands executed in order against **one
shared browser session**:
- **`{BASE}` substitution** — replaced with `E2E_BASE_URL` (default
  `http://localhost:3000`) in every command.
- **Each `cmd` is passed verbatim** to the `agent-browser` binary
  (`AGENT_BROWSER_BIN`). A non-zero exit fails the step and the whole flow.
- **Waits are the assertions** — `wait --url …` / `wait --text …` time out and exit
  non-zero if the condition never holds, so they double as the checks.
- **Optional `"assert": { "stdoutIncludes": "…" }`** adds a substring check on a
  command's stdout.
- **Failure screenshots** are written to `e2e/test-results/` (git-ignored; uploaded as
  a CI artifact by `.github/workflows/e2e-web.yml`).

## Determinism by construction

Locators are deterministic only — `--url`, `--text`, `find role|text|label`. The suite
**never uses the AI `chat` command**, so runs are stable and key-free. Flows target
**read-only seeded data** (demo repo `acme/payments-api`, PR #482, the seeded agents),
so nothing triggers a model call. Step timeout: `E2E_STEP_TIMEOUT` (default 60000 ms).

## Why a freshly-seeded DB matters

Several flows (e.g. `02`, `04`, `05`) follow the home redirect to the **first** repo,
assuming the seeded demo repo is the only one. A normal dev DB usually has other
imported repos, so those flows would land on the wrong repo and fail. The **hermetic
runner** (`scripts/e2e.sh` / `npm run e2e:hermetic`) solves this: it boots an isolated,
ephemeral, freshly-seeded stack on alternate ports (Postgres `5433`, API `3101`, web
`3100`), runs the flows, and tears it down — never touching your dev DB or the
`devdigest_pgdata` volume.

> ⚠️ Never `docker compose down -v` to "reset" the dev DB — `-v` deletes the
> `devdigest_pgdata` volume and every real repo/review you've imported. Use the
> hermetic runner instead.

## Adding a flow

Drop `NN-name.flow.json` in [`../specs/`](../specs/) (the specs **are** the test
cases), reusing the shared helpers in `lib/`. Keep it on deterministic locators and
seeded data so it stays key-free and stable.

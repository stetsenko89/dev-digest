# e2e/ — @devdigest/e2e (deterministic browser e2e)

Browser end-to-end flows driven by agent-browser against the **real stack** (API
+ web + Postgres). **Deterministic — no LLM**: the reviewer is exercised with
stubbed model output so runs are reproducible. Thin map — see `Read when…`.

## Layout

`run.ts` — entrypoint · `specs/` — executable flow specs (these ARE the test
cases) · `lib/` — helpers · `agent-browser.json` — config.

## Commands

`pnpm test` · `pnpm e2e:hermetic` · `pnpm typecheck`. Needs Docker (real
Postgres). Gated by `e2e-web.yml` in CI.

## Conventions

- Flows must stay **deterministic** — never depend on a live LLM call; mock model
  output.
- New flows go in `specs/`, sharing the helpers in `lib/`.

## Read when…

- Need how flows are structured / how to run them → read `e2e/README.md`.
- Need a design note / deep dive → read `docs/`.
- Hit a non-obvious gotcha → record it in `INSIGHTS.md` here (don't inline above).

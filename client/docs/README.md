# client/ — architecture deep-dive

Deeper design notes for `@devdigest/web`. The module **[`../README.md`](../README.md)**
holds the route map and stack; this file documents the patterns behind it. Code is
the source of truth.

## API layer — `src/lib/api.ts`

`apiFetch<T>(path, init)` is the one fetch wrapper every hook builds on. Base URL is
`NEXT_PUBLIC_API_BASE` (default `http://localhost:3001`). Three behaviors worth
knowing:
- **`content-type: application/json` is only sent when a body exists** — a body-less
  POST/PUT (refresh, reindex) would otherwise trip Fastify's "Body cannot be empty".
- **Errors normalize to `ApiError`** (`status`, `code`, `details`) parsed from the
  server's `{ error: {…} }` envelope; a network failure becomes `status: 0`,
  `code: "network_error"` (full-screen candidate).
- **204 → `undefined`.** The `api.{get,post,put,patch,del}` object wraps `apiFetch`.

Response bodies are **not** Zod-validated here — the vendored contracts type the
call sites; validation happens server-side.

## Data hooks — `src/lib/hooks/*`

Server state lives entirely in **TanStack Query** hooks (`core`, `reviews`,
`agents`, `trace`, `repo-intel`). Conventions:
- **Query keys are inline tuples** — `["pulls", repoId]`, `["reviews", prId]`,
  `["run-trace", runId]` — domain prefix + params (not centralized).
- **Mutations invalidate the keys they affect** — e.g. `useRunReview` → `["reviews",
  prId]`; `useDeleteRun` → `["pr-runs", prId]` + `["reviews", prId]`;
  `useResyncRepoIntel` → `["repo-intel-state", repoId]`.
- **Conditional polling** via function-form `refetchInterval`: active runs poll ~4 s
  while any run is `running` and self-clear when settled; the PR list refetches every
  60 s; provider models cache 5 min.
- **`useRunEvents(runIds)`** opens **one EventSource per run** to `GET /runs/:id/events`,
  accumulates `RunEvent[]`, surfaces `kind:"error"` as a toast, and closes all
  sources on unmount/completion. This is the live counterpart to the persisted
  `useRunTrace`.

## Providers — `src/lib/providers.tsx`

`QueryClient` is created once in `useState`. Defaults: `retry: 1`,
`staleTime: 30_000`, `refetchOnWindowFocus: false`. **Status-aware error surfacing:**
the `QueryCache.onError` toasts only on network (`status 0`) or `5xx` — expected
`4xx` (e.g. a 404 "no data yet") stays silent for inline empty states. The
`MutationCache.onError` always toasts (mutations are user actions). Provider stack:
`QueryClientProvider → ThemeProvider → ToastProvider → RepoProvider`.

## App Router — `src/app/**`

All route pages are client components. **Pages are thin** entry points that delegate
to colocated `_components/<Name>/` folders holding the feature's logic, styles,
constants, and `*.test.tsx`. Routes: `/` (redirect to first repo or `/onboarding`),
`/repos/[repoId]/pulls`, `/repos/[repoId]/pulls/[number]` (overview · findings · diff
tabs, `?trace=runId` drawer), `/agents`, `/agents/[id]`, `/settings/[section]`.
`layout.tsx` wires locale, a theme no-flash script, `NextIntlClientProvider`, then
`Providers`.

## i18n — `src/i18n/` + `messages/`

Single locale (`en`), **no locale routing**. `request.ts` merges every
`messages/en/*.json` (one file per feature: `prReview`, `runs`, `agents`, `settings`,
`shell`, …) into one namespace object. Components read via `useTranslations(ns)`;
feature work adds a namespace file without touching shared code.

## Vendored code — `src/vendor/`

- **`vendor/shared`** mirrors `@devdigest/shared` (Zod contracts). **Manually kept in
  sync** with `server/src/vendor/shared` — don't fork the schemas.
- **`vendor/ui`** is the `@devdigest/ui` primitive/kit/chart/shell library used
  across screens.

## Components — `src/components/*`

Cross-cutting chrome: `app-shell` (nav, breadcrumbs, command palette, `g`-then-key
shortcuts), `diff-viewer` (collapsible file cards + inline comments), `mermaid-diagram`
(lazy-loads mermaid; renders `null` on invalid syntax — no error bomb), `page-shell`,
`repo-not-found`, `showcase`.

## Tests

vitest + jsdom + React Testing Library; `fetch` mocked so tests need neither the API
nor a browser. Real browser journeys live in [`../../e2e`](../../e2e/README.md).

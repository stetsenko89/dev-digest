# client/ — behavioral contracts

The invariants a change to `@devdigest/web` must preserve — the testable guarantees
behind the patterns in [`../docs/`](../docs/README.md).

## Navigation & routing
- **`/` redirects** to the first repo's PR list, or to `/onboarding` when no repo
  exists. It never renders its own content.
- A stale/unknown `:repoId` shows the friendly **RepoNotFound** empty state, not a
  hard error. Active-repo resolution priority: URL `:repoId` → localStorage → first
  repo from the API.
- PR detail tab state lives in the URL (`?tab=`, `?trace=runId`) so views are
  linkable and reload-safe.

## Data & caching
- **Mutations invalidate the queries they affect** (see the per-hook map in
  [`../docs/`](../docs/README.md)); a stale list after a write is a bug.
- **Polling is conditional and self-clearing**: run/active-run queries poll only
  while something is `running` and stop when all runs settle. No unconditional
  intervals.
- **Error surfacing is status-aware**: queries toast only on network (`status 0`) or
  `5xx`; expected `4xx` stays silent for inline empty states. Mutations always toast.

## Live runs
- **`useRunEvents` opens one EventSource per run id**, accumulates events, surfaces
  `kind:"error"` as a toast, and closes every source on unmount/completion (no leaked
  connections). It complements the persisted `useRunTrace`.

## Rendering safety
- **`MermaidDiagram` renders `null` on invalid chart syntax** — untrusted/generated
  diagram text must never throw or crash the page.
- **Body-less requests omit `content-type`** (see `api.ts`) so they don't trip the
  server's empty-body guard.

## Contracts & i18n
- **Vendored Zod contracts (`src/vendor/shared`) must stay in sync** with
  `server/src/vendor/shared`; the client doesn't define its own copies of shared
  shapes.
- **User-facing strings come from `messages/en/*.json`** via `useTranslations`, not
  hardcoded JSX. A new feature adds its own namespace file.

## Tests
- Component/interaction tests run under **vitest + jsdom + RTL with `fetch` mocked** —
  they require neither the API nor a real browser. Real end-to-end journeys are the
  job of [`../../e2e`](../../e2e/README.md).

See [`../../TESTING.md`](../../TESTING.md).

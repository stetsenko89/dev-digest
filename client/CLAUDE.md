# client/ — @devdigest/web (Next.js 15 studio)

Next.js 15 (App Router) studio UI. Talks to the API over REST + SSE (live run
log). TanStack Query for server-state, next-intl for i18n, Tailwind. Thin map
only — see `Read when…`.

## Layout

- `src/app/` — App Router routes: `repos/[repoId]/pulls/[number]` (diff +
  review), `agents`, `settings/[section]`, `onboarding`.
- `src/components/` — app-shell, diff-viewer, mermaid-diagram, page-shell, …
- `src/lib/hooks/` — data hooks (TanStack Query) · `src/i18n/` + `messages/` —
  next-intl.
- `src/vendor/shared` — mirror of `@devdigest/shared` Zod contracts ·
  `src/vendor/ui` — UI primitives.

## Commands

`pnpm dev` (:3000) · `pnpm build` · `pnpm start` · `pnpm typecheck` ·
`pnpm test` (vitest + jsdom + React Testing Library).

## Conventions (non-default)

- API base + allowed origin come from env (`WEB_PORT` also sets the API's CORS
  origin). Don't hardcode ports.
- Contracts are **vendored** (`src/vendor/shared`) — keep in sync with
  `server/src/vendor/shared`; don't fork the schemas.
- Server-state goes through TanStack Query hooks in `src/lib/hooks`, not ad-hoc
  `fetch` in components.
- User-facing strings go through next-intl `messages/`, not hardcoded in JSX.

## Read when…

- Need the UI route map → read `client/README.md`.
- Need a design rationale / deep dive → read `docs/`.
- Need exact UI behavior contracts → read `specs/`.
- Hit a non-obvious gotcha → record it in `INSIGHTS.md` here (don't inline above).

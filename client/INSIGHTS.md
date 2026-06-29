# client/ — insights

Durable, non-obvious gotchas for `@devdigest/web` that the code can't reveal on its
own — append one as you learn it. **NOT** a changelog, and **NOT** duplicated
`README`/`docs` content. Keep each entry to a short fact + why it bites.

## What Works

_None yet._

## What Doesn't Work

_None yet._

## Codebase Patterns

- Severity → `{ c, bg, icon, label }` lives in `SEV`, exported from `@devdigest/ui`
  (`src/vendor/ui/primitives/tokens.ts`). Reuse it for any severity UI and render its
  icon by name via `Icon[SEV[level].icon]` — don't hardcode `var(--crit|warn|sugg)` or
  icon names. A *thinner* parallel map `SEV_COLOR` (color only) exists in
  `pulls/[number]/_components/FindingCard/constants.ts`; prefer `SEV` when you also need
  icon/label. Severity enum is exactly `CRITICAL | WARNING | SUGGESTION`
  (`shared/contracts/findings.ts`).
- On the PR detail page, findings are nested per review run (`ReviewRecord.findings`),
  not exposed as a flat list to child components. `FindingsTab` already receives
  `runs`, so derive `runs.flatMap((r) => r.findings)` in-component instead of threading
  a new prop. `page.tsx` separately computes its own `allFindings` for the
  lethal-trifecta banner — they don't share a selector.
- [2026-06-29] The PR list table's columns are defined in THREE places that must stay
  in sync — change one without the others and the header and rows misalign: `COLUMN_KEYS`
  (header labels, display order) and `GRID` (the CSS grid-template used by *both* the
  header row and every `PRRow`) in `pulls/constants.ts`, plus the cell `<div>`s in
  `pulls/_components/PRRow/PRRow.tsx`. As of now there are 7 columns and no "findings"
  column (the design mockups show one between `score` and `status`, but it isn't built).

## Tool & Library Notes

_None yet._

## Recurring Errors & Fixes

_None yet._

## Session Notes

### 2026-06-28

Added a severity-counter bar with multi-select click-to-filter to the PR detail
Findings tab (`pulls/[number]/_components/FindingsTab/SeverityCounters.tsx` + edits to
`FindingsTab.tsx` and `ReviewRunAccordion.tsx`). Counts are active-only (exclude
`dismissed_at`); the filter passes a `Severity[]` down to `ReviewRunAccordion`, which
hides runs with no matches and force-opens while filtering. Reused `SEV`/`Icon` from
`@devdigest/ui`; no changes needed to `FindingsPanel`/`FindingCard`.

## Open Questions

_None yet._

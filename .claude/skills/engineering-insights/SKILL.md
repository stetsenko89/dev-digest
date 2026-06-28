---
name: engineering-insights
description: "Capture durable, non-obvious engineering insights into the touched module's INSIGHTS.md the moment they surface during a session. Use whenever work in server/, client/, reviewer-core/, or e2e/ reveals a gotcha, a working approach, a dead end / anti-pattern, a codebase convention, a dependency quirk, a recurring error and its fix, or an open question — and when the user says record/save/remember this insight or learning, write it down, or note this for next time. Append-only; never rewrite existing entries. Trigger terms: insight, learning, gotcha, lesson learned, INSIGHTS.md, remember this, write it down, note for next time, save this."
metadata:
  tags: insights, learnings, knowledge-capture, documentation, memory
---

# Engineering Insights

Persist what this session learned so the next session in the same module reads its
own lessons. When a durable, non-obvious fact surfaces, append it to that module's
`INSIGHTS.md`. Append-only — never edit or delete existing entries.

## Procedure

1. **Route to the file** — pick by the module the work touched:

   | Path touched | Target file |
   |---|---|
   | `server/**` (incl. `src/modules/repo-intel`, `src/vendor/shared`) | `server/INSIGHTS.md` |
   | `client/**` | `client/INSIGHTS.md` |
   | `reviewer-core/**` | `reviewer-core/INSIGHTS.md` |
   | `e2e/**` | `e2e/INSIGHTS.md` |

   An insight spanning two modules → write it to each relevant file.

2. **Apply the quality gate (the "cold" test)** — write it ONLY if an agent reading
   it cold knows exactly what to do or avoid without re-investigating. If it would be
   obvious to anyone reading the code, **drop it.** One concrete fact + *why it bites*;
   name the file/function/flag. (See examples below.)

3. **Pick the section** — map the insight to one of the 7 fixed sections below.
   *What Doesn't Work* is the most valuable and most skipped — capture dead ends.

4. **Append** under that section. Never rewrite a prior entry; only extend or update
   one to resolve a conflict or avoid a duplicate. If the file has no 7-section
   skeleton yet, seed it from the template below first.

5. **Session Notes** also get a dated `### YYYY-MM-DD` line summarizing the session
   (use the real current date).

## The 7 sections

| Section | What goes in it |
|---|---|
| **What Works** | Approaches, patterns, and solutions proven effective here. |
| **What Doesn't Work** | Failed approaches, dead ends, anti-patterns to avoid. *Most valuable, most skipped — don't skip it.* |
| **Codebase Patterns** | Project-specific conventions, architecture decisions, naming patterns. |
| **Tool & Library Notes** | Quirks, gotchas, and useful behaviors discovered about dependencies. |
| **Recurring Errors & Fixes** | Errors hit more than once + the exact fix. |
| **Session Notes** | Dated `### YYYY-MM-DD` summaries of what a session accomplished. |
| **Open Questions** | Things needing more investigation or left unresolved. |

## Seed skeleton (use on first write if the file lacks sections)

Keep the file's existing intro line (`# <module>/ — insights` + the "durable,
non-obvious gotchas…" paragraph). Then append the section skeleton:

```markdown
## What Works

_None yet._

## What Doesn't Work

_None yet._

## Codebase Patterns

_None yet._

## Tool & Library Notes

_None yet._

## Recurring Errors & Fixes

_None yet._

## Session Notes

_None yet._

## Open Questions

_None yet._
```

When you append a real entry, replace that section's `_None yet._` with the entry
(as a `-` bullet). Later entries are added as additional bullets — append-only.

## The quality bar: concrete, not banal

Every entry must be **actionable "cold"** — an agent reads it and *knows what to do*
without re-investigating. Test: *"if it were obvious to anyone reading the code,
don't write it."*

### ❌ Bad (noise)
- "Promises can be tricky."
- "Be careful with async."
- "DB setup can be tricky."

### ✅ Good (cold-readable)
- "`Promise.all()` on the data-ingestion pipeline times out past 30 items — switch to
  `Promise.allSettled()` with batches of max 10 for that module."
- "Checkout-flow state must go through the Zustand `cartStore.ts` — the cart is shared
  across 3 components; local state silently desyncs here."

### ✅ Good, drawn from this repo's real gotchas
- *(Recurring Errors & Fixes, server)* "`relation … does not exist` on first run means
  migrations weren't applied — they are **NOT** auto-run on boot; run
  `cd server && pnpm db:migrate`."
- *(Codebase Patterns, reviewer-core)* "A finding that doesn't cite a real diff line is
  dropped by the grounding gate and the score is recomputed from survivors — never
  trust the model's self-reported score; don't weaken this gate."
- *(Tool & Library Notes, server)* "A DB-backed test only joins the integration suite if
  its filename ends `*.it.test.ts`; otherwise the unit/integration split silently
  misroutes it."

## Append-only, dedupe & size

- **Append-only.** Never edit or delete a prior entry. The one exception: extend or
  update an existing entry to resolve a contradiction or merge a near-duplicate —
  state the resolution explicitly rather than leaving two conflicting bullets.
- **Don't duplicate.** Before adding, scan the target section; if it's already there,
  extend that entry instead of adding a second.
- **Size ceiling (~200 entries).** Past that, signal-to-noise drops — flag it for a
  prune rather than piling on.

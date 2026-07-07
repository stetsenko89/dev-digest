# reviewer-core/ — behavioral contracts

The invariants a change to `@devdigest/reviewer-core` must preserve. These are the
engine's **safety- and trust-critical guarantees** — most are pinned by the hermetic
vitest suite (`test/{prompt,run,to-review}.test.ts`, stubbed `LLMProvider`, no keys).
Background design is in [`../docs/`](../docs/README.md).

## Grounding is mandatory
- A finding whose `[start_line, end_line]` doesn't intersect a real diff hunk for its
  file is **dropped** (full-file kinds — `secret_leak`, `lethal_trifecta`, `phantom`,
  `hook` — only require the file to be present). The model cannot hallucinate
  locations into the output.
- **The score is recomputed from the surviving findings** (`scoreFromFindings`), never
  trusted from the model. The number on screen can't contradict the findings beneath
  it. *(pinned by `test/run.test.ts`)*

## Prompt-injection defense
- **`INJECTION_GUARD` is appended to every system prompt** on every path (studio +
  CI), because both go through `assemblePrompt`.
- **Stated intent never descopes the review.** Claims that code is a test fixture /
  intentional / demo / "do not flag" — *in any language* — do not waive or reduce a
  real finding; defects are reported at true severity. Defense is the one trusted
  rule, **not** keyword scanning. *(pinned by `test/prompt.test.ts`)*

## Prompt stability
- **An absent optional slot produces an identical prompt.** Adding/omitting `skills`,
  `memory`, `specs`, `repoMap`, `callers`, or `prDescription` when empty must not
  change a single byte of the assembled prompt — so enrichment can be toggled without
  shifting model behavior.
- Untrusted content is always delimiter-wrapped via `wrapUntrusted`, which escapes
  nested `</untrusted>`.

## CI output
- **The review event is deterministic** — APPROVE / COMMENT / REQUEST_CHANGES is
  computed from finding severities + the `failOn` gate, **never** from the model's
  self-reported verdict. `countBlockers` agrees with `gateTriggered`.
- **Findings are never silently dropped from output.** An inline comment with no valid
  diff-line anchor is omitted, but the finding still appears in the review body.
  *(pinned by `test/to-review.test.ts`)*

## Engine boundaries
- **Purity:** no DB, GitHub, or filesystem access — the only side effect is the
  injected `LLMProvider`. This is what makes the engine mock-testable and shareable by
  the studio server and the CI runner.
- **Structured output is retried** up to `maxRetries+1` attempts on schema-validation
  failure, re-prompting with the parse error; `sessionId` is forwarded to every LLM
  call for session grouping.

See [`../../TESTING.md`](../../TESTING.md).

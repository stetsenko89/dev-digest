import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReviewRecord } from "@devdigest/shared";
import messages from "../../../../../../../messages/en/prReview.json";

vi.mock("../../../../../../lib/hooks/reviews", () => ({
  usePrReviews: vi.fn(),
}));

import { usePrReviews } from "../../../../../../lib/hooks/reviews";
import { FindingsPopup } from "./FindingsPopup";

afterEach(cleanup);

const ANCHOR = new DOMRect(100, 200, 100, 30);

const REVIEWS: ReviewRecord[] = [
  {
    id: "rev1",
    pr_id: "pr1",
    agent_id: "agent1",
    run_id: "run1",
    agent_name: "TestAgent",
    kind: "review",
    verdict: "request_changes",
    summary: null,
    score: 70,
    model: null,
    grounding: null,
    created_at: "2024-01-01T00:00:00Z",
    findings: [
      {
        id: "f1",
        severity: "CRITICAL",
        category: "security",
        title: "Hardcoded secret",
        file: "src/config.ts",
        start_line: 11,
        end_line: 11,
        rationale: "A secret is committed directly to source.",
        suggestion: null,
        confidence: 0.95,
        kind: "finding",
        trifecta_components: null,
        evidence: null,
        review_id: "rev1",
        accepted_at: null,
        dismissed_at: null,
      },
      {
        id: "f2",
        severity: "WARNING",
        category: "perf",
        title: "Inefficient loop",
        file: "src/utils.ts",
        start_line: 42,
        end_line: 50,
        rationale: "Loop iterates unnecessarily.",
        suggestion: null,
        confidence: 0.75,
        kind: "finding",
        trifecta_components: null,
        evidence: null,
        review_id: "rev1",
        accepted_at: null,
        dismissed_at: null,
      },
      {
        id: "f3",
        severity: "CRITICAL",
        category: "bug",
        title: "Dismissed critical finding",
        file: "src/auth.ts",
        start_line: 5,
        end_line: 5,
        rationale: "This was dismissed.",
        suggestion: null,
        confidence: 0.9,
        kind: "finding",
        trifecta_components: null,
        evidence: null,
        review_id: "rev1",
        accepted_at: null,
        dismissed_at: "2024-01-02T00:00:00Z",
      },
    ],
  },
  // An OLDER review run (newest-first ordering → this comes after rev1). Its
  // findings must NOT appear: the popup mirrors the column, which counts only
  // the latest review. Without that scoping, this stale finding would leak in.
  {
    id: "rev0",
    pr_id: "pr1",
    agent_id: "agent0",
    run_id: "run0",
    agent_name: "OldAgent",
    kind: "review",
    verdict: "request_changes",
    summary: null,
    score: 40,
    model: null,
    grounding: null,
    created_at: "2023-12-01T00:00:00Z",
    findings: [
      {
        id: "f0",
        severity: "CRITICAL",
        category: "bug",
        title: "Stale finding from an earlier run",
        file: "src/old.ts",
        start_line: 1,
        end_line: 1,
        rationale: "From a previous review generation.",
        suggestion: null,
        confidence: 0.8,
        kind: "finding",
        trifecta_components: null,
        evidence: null,
        review_id: "rev0",
        accepted_at: null,
        dismissed_at: null,
      },
    ],
  },
];

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

describe("FindingsPopup", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1200,
    });
  });

  it("shows all non-dismissed findings sorted by severity (CRITICAL first, then WARNING)", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: REVIEWS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    // Non-dismissed CRITICAL finding title and file:line are shown
    expect(screen.getByText("Hardcoded secret")).toBeInTheDocument();
    expect(screen.getByText("src/config.ts:11")).toBeInTheDocument();

    // WARNING finding IS also shown (all severities shown now)
    expect(screen.getByText("Inefficient loop")).toBeInTheDocument();

    // Dismissed CRITICAL finding is NOT shown
    expect(screen.queryByText("Dismissed critical finding")).not.toBeInTheDocument();

    // REVIEWS has two different agent_ids (agent1 + agent0) — BOTH are each
    // agent's latest, so the finding from agent0 (rev0) now legitimately appears.
    expect(screen.getByText("Stale finding from an earlier run")).toBeInTheDocument();

    // Header shows count of non-dismissed findings across all agents' latest
    // reviews (3: f1 from agent1 + f2 from agent1 + f0 from agent0)
    expect(screen.getByText("3 findings")).toBeInTheDocument();
  });

  it("shows findings from two different agents combined", () => {
    const reviews: ReviewRecord[] = [
      {
        id: "revA",
        pr_id: "pr1",
        agent_id: "agentA",
        run_id: "runA",
        agent_name: "AgentA",
        kind: "review",
        verdict: "request_changes",
        summary: null,
        score: 80,
        model: null,
        grounding: null,
        created_at: "2024-02-01T00:00:00Z",
        findings: [
          {
            id: "fA",
            severity: "WARNING",
            category: "perf",
            title: "Finding from agent A",
            file: "src/a.ts",
            start_line: 1,
            end_line: 1,
            rationale: "From agent A.",
            suggestion: null,
            confidence: 0.8,
            kind: "finding",
            trifecta_components: null,
            evidence: null,
            review_id: "revA",
            accepted_at: null,
            dismissed_at: null,
          },
        ],
      },
      {
        id: "revB",
        pr_id: "pr1",
        agent_id: "agentB",
        run_id: "runB",
        agent_name: "AgentB",
        kind: "review",
        verdict: "approve",
        summary: null,
        score: 90,
        model: null,
        grounding: null,
        created_at: "2024-02-01T00:00:00Z",
        findings: [
          {
            id: "fB",
            severity: "CRITICAL",
            category: "security",
            title: "Finding from agent B",
            file: "src/b.ts",
            start_line: 5,
            end_line: 5,
            rationale: "From agent B.",
            suggestion: null,
            confidence: 0.9,
            kind: "finding",
            trifecta_components: null,
            evidence: null,
            review_id: "revB",
            accepted_at: null,
            dismissed_at: null,
          },
        ],
      },
    ];

    vi.mocked(usePrReviews).mockReturnValue({
      data: reviews,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    // Both agents' findings appear
    expect(screen.getByText("Finding from agent A")).toBeInTheDocument();
    expect(screen.getByText("Finding from agent B")).toBeInTheDocument();
    expect(screen.getByText("2 findings")).toBeInTheDocument();
  });

  it("shows only the newest review's findings when two reviews share the same agent_id", () => {
    const newerReview: ReviewRecord = {
      id: "revNew",
      pr_id: "pr1",
      agent_id: "sharedAgent",
      run_id: "runNew",
      agent_name: "SharedAgent",
      kind: "review",
      verdict: "approve",
      summary: null,
      score: 90,
      model: null,
      grounding: null,
      created_at: "2024-03-01T00:00:00Z",
      findings: [
        {
          id: "fNew",
          severity: "WARNING",
          category: "perf",
          title: "Finding from newer run",
          file: "src/new.ts",
          start_line: 10,
          end_line: 10,
          rationale: "From the newer run.",
          suggestion: null,
          confidence: 0.8,
          kind: "finding",
          trifecta_components: null,
          evidence: null,
          review_id: "revNew",
          accepted_at: null,
          dismissed_at: null,
        },
      ],
    };
    const olderReview: ReviewRecord = {
      id: "revOld",
      pr_id: "pr1",
      agent_id: "sharedAgent",
      run_id: "runOld",
      agent_name: "SharedAgent",
      kind: "review",
      verdict: "request_changes",
      summary: null,
      score: 50,
      model: null,
      grounding: null,
      created_at: "2024-01-01T00:00:00Z",
      findings: [
        {
          id: "fOld",
          severity: "CRITICAL",
          category: "bug",
          title: "Finding from older run",
          file: "src/old.ts",
          start_line: 1,
          end_line: 1,
          rationale: "From the older run — must be excluded.",
          suggestion: null,
          confidence: 0.7,
          kind: "finding",
          trifecta_components: null,
          evidence: null,
          review_id: "revOld",
          accepted_at: null,
          dismissed_at: null,
        },
      ],
    };

    // Newest-first ordering matches what the API returns
    vi.mocked(usePrReviews).mockReturnValue({
      data: [newerReview, olderReview],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    // Only the newer run's finding is shown
    expect(screen.getByText("Finding from newer run")).toBeInTheDocument();
    // The older same-agent run's finding is excluded
    expect(screen.queryByText("Finding from older run")).not.toBeInTheDocument();
    expect(screen.getByText("1 findings")).toBeInTheDocument();
  });

  it("shows empty state when there are no non-dismissed findings", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: [
        {
          ...REVIEWS[0]!,
          findings: REVIEWS[0]!.findings.map((f) => ({
            ...f,
            dismissed_at: "2024-01-02T00:00:00Z",
          })),
        },
      ],
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("No any findings")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Loading findings…")).toBeInTheDocument();
  });

  it("shows error state", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof usePrReviews>);

    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Couldn't load findings.")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: REVIEWS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    const onClose = vi.fn();
    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when clicking outside the popover", () => {
    vi.mocked(usePrReviews).mockReturnValue({
      data: REVIEWS,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePrReviews>);

    const onClose = vi.fn();
    renderWithIntl(
      <FindingsPopup
        prId="pr1"
        prNumber={42}
        anchor={ANCHOR}
        onClose={onClose}
      />,
    );

    fireEvent.mouseDown(document.body);
    expect(onClose).toHaveBeenCalledOnce();
  });
});

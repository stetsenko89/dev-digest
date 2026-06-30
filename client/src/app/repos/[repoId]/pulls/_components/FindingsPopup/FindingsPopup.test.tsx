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

    // A CRITICAL finding from an OLDER review run is NOT shown (latest review only)
    expect(screen.queryByText("Stale finding from an earlier run")).not.toBeInTheDocument();

    // Header shows count of non-dismissed findings (2: f1 + f2)
    expect(screen.getByText("2 findings")).toBeInTheDocument();
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

import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Severity } from "@devdigest/shared";
import messages from "../../../../../../../../messages/en/prReview.json";

import { SeverityCounters } from "./SeverityCounters";

afterEach(cleanup);

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={{ prReview: messages }}>
      {ui}
    </NextIntlClientProvider>,
  );
}

const DEFAULT_COUNTS: Record<Severity, number> = {
  CRITICAL: 3,
  WARNING: 5,
  SUGGESTION: 2,
};

describe("SeverityCounters", () => {
  it("renders CRITICAL, WARNING, SUGGESTION labels with their counts", () => {
    renderWithIntl(
      <SeverityCounters counts={DEFAULT_COUNTS} active={[]} onToggle={vi.fn()} />,
    );
    expect(screen.getByText(/3/)).toBeInTheDocument();
    expect(screen.getByText(/CRITICAL/)).toBeInTheDocument();
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/WARNING/)).toBeInTheDocument();
    expect(screen.getByText(/2/)).toBeInTheDocument();
    expect(screen.getByText(/SUGGESTION/)).toBeInTheDocument();
  });

  it("calls onToggle with the level when a chip is clicked", () => {
    const onToggle = vi.fn();
    renderWithIntl(
      <SeverityCounters counts={DEFAULT_COUNTS} active={[]} onToggle={onToggle} />,
    );
    const critBtn = screen.getByRole("button", { name: /Show only Critical findings/i });
    fireEvent.click(critBtn);
    expect(onToggle).toHaveBeenCalledWith("CRITICAL");
  });

  it("disables zero-count chips and does not call onToggle when clicked", () => {
    const onToggle = vi.fn();
    const countsWithZeroSugg: Record<Severity, number> = { CRITICAL: 3, WARNING: 5, SUGGESTION: 0 };
    renderWithIntl(
      <SeverityCounters counts={countsWithZeroSugg} active={[]} onToggle={onToggle} />,
    );
    const suggBtn = screen.getByRole("button", { name: /Show only Suggestion findings/i });
    expect(suggBtn).toBeDisabled();
    fireEvent.click(suggBtn);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("sets aria-pressed=true for active levels", () => {
    renderWithIntl(
      <SeverityCounters counts={DEFAULT_COUNTS} active={["CRITICAL"]} onToggle={vi.fn()} />,
    );
    const critBtn = screen.getByRole("button", { name: /Show only Critical findings/i });
    expect(critBtn).toHaveAttribute("aria-pressed", "true");

    const warnBtn = screen.getByRole("button", { name: /Show only Warning findings/i });
    expect(warnBtn).toHaveAttribute("aria-pressed", "false");
  });
});

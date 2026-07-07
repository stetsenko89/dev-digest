import React from "react";

/** Format a USD cost value to a compact string (4 sig-figs), or "—" for null/zero. */
function formatCost(usd: number | null | undefined): string {
  if (usd == null || usd === 0) return "—";
  return `$${usd.toPrecision(4)}`;
}

/** Format total token count to a compact "9,119" style string. */
function formatTokenCount(tokensIn: number, tokensOut: number): string {
  const total = tokensIn + tokensOut;
  return total.toLocaleString("en-US");
}

/**
 * RunCostBadge — renders LLM cost in two variants:
 *  - compact:  "$0.0013"  (for the PR-list COST column)
 *  - detailed: "9,119 tok · $0.0013"  (for the run timeline row)
 *
 * null/undefined cost always renders "—", never "$0.00".
 */
export function RunCostBadge({
  costUsd,
  tokensIn = 0,
  tokensOut = 0,
  variant = "compact",
}: {
  costUsd: number | null | undefined;
  tokensIn?: number;
  tokensOut?: number;
  variant?: "compact" | "detailed";
}) {
  const cost = formatCost(costUsd);

  if (variant === "compact") {
    return (
      <span
        className="tnum"
        style={{
          fontSize: 12,
          color: costUsd != null ? "var(--text-secondary)" : "var(--text-muted)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {cost}
      </span>
    );
  }

  // detailed variant
  if (costUsd == null) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
    );
  }

  const tokens = formatTokenCount(tokensIn, tokensOut);
  return (
    <span
      className="tnum"
      style={{
        fontSize: 12,
        color: "var(--text-muted)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      {tokens} tok · {cost}
    </span>
  );
}

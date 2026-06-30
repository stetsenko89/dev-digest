/* FindingsPopup — fixed-position popover listing ALL findings (sorted by severity)
   for a PR, fetched on demand when a severity count icon is clicked in the PR list. */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  SeverityBadge,
  CategoryTag,
  ConfidenceNum,
} from "@devdigest/ui";
import type { Severity } from "@devdigest/shared";
import { usePrReviews } from "@/lib/hooks/reviews";
import { s } from "./FindingsPopup.styles";

function lineLabel(f: { start_line: number; end_line: number }): string {
  return f.start_line === f.end_line
    ? `${f.start_line}`
    : `${f.start_line}-${f.end_line}`;
}

const SEV_ORDER = ["CRITICAL", "WARNING", "SUGGESTION"] as const;

export function FindingsPopup({
  prId,
  prNumber,
  anchor,
  onClose,
}: {
  prId: string;
  prNumber: number;
  anchor: DOMRect;
  onClose: () => void;
}) {
  const t = useTranslations("prReview");
  const { data: reviews, isLoading, isError } = usePrReviews(prId);
  const ref = React.useRef<HTMLDivElement>(null);

  // Match the PR-list FINDINGS column exactly: the server counts only each PR's
  // LATEST review (newest kind:"review"), non-dismissed findings — NOT every
  // historical review run. The /pulls/:id/reviews endpoint returns reviews
  // newest-first, so the first kind:"review" is that latest review. Flattening
  // across all reviews would surface stale findings from earlier generations and
  // disagree with the count shown in the column.
  const latestReview = (reviews ?? []).find((r) => r.kind === "review") ?? null;
  const findings = (latestReview?.findings ?? [])
    .filter((f) => !f.dismissed_at)
    .sort(
      (a, b) =>
        SEV_ORDER.indexOf(a.severity as (typeof SEV_ORDER)[number]) -
        SEV_ORDER.indexOf(b.severity as (typeof SEV_ORDER)[number]),
    );

  React.useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top: anchor.bottom + 8,
        left: Math.min(anchor.left, window.innerWidth - 400),
        zIndex: 1000,
        width: 380,
        maxHeight: 440,
        overflowY: "auto",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      {/* sticky header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 0,
          background: "var(--bg-elevated)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: 0.8,
          }}
        >
          {findings.length} findings
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            padding: "0 2px",
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: 16,
            lineHeight: 1,
          }}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* body */}
      {isLoading ? (
        <div style={s.state}>{t("list.findingsPopup.loading")}</div>
      ) : isError ? (
        <div style={s.state}>{t("list.findingsPopup.error")}</div>
      ) : findings.length === 0 ? (
        <div style={s.state}>{t("list.findingsPopup.empty", { severity: "any" })}</div>
      ) : (
        <ul style={s.list}>
          {findings.map((f) => (
            <li key={f.id} style={s.row}>
              <div style={s.rowTop}>
                <SeverityBadge severity={f.severity as Severity} compact />
                <span style={s.title}>{f.title}</span>
                <CategoryTag category={f.category as "bug" | "security" | "perf" | "style" | "test"} />
              </div>
              <div style={s.rowMeta}>
                <span className="mono" style={s.fileLine}>
                  {f.file}:{lineLabel(f)}
                </span>
                <ConfidenceNum value={f.confidence} />
              </div>
              <div style={s.rationale}>{f.rationale}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

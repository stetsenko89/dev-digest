/* FindingsPopup — compact read-only modal listing findings of a single severity
   for a PR, fetched on demand when the severity count is clicked in the PR list. */
"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Modal,
  SeverityBadge,
  CategoryTag,
  ConfidenceNum,
  SEV,
} from "@devdigest/ui";
import type { Severity } from "@devdigest/shared";
import { usePrReviews } from "@/lib/hooks/reviews";
import { s } from "./FindingsPopup.styles";

function lineLabel(f: { start_line: number; end_line: number }): string {
  return f.start_line === f.end_line
    ? `${f.start_line}`
    : `${f.start_line}-${f.end_line}`;
}

export function FindingsPopup({
  prId,
  prNumber,
  severity,
  onClose,
}: {
  prId: string;
  prNumber: number;
  severity: Severity;
  onClose: () => void;
}) {
  const t = useTranslations("prReview");
  const { data: reviews, isLoading, isError } = usePrReviews(prId);

  // Match the PR-list FINDINGS column exactly: the server counts only each PR's
  // LATEST review (newest kind:"review"), non-dismissed findings — NOT every
  // historical review run. The /pulls/:id/reviews endpoint returns reviews
  // newest-first, so the first kind:"review" is that latest review. Flattening
  // across all reviews would surface stale findings from earlier generations and
  // disagree with the count shown in the column.
  const latestReview = (reviews ?? []).find((r) => r.kind === "review") ?? null;
  const findings = (latestReview?.findings ?? []).filter(
    (f) => f.severity === severity && !f.dismissed_at,
  );

  const title = t("list.findingsPopup.title", {
    number: prNumber,
    severity: SEV[severity].label,
  });

  return (
    <Modal title={title} onClose={onClose}>
      {isLoading ? (
        <div style={s.state}>{t("list.findingsPopup.loading")}</div>
      ) : isError ? (
        <div style={s.state}>{t("list.findingsPopup.error")}</div>
      ) : findings.length === 0 ? (
        <div style={s.state}>
          {t("list.findingsPopup.empty", { severity: SEV[severity].label })}
        </div>
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
    </Modal>
  );
}

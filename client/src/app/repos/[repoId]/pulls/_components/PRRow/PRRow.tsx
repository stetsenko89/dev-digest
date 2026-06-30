/* PRRow — one clickable row in the PR list table. Ported from screen_dashboard.jsx. */
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Icon, Avatar, Badge, CircularScore, RunCostBadge, RelativeTime, SEV } from "@devdigest/ui";
import type { PrMeta } from "@/lib/types";
import { SIZE_COLOR, STATUS_META } from "../../constants";
import { sizeOf } from "../../helpers";
import { s } from "../../styles";
import { FindingsPopup } from "../FindingsPopup";

export function PRRow({ pr, repoId }: { pr: PrMeta; repoId: string }) {
  const t = useTranslations("prReview");
  const router = useRouter();
  const [h, setH] = React.useState(false);
  const [popup, setPopup] = React.useState<DOMRect | null>(null);
  const st = STATUS_META[pr.status] ?? STATUS_META.needs_review!;
  const { size, lines } = sizeOf(pr);
  const reviewed = pr.score != null; // null score ⇒ PR has never been reviewed
  return (
    <>
    <div
      onMouseEnter={() => setH(true)}
      onMouseLeave={() => setH(false)}
      onClick={() => router.push(`/repos/${repoId}/pulls/${pr.number}`)}
      style={s.row(h)}
    >
      <div style={s.rowTitleCell}>
        <Icon.GitPullRequest size={15} style={s.rowIcon(st.c)} />
        <div style={s.rowTitleWrap}>
          <div style={s.rowTitle(h)}>{pr.title}</div>
          <span className="mono" style={s.rowNumber}>
            #{pr.number}
          </span>
        </div>
      </div>
      <div style={s.authorCell}>
        <Avatar name={pr.author} size={18} />
        {pr.author}
      </div>
      <div>
        <Badge
          color={SIZE_COLOR[size]}
          bg="transparent"
          style={s.sizeBadgeBorder(SIZE_COLOR[size]!)}
        >
          {size} · {lines}
        </Badge>
      </div>
      <div style={s.scoreCell}>
        {reviewed ? (
          <CircularScore score={pr.score!} size={34} stroke={3} />
        ) : (
          <span style={s.muted}>—</span>
        )}
      </div>
      <div style={s.findingsCell}>
        {(["CRITICAL", "WARNING", "SUGGESTION"] as const).map((level) => {
          const { c, icon } = SEV[level];
          const n = pr.findings?.[level] ?? 0;
          const IconCmp = Icon[icon];
          const inner = (
            <>
              <IconCmp size={12} />
              <span style={{ fontSize: 11, fontVariantNumeric: "tabular-nums" }}>{n}</span>
            </>
          );
          if (n > 0 && pr.id) {
            return (
              <button
                key={level}
                aria-label={`Show ${SEV[level].label} findings for PR #${pr.number}`}
                onClick={(e) => { e.stopPropagation(); const rect = e.currentTarget.getBoundingClientRect(); setPopup((prev) => (prev ? null : rect)); }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 2,
                  color: c,
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {inner}
              </button>
            );
          }
          return (
            <span key={level} style={{ display: "inline-flex", alignItems: "center", gap: 2, color: "var(--text-muted)" }}>
              {inner}
            </span>
          );
        })}
      </div>
      <div>
        <Badge dot color={st.c} bg="transparent">
          {t(`list.status.${st.labelKey}`)}
        </Badge>
      </div>
      <div style={s.costCell}>
        <RunCostBadge variant="compact" costUsd={pr.cost_usd} />
      </div>
      <div style={s.updatedCell}><RelativeTime iso={pr.updated_at} /></div>
    </div>
    {popup && pr.id && (
      <FindingsPopup
        prId={pr.id}
        prNumber={pr.number}
        anchor={popup}
        onClose={() => setPopup(null)}
      />
    )}
    </>
  );
}

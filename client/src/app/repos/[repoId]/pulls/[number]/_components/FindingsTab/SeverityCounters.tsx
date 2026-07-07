"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Icon, SEV } from "@devdigest/ui";
import type { Severity } from "@devdigest/shared";
import { s } from "./SeverityCounters.styles";

const LEVELS: Severity[] = ["CRITICAL", "WARNING", "SUGGESTION"];

interface SeverityCountersProps {
  counts: Record<Severity, number>;
  active: Severity[];
  onToggle: (s: Severity) => void;
}

export function SeverityCounters({ counts, active, onToggle }: SeverityCountersProps) {
  const t = useTranslations("prReview");

  return (
    <div style={s.bar}>
      {LEVELS.map((level, i) => {
        const { c, bg, icon, label } = SEV[level];
        const IconCmp = Icon[icon];
        const isActive = active.includes(level);
        const isDisabled = counts[level] === 0;

        return (
          <React.Fragment key={level}>
            {i > 0 && <span style={s.separator} aria-hidden>·</span>}
            <button
              style={s.chip(c, bg, isActive, isDisabled)}
              disabled={isDisabled}
              aria-pressed={isActive}
              aria-label={t("severityCounters.showOnly", { label })}
              onClick={() => !isDisabled && onToggle(level)}
            >
              <IconCmp size={13} />
              {counts[level]}
              {" "}
              {t(`severityCounters.${level}` as `severityCounters.${Severity}`)}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

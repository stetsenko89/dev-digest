"use client";

import React from "react";
import { SeverityBadge, CategoryTag, ConfidenceNum } from "@devdigest/ui";
import type { FindingRecord, Severity } from "@devdigest/shared";

function lineLabel(f: { start_line: number; end_line: number }): string {
  return f.start_line === f.end_line ? `${f.start_line}` : `${f.start_line}-${f.end_line}`;
}

export function RunFindingsPopover({
  findings,
  anchor,
  onClose,
}: {
  findings: FindingRecord[];
  anchor: DOMRect;
  onClose: () => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const top = anchor.bottom + 8;
  const left = Math.min(anchor.left, window.innerWidth - 376);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        top,
        left,
        zIndex: 1000,
        width: 360,
        maxHeight: 420,
        overflowY: "auto",
        background: "var(--bg-elevated)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
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
          {findings.length} findings in this run
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

      {(["CRITICAL", "WARNING", "SUGGESTION"] as const).map((sev) => {
        const sevFindings = findings.filter((f) => f.severity === sev);
        if (sevFindings.length === 0) return null;
        return sevFindings.map((f) => (
          <div
            key={f.id}
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <SeverityBadge severity={f.severity as Severity} compact />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={f.title}
              >
                {f.title}
              </span>
              <CategoryTag category={f.category as "bug" | "security" | "perf" | "style" | "test"} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {f.file}:{lineLabel(f)}
              </span>
              <ConfidenceNum value={f.confidence} />
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.4 }}>
              {f.rationale.length > 130 ? f.rationale.slice(0, 130) + "…" : f.rationale}
            </div>
          </div>
        ));
      })}

      {findings.length === 0 && (
        <div style={{ padding: 16, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
          No findings for this run.
        </div>
      )}
    </div>
  );
}

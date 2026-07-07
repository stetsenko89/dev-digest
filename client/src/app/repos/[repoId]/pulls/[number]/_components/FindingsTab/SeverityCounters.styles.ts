import type { CSSProperties } from "react";

export const s = {
  bar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
    flexWrap: "wrap",
  } satisfies CSSProperties,
  separator: {
    color: "var(--text-muted)",
    fontSize: 14,
    userSelect: "none",
  } satisfies CSSProperties,
  chip: (
    color: string,
    bg: string,
    active: boolean,
    disabled: boolean,
  ): CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer",
    color: disabled ? "var(--text-muted)" : color,
    background: active ? bg : "transparent",
    border: active ? `1px solid ${color}` : "1px solid transparent",
    opacity: disabled ? 0.5 : 1,
    transition: "background .12s, border-color .12s",
  }),
} as const;

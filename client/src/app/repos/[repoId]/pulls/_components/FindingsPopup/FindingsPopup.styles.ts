import type { CSSProperties } from "react";

export const s = {
  state: {
    padding: "24px",
    color: "var(--text-muted)",
    fontSize: 14,
  } satisfies CSSProperties,

  list: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  } satisfies CSSProperties,

  row: {
    padding: "14px 24px",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  } satisfies CSSProperties,

  rowTop: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  } satisfies CSSProperties,

  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "var(--text-primary)",
    flex: 1,
    minWidth: 0,
  } satisfies CSSProperties,

  rowMeta: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  } satisfies CSSProperties,

  fileLine: {
    fontSize: 12,
    color: "var(--accent)",
  } satisfies CSSProperties,

  rationale: {
    fontSize: 13,
    color: "var(--text-secondary)",
    lineHeight: 1.5,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 1,
    WebkitBoxOrient: "vertical",
    textOverflow: "ellipsis",
  } satisfies CSSProperties,
} as const;

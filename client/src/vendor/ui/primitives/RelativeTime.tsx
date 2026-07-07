"use client";

/**
 * RelativeTime — hydration-safe relative-time display (e.g. "3h", "2d").
 *
 * Same mounted-gate pattern as LocalTime: the first render emits nothing so
 * the server HTML and the initial client tree match. After mount, the
 * relative-time string (which depends on Date.now()) is computed and shown.
 *
 * Formatting rules (matching the original relativeTime helper):
 *   !iso or invalid → "—"
 *   < 1 min         → "now"
 *   < 60 min        → "Nm"
 *   < 24 h          → "Nh"
 *   else            → "Nd"
 *
 * Props:
 *   iso — ISO-8601 string (or null/undefined).
 */

import React, { useState, useEffect } from "react";

function computeRelative(iso: string | null | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const m = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function RelativeTime({ iso }: { iso: string | null | undefined }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    setText(computeRelative(iso));
  }, [iso]);

  // Render nothing until mounted — server HTML and first client pass are identical.
  if (text === null) return null;

  return <>{text}</>;
}

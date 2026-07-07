"use client";

/**
 * LocalTime — hydration-safe local-time display.
 *
 * The server and first client render produce no output (null text), so the
 * serialised HTML matches the initial React tree. After mount, useEffect fills
 * in the locale-formatted local time. This eliminates the hydration mismatch
 * caused by ambient toLocaleString / toLocaleTimeString calls during render,
 * where the server runs in UTC but the browser uses the user's local timezone.
 *
 * Props:
 *   iso   — ISO-8601 string (or null/undefined → renders "—").
 *   mode  — "time" | "datetime" | "date" (default "datetime").
 */

import React, { useState, useEffect } from "react";

export type LocalTimeMode = "time" | "datetime" | "date";

export function LocalTime({
  iso,
  mode = "datetime",
}: {
  iso: string | null | undefined;
  mode?: LocalTimeMode;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    if (!iso) {
      setText("—");
      return;
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      setText(iso);
      return;
    }
    if (mode === "time") setText(d.toLocaleTimeString());
    else if (mode === "date") setText(d.toLocaleDateString());
    else setText(d.toLocaleString());
  }, [iso, mode]);

  // Render nothing until mounted — server HTML and first client pass are identical.
  if (text === null) return null;

  return <>{text}</>;
}

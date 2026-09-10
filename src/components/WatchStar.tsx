"use client";

import { useState } from "react";

export function WatchStar({
  pageId,
  pageName,
  initial,
}: {
  pageId: string;
  pageName: string;
  initial: boolean;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch("/api/pages/watch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pageId, pageName, watch: !on }),
    });
    if (res.ok) setOn(!on);
    setBusy(false);
  }

  return (
    <span
      className={"star" + (on ? " on" : "")}
      onClick={busy ? undefined : toggle}
      title={on ? "parar de acompanhar" : "acompanhar"}
    >
      {on ? "★" : "☆"}
    </span>
  );
}

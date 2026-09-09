"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface SourceView {
  id: string;
  nicheLabel: string;
  markets: string;
  status: string;
  keywordCount: number;
  lastRunAt: string | null;
  offerCount: number;
  lastRunStatus: string | null;
}

export function SourceRow({ source }: { source: SourceView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/sources/${source.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: source.status === "active" ? "paused" : "active" }),
    });
    setBusy(false);
    router.refresh();
  }

  async function runNow() {
    setBusy(true);
    await fetch(`/api/sources/${source.id}/run`, { method: "POST" }).catch(() => {});
    setBusy(false);
    setTimeout(() => router.refresh(), 800);
  }

  const active = source.status === "active";

  return (
    <div className="src" style={{ opacity: active ? 1 : 0.6 }}>
      <span className={"dot " + (active ? "on" : "off")} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div>
          {source.nicheLabel} · {source.markets}
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          {source.keywordCount} palavras-chave ·{" "}
          {source.lastRunAt ? `última rodada ${new Date(source.lastRunAt).toLocaleString("pt-BR")}` : "nunca minerada"} ·{" "}
          {source.offerCount} ofertas
          {source.lastRunStatus === "error" ? " · última rodada com erro" : ""}
        </div>
      </div>
      <button className="btn ghost" disabled={busy} onClick={runNow} style={{ fontSize: 12 }}>
        minerar agora
      </button>
      <button className="btn ghost" disabled={busy} onClick={toggle} style={{ fontSize: 12 }}>
        {active ? "pausar" : "retomar"}
      </button>
    </div>
  );
}

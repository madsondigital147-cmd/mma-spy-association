"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OfferActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(s: string) {
    setBusy(true);
    await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="actions" style={{ flexShrink: 0 }}>
      {status !== "approved" && (
        <button className="btn primary" disabled={busy} onClick={() => act("approved")}>
          Aprovar
        </button>
      )}
      {status !== "testing" && (
        <button className="btn" disabled={busy} onClick={() => act("testing")}>
          Vou testar
        </button>
      )}
      {status !== "ignored" && (
        <button className="btn ghost" disabled={busy} onClick={() => act("ignored")}>
          Ignorar
        </button>
      )}
      {status !== "new" && (
        <button className="btn ghost" disabled={busy} onClick={() => act("new")}>
          ← fila
        </button>
      )}
    </div>
  );
}

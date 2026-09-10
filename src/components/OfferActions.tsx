"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OfferActions({ id, status, favorite }: { id: string; status: string; favorite: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fav, setFav] = useState(favorite);

  async function patch(body: object) {
    setBusy(true);
    await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
  }

  return (
    <div className="actions" style={{ flexShrink: 0, alignItems: "center" }}>
      <span
        className={"star" + (fav ? " on" : "")}
        style={{ fontSize: 20 }}
        title="favoritar"
        onClick={() => {
          patch({ favorite: !fav });
          setFav(!fav);
        }}
      >
        {fav ? "★" : "☆"}
      </span>
      {status !== "approved" && (
        <button className="btn primary" disabled={busy} onClick={() => patch({ status: "approved" }).then(() => router.refresh())}>
          Aprovar
        </button>
      )}
      {status !== "testing" && (
        <button className="btn" disabled={busy} onClick={() => patch({ status: "testing" }).then(() => router.refresh())}>
          Vou testar
        </button>
      )}
      {status !== "ignored" && (
        <button className="btn ghost" disabled={busy} onClick={() => patch({ status: "ignored" }).then(() => router.refresh())}>
          Ignorar
        </button>
      )}
      {status !== "new" && (
        <button className="btn ghost" disabled={busy} onClick={() => patch({ status: "new" }).then(() => router.refresh())}>
          ← fila
        </button>
      )}
    </div>
  );
}

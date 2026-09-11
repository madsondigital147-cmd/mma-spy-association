"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OfferActions({ id, status, favorite }: { id: string; status: string; favorite: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fav, setFav] = useState(favorite);
  const [roas, setRoas] = useState("");
  const [profit, setProfit] = useState("");

  async function patch(body: object) {
    setBusy(true);
    await fetch(`/api/offers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
  }

  function closeTest(testResult: "win" | "loss") {
    const body: Record<string, unknown> = { testResult };
    const roasNum = Number(roas.replace(",", "."));
    const profitNum = Number(profit.replace(",", "."));
    if (roas && Number.isFinite(roasNum)) body.roas = roasNum;
    if (profit && Number.isFinite(profitNum)) body.profitCents = Math.round(profitNum * 100);
    return patch(body).then(() => router.refresh());
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
      {status === "testing" && (
        <>
          <input
            type="text"
            inputMode="decimal"
            placeholder="ROAS real"
            value={roas}
            onChange={(e) => setRoas(e.target.value)}
            style={{ width: 82, fontSize: 12 }}
            title="ROAS real da campanha (opcional) — alimenta o score de volta"
          />
          <input
            type="text"
            inputMode="decimal"
            placeholder="lucro R$"
            value={profit}
            onChange={(e) => setProfit(e.target.value)}
            style={{ width: 82, fontSize: 12 }}
            title="lucro real em R$ (opcional)"
          />
          <button
            className="btn primary"
            disabled={busy}
            onClick={() => closeTest("win")}
            title="fecha o teste como ganho — vira Winner"
          >
            🏆 Deu Winner
          </button>
          <button className="btn ghost" disabled={busy} onClick={() => closeTest("loss")} title="fecha o teste como perda">
            Não deu
          </button>
        </>
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

"use client";

import { useState } from "react";

// Botão "traduzir" por oferta: alterna título (e hook do criativo, se houver)
// entre o original e a versão em PT. Traduz sob demanda (1º clique chama a API;
// o título fica cacheado no banco, então da 2ª vez em diante é instantâneo).
export function OfferTranslate({
  offerId,
  title,
  titlePt,
  hook,
}: {
  offerId: string;
  title: string;
  titlePt: string | null;
  hook: string | null;
}) {
  const [showPt, setShowPt] = useState(false);
  const [pt, setPt] = useState<{ titlePt: string; hookPt: string | null } | null>(
    titlePt ? { titlePt, hookPt: null } : null
  );
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (showPt) {
      setShowPt(false);
      return;
    }
    if (pt && (pt.hookPt || !hook)) {
      setShowPt(true);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/offers/${offerId}/translate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hook: hook || undefined }),
      });
      const json = await res.json();
      setPt({ titlePt: json.titlePt || title, hookPt: json.hookPt || null });
      setShowPt(true);
    } catch {
      /* mantém original em caso de falha */
    }
    setBusy(false);
  }

  return (
    <>
      <h1>{showPt && pt ? pt.titlePt : title}</h1>
      <button
        className="btn ghost"
        style={{ fontSize: 12, padding: "4px 10px", marginTop: 4 }}
        disabled={busy}
        onClick={toggle}
        title="traduzir título e copy do anúncio pra português"
      >
        {busy ? "traduzindo…" : showPt ? "🌐 ver original" : "🌐 traduzir"}
      </button>
      {hook && (
        <div className="ocard-hook-standalone" style={{ marginTop: 8, fontSize: 13, color: "var(--muted)" }}>
          {showPt && pt?.hookPt ? pt.hookPt : hook}
        </div>
      )}
    </>
  );
}

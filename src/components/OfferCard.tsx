"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface OfferView {
  id: string;
  title: string;
  advertiser: string;
  nicheLabel: string | null;
  markets: string;
  landingUrl: string | null;
  gateway: string | null;
  funnelType: string | null;
  language: string | null;
  adCount: number;
  pageCount: number;
  pageAdCount: number;
  daysActive: number;
  trend: string;
  arbitrage: boolean;
  score: number;
  status: string;
  verdict: string | null;
  verdictAngle: string | null;
}

const TREND_LABEL: Record<string, string> = {
  new: "novo",
  scaling: "escalando",
  steady: "estável",
  fading: "murchando",
  dead: "morreu",
};

export function OfferCard({ offer }: { offer: OfferView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(status: string) {
    setBusy(true);
    await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  const scoreClass = offer.score >= 70 ? "score" : offer.score >= 45 ? "score mid" : "score low";
  const hot = offer.score >= 75;

  return (
    <div className={"offer" + (hot ? " hot" : "")}>
      <div className="thumb">{offer.funnelType === "vsl" ? "▶" : "▦"}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 500 }}>{offer.title}</span>
          <span className={"badge " + scoreClass}>score {offer.score}</span>
          {offer.trend !== "new" && offer.trend !== "steady" && (
            <span className={"badge " + offer.trend}>{TREND_LABEL[offer.trend]}</span>
          )}
          {offer.arbitrage && <span className="badge">arbitragem</span>}
          {offer.nicheLabel && <span className="badge">{offer.nicheLabel}</span>}
        </div>

        <div className="meta">
          <span>
            <b>{offer.adCount} anúncios</b> neste criativo
          </span>
          <span>
            ativo há <b>{offer.daysActive} dias</b>
          </span>
          <span>{offer.pageCount} páginas no criativo</span>
          {offer.pageAdCount > 0 && <span>{offer.pageAdCount} anúncios ativos na página</span>}
        </div>
        <div className="meta">
          {offer.markets && <span>{offer.markets}</span>}
          {offer.funnelType && offer.funnelType !== "unknown" && <span>LP: {offer.funnelType}</span>}
          <span>gateway: {offer.gateway || "não detectado"}</span>
          {offer.language && offer.language !== "unknown" && <span>{offer.language}</span>}
          <span>por {offer.advertiser}</span>
        </div>

        {(offer.verdict || offer.verdictAngle) && (
          <div className="verdict">
            {offer.verdict}
            {offer.verdictAngle ? ` → ${offer.verdictAngle}` : ""}
          </div>
        )}

        <div className="actions">
          {offer.status !== "approved" && (
            <button className="btn" disabled={busy} onClick={() => act("approved")}>
              Aprovar
            </button>
          )}
          {offer.status !== "testing" && (
            <button className="btn" disabled={busy} onClick={() => act("testing")}>
              Vou testar
            </button>
          )}
          {offer.status !== "ignored" && (
            <button className="btn ghost" disabled={busy} onClick={() => act("ignored")}>
              Ignorar
            </button>
          )}
          {offer.status !== "new" && (
            <button className="btn ghost" disabled={busy} onClick={() => act("new")}>
              Voltar p/ novas
            </button>
          )}
          {offer.landingUrl && (
            <a className="btn ghost" href={offer.landingUrl} target="_blank" rel="noreferrer" style={{ marginLeft: "auto" }}>
              Abrir LP ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

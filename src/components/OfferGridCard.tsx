"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface OfferView {
  id: string;
  title: string;
  advertiser: string;
  nicheLabel: string | null;
  markets: string;
  marketsFlags: string;
  landingUrl: string | null;
  gateway: string | null;
  funnelType: string | null;
  langFlag: string;
  topCreativeAds: number;
  pageAdCount: number;
  creativeCount: number;
  daysActive: number;
  trend: string;
  arbitrage: boolean;
  score: number;
  status: string;
  hook: string | null;
  updatedAt: string;
  active: boolean;
  gatAdCount: number | null;
  sameIpCount: number;
}

const TREND: Record<string, string> = { scaling: "escalando", fading: "murchando", dead: "morreu" };

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function OfferGridCard({ offer }: { offer: OfferView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(status: string, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    router.refresh();
  }

  const sc = offer.score >= 70 ? "score" : offer.score >= 45 ? "score mid" : "score low";
  const hot = offer.score >= 75 || offer.topCreativeAds >= 20;

  return (
    <a href={`/oferta/${offer.id}`} className={"ocard" + (hot ? " hot" : "")}>
      <div className="ocard-head">
        <span className="ocard-ads">
          {offer.topCreativeAds.toLocaleString("pt-BR")} <small>no criativo</small>
        </span>
        <span className="ocard-icons">
          {offer.trend === "scaling" && <span title="escalando">📈</span>}
          {offer.gatAdCount ? <span title="Google Ads Transparency">◎</span> : null}
          {offer.sameIpCount >= 2 ? <span title="multi-domínio">⚑</span> : null}
          <span className={offer.active ? "active" : ""} title={offer.active ? "ativo" : "inativo"}>
            ●
          </span>
        </span>
      </div>

      <div className="ocard-meta">
        <span>⏱ {ago(offer.updatedAt)}</span>
        <span className={"badge-status" + (offer.active ? "" : " off")}>{offer.active ? "Ativo" : "Inativo"}</span>
        {offer.trend in TREND && <span className={"badge " + offer.trend}>{TREND[offer.trend]}</span>}
        {offer.arbitrage && <span className="badge">arbitragem</span>}
      </div>

      <div className="ocard-title">{offer.title}</div>
      <div className="ocard-niche">
        <span className="ndot" /> {offer.nicheLabel ?? "—"} · {offer.langFlag} {offer.marketsFlags}
      </div>

      <div className="ocard-thumb">
        {offer.funnelType === "vsl" ? "▶" : "▤"}
        {offer.hook && <div className="ocard-hook">{offer.hook}</div>}
      </div>

      <div className="ocard-foot">
        <span>{offer.daysActive}d no ar</span>
        <span>·</span>
        <span>{offer.creativeCount} criativos</span>
        {offer.gateway && <span>· {offer.gateway}</span>}
        <span className={sc}>{offer.score}</span>
      </div>

      {offer.status === "new" && (
        <div className="ocard-foot" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <button className="btn ghost" disabled={busy} onClick={(e) => act("approved", e)}>
            aprovar
          </button>
          <button className="btn ghost" disabled={busy} onClick={(e) => act("testing", e)}>
            testar
          </button>
          <button className="btn ghost" disabled={busy} onClick={(e) => act("ignored", e)} style={{ marginLeft: "auto" }}>
            ignorar
          </button>
        </div>
      )}
    </a>
  );
}

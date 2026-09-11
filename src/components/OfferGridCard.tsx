"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { dupTier, scoreBand } from "@/lib/score";

export interface OfferView {
  id: string;
  title: string;
  advertiser: string;
  nicheLabel: string | null;
  marketsFlags: string;
  gateway: string | null;
  funnelType: string | null;
  player: string | null;
  techStack: string;
  langFlag: string;
  topCreativeAds: number;
  creativeCount: number;
  daysActive: number;
  trend: string;
  arbitrage: boolean;
  cloakerSuspect: boolean;
  recommended: boolean;
  favorite: boolean;
  score: number;
  status: string;
  hook: string | null;
  updatedAt: string;
  active: boolean;
  gatAdCount: number | null;
  sameIpCount: number;
  discoveredVia: string;
  imageUrl: string | null;
}

const TREND: Record<string, string> = { scaling: "escalando", fading: "murchando", dead: "morreu" };
const VIA: Record<string, string> = {
  "meta-scraper": "Meta",
  "meta-api": "Meta (API)",
  tiktok: "TikTok",
  youtube: "YouTube",
  reviews: "Reclamações",
};

function ago(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function OfferGridCard({ offer }: { offer: OfferView }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [fav, setFav] = useState(offer.favorite);

  async function patch(body: object, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    await fetch(`/api/offers/${offer.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
  }

  const band = scoreBand(offer.score);
  const sc = "score " + band.key;
  const hot = offer.recommended || offer.score >= 75 || offer.topCreativeAds >= 20;
  const tech = offer.techStack ? offer.techStack.split(",").filter(Boolean).slice(0, 4) : [];

  return (
    <a href={`/oferta/${offer.id}`} className={"ocard" + (hot ? " hot" : "")}>
      <div className="ocard-head">
        <span className="ocard-ads">
          {offer.topCreativeAds.toLocaleString("pt-BR")} <small>no criativo</small>
        </span>
        <span className="badge" style={{ fontWeight: 700 }}>
          {dupTier(offer.topCreativeAds).label}
        </span>
        <span className="ocard-icons">
          {offer.trend === "scaling" && <span title="escalando">📈</span>}
          {offer.gatAdCount ? <span title="rodando no Google">G</span> : null}
          {offer.sameIpCount >= 2 ? <span title="multi-domínio">⚑</span> : null}
          <span
            className={"star" + (fav ? " on" : "")}
            onClick={(e) => {
              patch({ favorite: !fav }, e);
              setFav(!fav);
            }}
            title="favoritar"
          >
            {fav ? "★" : "☆"}
          </span>
          <span className={offer.active ? "active" : ""} title={offer.active ? "ativo" : "inativo"}>
            ●
          </span>
        </span>
      </div>

      <div className="ocard-meta">
        <span>⏱ {ago(offer.updatedAt)}</span>
        <span className={"badge-status" + (offer.active ? "" : " off")}>{offer.active ? "Ativo" : "Inativo"}</span>
        {offer.trend in TREND && <span className={"badge " + offer.trend}>{TREND[offer.trend]}</span>}
        {offer.recommended && (
          <span className="badge" style={{ background: "rgba(124,92,255,.18)", color: "#b8a6ff", borderColor: "transparent" }}>
            ★ modelar
          </span>
        )}
        {offer.cloakerSuspect && (
          <span className="badge" style={{ background: "rgba(226,75,74,.14)", color: "var(--danger)", borderColor: "transparent" }}>
            possível cloaker
          </span>
        )}
        {offer.arbitrage && <span className="badge">arbitragem</span>}
      </div>

      <div className="ocard-title">{offer.title}</div>
      <div className="ocard-niche">
        <span className="ndot" /> {offer.nicheLabel ?? "—"} · {offer.langFlag} {offer.marketsFlags}
      </div>

      <div className="ocard-thumb">
        {offer.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={offer.imageUrl}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            referrerPolicy="no-referrer"
          />
        ) : offer.funnelType === "vsl" ? (
          "▶"
        ) : (
          "▤"
        )}
        {offer.hook && <div className="ocard-hook">{offer.hook}</div>}
      </div>

      {tech.length > 0 && (
        <div className="ocard-meta" style={{ paddingTop: 0 }}>
          {tech.map((t) => (
            <span key={t} className="badge">
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="ocard-foot">
        <span>{VIA[offer.discoveredVia] ?? offer.discoveredVia}</span>
        <span>·</span>
        <span>{offer.daysActive}d</span>
        <span>·</span>
        <span>{offer.creativeCount} criativos</span>
        {offer.gateway && <span>· {offer.gateway}</span>}
        <span className={sc} title="MMA SCORE">
          {offer.score} · {band.label}
        </span>
      </div>

      {offer.status === "new" && (
        <div className="ocard-foot" style={{ borderTop: "1px solid var(--border)", paddingTop: 8 }}>
          <button className="btn ghost" disabled={busy} onClick={(e) => patch({ status: "approved" }, e).then(() => router.refresh())}>
            aprovar
          </button>
          <button className="btn ghost" disabled={busy} onClick={(e) => patch({ status: "testing" }, e).then(() => router.refresh())}>
            testar
          </button>
          <button
            className="btn ghost"
            disabled={busy}
            style={{ marginLeft: "auto" }}
            onClick={(e) => patch({ status: "ignored" }, e).then(() => router.refresh())}
          >
            ignorar
          </button>
        </div>
      )}
    </a>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { langFlag, langName, marketsFlags, countryName } from "@/lib/flags";
import { Sparkline } from "@/components/Sparkline";
import { OfferActions } from "@/components/OfferActions";

export const dynamic = "force-dynamic";

export default async function OfferDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const offer = await prisma.offer.findUnique({
    where: { id },
    include: {
      snapshots: { orderBy: { at: "asc" } },
      creatives: { orderBy: { adCount: "desc" } },
      tests: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });
  if (!offer) notFound();

  const nicheLabel = offer.niche ? NICHE_BY_ID.get(offer.niche)?.label ?? offer.niche : "—";
  const adLibPage = `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&view_all_page_id=${offer.pageId}`;
  const points = offer.snapshots.map((s) => ({ at: s.at.toISOString(), v: s.adCount }));

  const stat = [
    ["Estrutura", (offer.funnelType || "—").toUpperCase()],
    ["Idioma", `${langFlag(offer.language)} ${langName(offer.language)}`],
    ["Nicho", nicheLabel],
    ["Gateway", offer.gateway || "não detectado"],
    ["Tráfego", "🔵 Facebook"],
    ["Status", offer.trend === "dead" ? "Inativo" : "Ativo"],
  ];

  return (
    <>
      <div className="detail-head">
        <div>
          <h1>{offer.title}</h1>
          <p className="sub">
            por <b>{offer.advertiser}</b> · {marketsFlags(offer.markets)}{" "}
            {offer.markets
              .split(",")
              .filter(Boolean)
              .map((m) => countryName(m))
              .join(", ")}{" "}
            · atualizado {new Date(offer.updatedAt).toLocaleString("pt-BR")}
          </p>
        </div>
        <OfferActions id={offer.id} status={offer.status} />
      </div>

      <div className="statcards">
        {stat.map(([k, v]) => (
          <div key={k} className="statcard">
            <div className="k">{k}</div>
            <div className="v">{v}</div>
          </div>
        ))}
      </div>

      <div className="statcards">
        <div className="statcard">
          <div className="k">Anúncios no maior criativo</div>
          <div className="v" style={{ fontSize: 20 }}>
            {(offer.topCreativeAds || offer.adCount).toLocaleString("pt-BR")}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Criativos distintos</div>
          <div className="v" style={{ fontSize: 20 }}>
            {offer.creativeCount || offer.creatives.length}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Anúncios ativos na página</div>
          <div className="v" style={{ fontSize: 20 }}>
            {offer.pageAdCount}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Dias no ar</div>
          <div className="v" style={{ fontSize: 20 }}>
            {offer.daysActive}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Score</div>
          <div className="v" style={{ fontSize: 20 }}>
            {offer.score}
          </div>
        </div>
        {offer.gatAdCount != null && (
          <div className="statcard">
            <div className="k">Google Ads Transp.</div>
            <div className="v" style={{ fontSize: 20 }}>
              {offer.gatAdCount}
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-label" style={{ margin: "0 0 8px" }}>
          Análises — nº de anúncios ao longo das rodadas
        </div>
        <Sparkline points={points} />
      </div>

      <div className="panel">
        <div className="section-label" style={{ margin: "0 0 10px" }}>
          Links
        </div>
        <div className="actions">
          {offer.landingUrl && (
            <a className="btn" href={offer.landingUrl} target="_blank" rel="noreferrer">
              Abrir landing / VSL ↗
            </a>
          )}
          <a className="btn" href={adLibPage} target="_blank" rel="noreferrer">
            Página na Biblioteca de Anúncios ↗
          </a>
          {(offer.trackingPixel || offer.trackingGa) && (
            <span className="badge" style={{ alignSelf: "center" }}>
              {offer.trackingPixel ? `pixel ${offer.trackingPixel}` : ""} {offer.trackingGa || ""}
            </span>
          )}
        </div>
        {offer.sameIpDomains && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <b>Domínios no mesmo IP:</b> {offer.sameIpDomains.split(",").slice(0, 12).join(" · ")}
          </div>
        )}
      </div>

      <div className="section-label">Criativos ({offer.creatives.length})</div>
      <div className="grid">
        {offer.creatives.map((c) => (
          <div key={c.id} className="ocard">
            <div className="ocard-head">
              <span className="ocard-ads">
                {c.adCount.toLocaleString("pt-BR")} <small>anúncios</small>
              </span>
              <span className="ocard-icons">{c.mediaType === "video" ? "▶" : "▤"}</span>
            </div>
            <div className="ocard-meta">
              <span>{c.advertiserCount} anunciante(s)</span>
              <span>· {c.pageCount} páginas</span>
            </div>
            <div className="ocard-title" style={{ minHeight: 34 }}>
              {c.hookText || c.sampleBody?.slice(0, 80) || "—"}
            </div>
            <div className="ocard-thumb">{c.mediaType === "video" ? "▶" : "▤"}</div>
          </div>
        ))}
      </div>
    </>
  );
}

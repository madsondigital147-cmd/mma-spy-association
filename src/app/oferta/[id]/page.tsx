import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { langFlag, langName, marketsFlags, countryName } from "@/lib/flags";
import { offerLinks } from "@/lib/links";
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

  const sameOffer = offer.landingDomain
    ? await prisma.offer.findMany({
        where: { landingDomain: offer.landingDomain, id: { not: offer.id } },
        select: { id: true, title: true, discoveredVia: true, niche: true, markets: true, topCreativeAds: true },
        take: 8,
      })
    : [];

  const nicheLabel = offer.niche ? NICHE_BY_ID.get(offer.niche)?.label ?? offer.niche : "—";
  const L = offerLinks(offer);
  const points = offer.snapshots.map((s) => ({ at: s.at.toISOString(), v: s.adCount }));
  const tech = offer.techStack ? offer.techStack.split(",").filter(Boolean) : [];
  const priceSeen = offer.snapshots.filter((s) => s.priceSeen).pop()?.priceSeen ?? null;

  const VIA: Record<string, string> = {
    "meta-scraper": "🔵 Meta Ads",
    "meta-api": "🔵 Meta (API)",
    tiktok: "⬛ TikTok Ads",
    youtube: "🔴 YouTube",
    reviews: "📣 Site de reclamações",
  };
  const stat = [
    ["Fonte", VIA[offer.discoveredVia] ?? offer.discoveredVia],
    ["Estrutura", (offer.funnelType || "—").toUpperCase()],
    ["Idioma", `${langFlag(offer.language)} ${langName(offer.language)}`],
    ["Nicho", nicheLabel],
    ["Gateway", offer.gateway || "não detectado"],
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
        <OfferActions id={offer.id} status={offer.status} favorite={offer.favorite} />
      </div>

      {offer.recommended && (
        <div className="mining" style={{ background: "rgba(124,92,255,.14)", borderColor: "rgba(124,92,255,.35)" }}>
          <span style={{ color: "#b8a6ff", fontWeight: 600 }}>★ Recomendado pra modelar</span>
          <span style={{ color: "var(--muted)" }}>{offer.recommendReason}</span>
        </div>
      )}
      {offer.cloakerSuspect && (
        <div className="mining" style={{ background: "rgba(226,75,74,.1)", borderColor: "rgba(226,75,74,.3)" }}>
          <span style={{ color: "var(--danger)", fontWeight: 600 }}>⚠ Possível cloaker</span>
          <span style={{ color: "var(--muted)" }}>
            landing pode ser página branca — testa como cliente real (perfil nativo + VPN do país)
          </span>
        </div>
      )}

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
          {L.landing && (
            <a className="btn" href={L.landing} target="_blank" rel="noreferrer">
              Página de venda / VSL ↗
            </a>
          )}
          {L.adSnapshot && (
            <a className="btn" href={L.adSnapshot} target="_blank" rel="noreferrer">
              Ver o anúncio ↗
            </a>
          )}
          <a className="btn" href={L.fbPage} target="_blank" rel="noreferrer">
            Página no Facebook Ads ↗
          </a>
          <a className="btn" href={L.fbLibraryDomain} target="_blank" rel="noreferrer">
            Biblioteca de Anúncios (domínio) ↗
          </a>
          {L.googleTransparency && (
            <a className="btn" href={L.googleTransparency} target="_blank" rel="noreferrer">
              Google Ads Transparency {offer.gatAdCount ? `(${offer.gatAdCount})` : ""} ↗
            </a>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="section-label" style={{ margin: "0 0 10px" }}>
          Tech stack
        </div>
        {tech.length === 0 ? (
          <span style={{ color: "var(--faint)", fontSize: 12 }}>não detectado (landing ainda não enriquecida)</span>
        ) : (
          <div className="actions">
            {tech.map((t) => (
              <span key={t} className="badge">
                {t}
              </span>
            ))}
          </div>
        )}
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", display: "flex", gap: 16, flexWrap: "wrap" }}>
          {offer.player && (
            <span>
              <b>Player:</b> {offer.player}
            </span>
          )}
          {priceSeen && (
            <span>
              <b>Preço visto:</b> {priceSeen}
            </span>
          )}
          {offer.trackingPixel && (
            <span>
              <b>FB Pixel:</b> {offer.trackingPixel}
            </span>
          )}
          {offer.trackingGa && (
            <span>
              <b>GA:</b> {offer.trackingGa}
            </span>
          )}
        </div>
        {offer.sameIpDomains && (
          <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
            <b>Domínios no mesmo IP:</b> {offer.sameIpDomains.split(",").slice(0, 15).join(" · ")}
          </div>
        )}
      </div>

      {sameOffer.length > 0 && (
        <div className="panel">
          <div className="section-label" style={{ margin: "0 0 10px" }}>
            Mesma oferta (mesmo domínio) em outras fontes / nichos
          </div>
          <div className="actions">
            {sameOffer.map((s) => (
              <a key={s.id} className="btn ghost" href={`/oferta/${s.id}`}>
                {VIA[s.discoveredVia] ?? s.discoveredVia} · {s.markets} · {s.topCreativeAds} anúncios
              </a>
            ))}
          </div>
        </div>
      )}

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
            <div className="ocard-thumb">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" />
              ) : c.mediaType === "video" ? (
                "▶"
              ) : (
                "▤"
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { marketsFlags } from "@/lib/flags";
import { offerLinks } from "@/lib/links";
import { Sparkline } from "@/components/Sparkline";
import { OfferActions } from "@/components/OfferActions";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };

export default async function FavoritosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const rec = sp.rec === "1";

  const offers = await prisma.offer.findMany({
    where: rec ? { recommended: true } : { favorite: true },
    orderBy: [{ favoritedAt: "desc" }, { topCreativeAds: "desc" }],
    take: 80,
    include: {
      snapshots: { orderBy: { at: "asc" } },
      creatives: { orderBy: { adCount: "desc" }, take: 1 },
    },
  });

  const pageIds = [...new Set(offers.map((o) => o.pageId).filter((p) => p && p !== "?"))];
  const pageSnaps = await prisma.pageSnapshot.findMany({
    where: { pageId: { in: pageIds } },
    orderBy: { at: "desc" },
  });
  const pageHist = new Map<string, number[]>();
  for (const s of pageSnaps) {
    const a = pageHist.get(s.pageId) ?? [];
    if (a.length < 2) a.push(s.activeAdCount);
    pageHist.set(s.pageId, a);
  }
  const nicheLabel = (id: string) => NICHE_BY_ID.get(id)?.label ?? id;

  return (
    <>
      <h1>{rec ? "Recomendadas pra modelar" : "Favoritos — monitoramento"}</h1>
      <p className="sub">
        {rec
          ? "escaladas com funil montado, fora do BR — bons candidatos pra modelar"
          : "as ofertas que você favoritou · aqui acompanha o que o anunciante tá fazendo"}
      </p>
      <div className="toolbar">
        <a href="/favoritos" className={"chip" + (!rec ? " on" : "")}>
          ★ favoritos
        </a>
        <a href="/favoritos?rec=1" className={"chip" + (rec ? " on" : "")}>
          recomendadas
        </a>
      </div>

      {offers.length === 0 ? (
        <div className="empty">
          {rec ? "nenhuma recomendada ainda" : "favorite uma oferta (★) pra ela aparecer aqui"}
        </div>
      ) : (
        offers.map((o) => {
          const L = offerLinks(o);
          const hist = pageHist.get(o.pageId) ?? [];
          const delta = hist.length === 2 ? hist[0] - hist[1] : 0;
          const pts = o.snapshots.map((s) => ({ at: s.at.toISOString(), v: s.adCount }));
          return (
            <div key={o.id} className="panel">
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 320px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <a href={`/oferta/${o.id}`} style={{ fontWeight: 600, fontSize: 15 }}>
                      {o.title}
                    </a>
                    {o.recommended && (
                      <span className="badge" style={{ background: "rgba(124,92,255,.18)", color: "#b8a6ff", borderColor: "transparent" }}>
                        ★ modelar
                      </span>
                    )}
                    {o.cloakerSuspect && (
                      <span className="badge" style={{ background: "rgba(226,75,74,.14)", color: "var(--danger)", borderColor: "transparent" }}>
                        cloaker?
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>
                    por <b>{o.advertiser}</b> · {marketsFlags(o.markets)} · {nicheLabel(o.niche ?? "")} · {o.gateway || "gateway ?"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
                    <b style={{ color: "var(--text)" }}>{o.topCreativeAds || o.adCount}</b> anúncios no maior criativo ·{" "}
                    <b style={{ color: "var(--text)" }}>{o.pageAdCount}</b> ativos na página
                    {delta !== 0 && (
                      <span style={{ color: delta > 0 ? "var(--warning)" : "var(--danger)", marginLeft: 8 }}>
                        {delta > 0 ? "▲" : "▼"} {Math.abs(delta)} na página desde a rodada anterior
                      </span>
                    )}
                    {" · "}
                    {o.creativeCount} criativos · {o.daysActive}d no ar
                  </div>
                  <div className="actions" style={{ marginTop: 10 }}>
                    {L.landing && (
                      <a className="btn ghost" href={L.landing} target="_blank" rel="noreferrer">
                        venda/VSL ↗
                      </a>
                    )}
                    <a className="btn ghost" href={L.fbPage} target="_blank" rel="noreferrer">
                      página FB ↗
                    </a>
                    {L.googleTransparency && (
                      <a className="btn ghost" href={L.googleTransparency} target="_blank" rel="noreferrer">
                        Google ↗
                      </a>
                    )}
                    <OfferActions id={o.id} status={o.status} favorite={o.favorite} />
                  </div>
                </div>
                <div style={{ flex: "1 1 260px", minWidth: 220 }}>
                  <Sparkline points={pts} height={90} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </>
  );
}

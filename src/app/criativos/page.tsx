import { prisma } from "@/lib/db";
import { posterSrc } from "@/lib/offerView";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };

export default async function CriativosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const min = typeof sp.min === "string" ? Number(sp.min) : 2;

  const creatives = await prisma.minedCreative.findMany({
    where: { adCount: { gte: min } },
    orderBy: [{ adCount: "desc" }],
    take: 150,
    include: { offer: { select: { id: true, title: true, niche: true, markets: true } } },
  });

  return (
    <>
      <h1>Criativos</h1>
      <p className="sub">
        o mesmo criativo duplicado em N anúncios = alguém botando dinheiro. Ordenado por nº de anúncios.
      </p>

      <div className="toolbar">
        {[2, 3, 5, 10, 20].map((n) => (
          <a key={n} href={`/criativos?min=${n}`} className={"chip" + (min === n ? " on" : "")}>
            {n}+ anúncios
          </a>
        ))}
      </div>

      {creatives.length === 0 ? (
        <div className="empty">nenhum criativo com {min}+ anúncios ainda</div>
      ) : (
        <div className="grid">
          {creatives.map((c) => (
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
              <div className="ocard-title" style={{ minHeight: 38 }}>
                {c.hookText || c.sampleBody?.slice(0, 90) || "— sem texto —"}
              </div>
              <div className="ocard-thumb">
                {posterSrc(c.imageHash, c.imageUrl) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={posterSrc(c.imageHash, c.imageUrl)!}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    referrerPolicy="no-referrer"
                  />
                ) : c.mediaType === "video" ? (
                  "▶"
                ) : (
                  "▤"
                )}
              </div>
              <div className="ocard-foot">
                {c.offer ? (
                  <a href={`/oferta/${c.offer.id}`} style={{ color: "var(--accent-2)" }}>
                    {c.offer.title.slice(0, 40)}
                  </a>
                ) : (
                  <span>sem oferta consolidada</span>
                )}
                <span style={{ marginLeft: "auto" }}>{c.offer?.markets}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

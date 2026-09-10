import { prisma } from "@/lib/db";
import { toOfferView } from "@/lib/offerView";
import { OfferGridCard } from "@/components/OfferGridCard";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };

export default async function FavoritosPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const rec = sp.rec === "1";

  const offers = await prisma.offer.findMany({
    where: rec ? { recommended: true } : { favorite: true },
    orderBy: [{ topCreativeAds: "desc" }],
    take: 150,
    include: { creatives: { orderBy: { adCount: "desc" }, take: 1, select: { hookText: true } } },
  });

  return (
    <>
      <h1>{rec ? "Recomendadas pra modelar" : "Favoritos"}</h1>
      <p className="sub">
        {rec
          ? "ofertas escaladas com funil montado, fora do BR — bons candidatos pra modelar em outro mercado"
          : "ofertas que você marcou com ★"}
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
        <div className="empty">nada aqui ainda</div>
      ) : (
        <div className="grid">
          {offers.map((o) => (
            <OfferGridCard key={o.id} offer={toOfferView(o)} />
          ))}
        </div>
      )}
    </>
  );
}

import { prisma } from "@/lib/db";
import { toOfferView } from "@/lib/offerView";
import { OfferGridCard } from "@/components/OfferGridCard";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };
const S = (v: SP[string]) => (typeof v === "string" ? v : "");

export default async function OfertasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const niche = S(sp.niche);
  const market = S(sp.market);
  const q = S(sp.q);

  const where: Record<string, unknown> = {};
  if (niche) where.niche = niche;
  if (market) where.markets = { contains: market };
  if (q)
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { advertiser: { contains: q, mode: "insensitive" } },
    ];

  const offers = await prisma.offer.findMany({
    where,
    orderBy: [{ topCreativeAds: "desc" }, { pageCount: "desc" }],
    take: 150,
    include: {
      creatives: {
        orderBy: { adCount: "desc" },
        take: 1,
        select: { hookText: true, imageUrl: true, imageHash: true },
      },
    },
  });

  return (
    <>
      <h1>Ofertas</h1>
      <p className="sub">todas as ofertas mineradas · ordenadas por anúncios no criativo</p>
      <div className="grid">
        {offers.map((o) => (
          <OfferGridCard key={o.id} offer={toOfferView(o)} />
        ))}
      </div>
    </>
  );
}

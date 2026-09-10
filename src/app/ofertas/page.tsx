import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { langFlag, marketsFlags } from "@/lib/flags";
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
  if (q) where.OR = [{ title: { contains: q, mode: "insensitive" } }, { advertiser: { contains: q, mode: "insensitive" } }];

  const offers = await prisma.offer.findMany({
    where,
    orderBy: [{ topCreativeAds: "desc" }, { pageCount: "desc" }],
    take: 150,
    include: { creatives: { orderBy: { adCount: "desc" }, take: 1, select: { hookText: true } } },
  });
  const nicheLabel = (id: string) => NICHE_BY_ID.get(id)?.label ?? id;

  return (
    <>
      <h1>Ofertas</h1>
      <p className="sub">todas as ofertas mineradas · ordenadas por anúncios no criativo</p>
      <div className="grid">
        {offers.map((o) => (
          <OfferGridCard
            key={o.id}
            offer={{
              id: o.id,
              title: o.title,
              advertiser: o.advertiser,
              nicheLabel: o.niche ? nicheLabel(o.niche) : null,
              markets: o.markets,
              marketsFlags: marketsFlags(o.markets),
              landingUrl: o.landingUrl,
              gateway: o.gateway,
              funnelType: o.funnelType,
              langFlag: langFlag(o.language),
              topCreativeAds: o.topCreativeAds || o.adCount,
              pageAdCount: o.pageAdCount,
              creativeCount: o.creativeCount || 1,
              daysActive: o.daysActive,
              trend: o.trend,
              arbitrage: o.arbitrage,
              score: o.score,
              status: o.status,
              hook: o.creatives[0]?.hookText ?? null,
              updatedAt: o.updatedAt.toISOString(),
              active: o.trend !== "dead",
              gatAdCount: o.gatAdCount,
              sameIpCount: o.sameIpDomains ? o.sameIpDomains.split(",").filter(Boolean).length : 0,
            }}
          />
        ))}
      </div>
    </>
  );
}

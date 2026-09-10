import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { langFlag, marketsFlags } from "@/lib/flags";
import { OfferGridCard } from "@/components/OfferGridCard";
import { Toolbar } from "@/components/Toolbar";
import { MiningBanner } from "@/components/MiningBanner";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };
const S = (v: SP[string]) => (typeof v === "string" ? v : "");

export default async function FilaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = S(sp.status) || "new";
  const niche = S(sp.niche);
  const sort = S(sp.sort) || "ads";
  const market = S(sp.market);
  const onlyDup = sp.dup === "1";
  const onlyArb = sp.arb === "1";
  const onlyMulti = sp.multidom === "1";

  const where: Record<string, unknown> = { status };
  if (niche) where.niche = niche;
  if (market) where.markets = { contains: market };
  if (onlyArb) where.arbitrage = true;
  if (onlyMulti) where.sameIpDomains = { not: "" };
  if (onlyDup) where.OR = [{ trend: "scaling" }, { topCreativeAds: { gte: 10 } }];
  if (sort === "scaling") where.trend = "scaling";

  const orderBy =
    sort === "days"
      ? [{ daysActive: "desc" as const }]
      : sort === "score"
        ? [{ score: "desc" as const }]
        : [{ topCreativeAds: "desc" as const }, { pageCount: "desc" as const }];

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const [offers, lastRun, runningRun, statusCounts] = await Promise.all([
    prisma.offer.findMany({
      where,
      orderBy,
      take: 120,
      include: { creatives: { orderBy: { adCount: "desc" }, take: 1, select: { hookText: true } } },
    }),
    prisma.run.findFirst({ where: { status: "ok" }, orderBy: { finishedAt: "desc" }, include: { source: true } }),
    prisma.run.findFirst({
      where: { status: "running", startedAt: { gte: twoHoursAgo } },
      orderBy: { startedAt: "desc" },
      include: { source: true },
    }),
    prisma.offer.groupBy({ by: ["status"], _count: true }),
  ]);
  const counts = Object.fromEntries(statusCounts.map((c) => [c.status, c._count]));
  const nicheLabel = (id: string) => NICHE_BY_ID.get(id)?.label ?? id;

  return (
    <>
      <h1>Fila de review</h1>
      <p className="sub">
        {lastRun?.finishedAt
          ? `última rodada ${new Date(lastRun.finishedAt).toLocaleString("pt-BR")} · ${lastRun.rawCount} anúncios brutos`
          : "nenhuma rodada ainda"}
      </p>

      <MiningBanner
        active={!!runningRun}
        label={runningRun ? nicheLabel(runningRun.source.niche) + " · " + runningRun.source.markets : ""}
        startedAt={runningRun ? runningRun.startedAt.toISOString() : null}
      />

      <Toolbar
        status={status}
        niche={niche}
        sort={sort}
        market={market}
        onlyDup={onlyDup}
        onlyArb={onlyArb}
        onlyMulti={onlyMulti}
        counts={counts}
      />

      {offers.length === 0 ? (
        <div className="empty">
          {runningRun ? "minerando — as ofertas aparecem aqui conforme processa" : "nada com esses filtros"}
        </div>
      ) : (
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
      )}
    </>
  );
}

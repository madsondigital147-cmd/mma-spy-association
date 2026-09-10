import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { OfferCard } from "@/components/OfferCard";
import { FilaFilters } from "@/components/Filters";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function FilaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "new") as string;
  const niche = typeof sp.niche === "string" ? sp.niche : "";
  const onlyArbitrage = sp.arbitrage === "1";
  const onlyScaling = sp.scaling === "1";
  const minAds = sp.minAds ? Number(sp.minAds) : 0;

  const where: Record<string, unknown> = { status };
  if (niche) where.niche = niche;
  if (onlyArbitrage) where.arbitrage = true;
  if (onlyScaling) where.trend = "scaling";
  if (minAds) where.adCount = { gte: minAds };
  const onlyMultiDomain = sp.multidom === "1";
  if (onlyMultiDomain) where.sameIpDomains = { not: "" };

  const offers = await prisma.offer.findMany({
    where,
    orderBy: [{ score: "desc" }, { updatedAt: "desc" }],
    take: 100,
  });

  const lastRun = await prisma.run.findFirst({
    where: { status: "ok" },
    orderBy: { finishedAt: "desc" },
  });

  const counts = await prisma.offer.groupBy({ by: ["status"], _count: true });
  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count]));

  return (
    <>
      <h1>Fila de review</h1>
      <p className="sub">
        {lastRun?.finishedAt
          ? `última rodada ${new Date(lastRun.finishedAt).toLocaleString("pt-BR")} · ${lastRun.rawCount} anúncios brutos`
          : "nenhuma rodada ainda — cadastre uma fonte e minere"}
      </p>

      <FilaFilters
        status={status}
        niche={niche}
        onlyArbitrage={onlyArbitrage}
        onlyScaling={onlyScaling}
        onlyMultiDomain={onlyMultiDomain}
        minAds={minAds}
        counts={countMap}
      />

      {offers.length === 0 ? (
        <div className="empty">
          Nada aqui com esses filtros.
          <br />
          Rode <span className="mono">npm run mine</span> ou aperte “Iniciar mineração” em Fontes.
        </div>
      ) : (
        offers.map((o) => (
          <OfferCard
            key={o.id}
            offer={{
              id: o.id,
              title: o.title,
              advertiser: o.advertiser,
              nicheLabel: o.niche ? NICHE_BY_ID.get(o.niche)?.label ?? o.niche : null,
              markets: o.markets,
              landingUrl: o.landingUrl,
              gateway: o.gateway,
              funnelType: o.funnelType,
              language: o.language,
              adCount: o.adCount,
              pageCount: o.pageCount,
              pageAdCount: o.pageAdCount,
              daysActive: o.daysActive,
              trend: o.trend,
              arbitrage: o.arbitrage,
              score: o.score,
              status: o.status,
              verdict: o.verdict,
              verdictAngle: o.verdictAngle,
              trackingPixel: o.trackingPixel,
              trackingGa: o.trackingGa,
              sameIpCount: o.sameIpDomains ? o.sameIpDomains.split(",").filter(Boolean).length : 0,
              gatAdCount: o.gatAdCount,
            }}
          />
        ))
      )}
    </>
  );
}

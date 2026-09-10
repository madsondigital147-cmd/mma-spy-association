import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { OfferCard } from "@/components/OfferCard";
import { FilaFilters } from "@/components/Filters";
import { MiningBanner } from "@/components/MiningBanner";

export const dynamic = "force-dynamic";

type SP = { [k: string]: string | string[] | undefined };

export default async function FilaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = (typeof sp.status === "string" ? sp.status : "new") as string;
  const niche = typeof sp.niche === "string" ? sp.niche : "";
  const onlyArbitrage = sp.arbitrage === "1";
  const onlyScaling = sp.scaling === "1";
  const onlyMultiDomain = sp.multidom === "1";
  const minAds = sp.minAds ? Number(sp.minAds) : 0;

  const where: Record<string, unknown> = { status };
  if (niche) where.niche = niche;
  if (onlyArbitrage) where.arbitrage = true;
  if (onlyScaling) where.trend = "scaling";
  if (minAds) where.adCount = { gte: minAds };
  if (onlyMultiDomain) where.sameIpDomains = { not: "" };

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const [offers, lastRun, runningRun, statusCounts, scalingCount, arbCount] = await Promise.all([
    prisma.offer.findMany({ where, orderBy: [{ score: "desc" }, { updatedAt: "desc" }], take: 100 }),
    prisma.run.findFirst({ where: { status: "ok" }, orderBy: { finishedAt: "desc" }, include: { source: true } }),
    prisma.run.findFirst({
      where: { status: "running", startedAt: { gte: twoHoursAgo } },
      orderBy: { startedAt: "desc" },
      include: { source: true },
    }),
    prisma.offer.groupBy({ by: ["status"], _count: true }),
    prisma.offer.count({ where: { status: "new", trend: "scaling" } }),
    prisma.offer.count({ where: { status: "new", arbitrage: true } }),
  ]);

  const countMap = Object.fromEntries(statusCounts.map((c) => [c.status, c._count]));
  const nicheLabel = (id: string) => NICHE_BY_ID.get(id)?.label ?? id;

  const stats: [string, number, string][] = [
    ["Novas", countMap.new ?? 0, "?status=new"],
    ["Escalando", scalingCount, "?status=new&scaling=1"],
    ["Arbitragem", arbCount, "?status=new&arbitrage=1"],
    ["Aprovadas", countMap.approved ?? 0, "?status=approved"],
    ["Testando", countMap.testing ?? 0, "?status=testing"],
  ];

  return (
    <>
      <div className="page-head">
        <h1>Fila de review</h1>
        <p className="sub">
          {lastRun?.finishedAt
            ? `última rodada ${new Date(lastRun.finishedAt).toLocaleString("pt-BR")} · ${lastRun.rawCount} anúncios brutos · ${nicheLabel(lastRun.source.niche)}`
            : "nenhuma rodada ainda — cadastre uma fonte e minere"}
        </p>
      </div>

      <MiningBanner
        active={!!runningRun}
        label={runningRun ? nicheLabel(runningRun.source.niche) + " · " + runningRun.source.markets : ""}
        startedAt={runningRun ? runningRun.startedAt.toISOString() : null}
      />

      <div className="stats">
        {stats.map(([label, n, q]) => (
          <a key={label} className="stat" href={q}>
            <span className="stat-n">{n}</span>
            <span className="stat-l">{label}</span>
          </a>
        ))}
      </div>

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
          {runningRun ? (
            <>
              Minerando agora — as ofertas aparecem aqui conforme processa.
              <br />
              <span className="mono">aguarde alguns minutos</span>
            </>
          ) : (
            <>
              Nada aqui com esses filtros.
              <br />
              Rode <span className="mono">npm run mine</span> ou aperte “Iniciar mineração” em Fontes.
            </>
          )}
        </div>
      ) : (
        offers.map((o) => (
          <OfferCard
            key={o.id}
            offer={{
              id: o.id,
              title: o.title,
              advertiser: o.advertiser,
              nicheLabel: o.niche ? nicheLabel(o.niche) : null,
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

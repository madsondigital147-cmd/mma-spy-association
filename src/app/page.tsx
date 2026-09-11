import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { toOfferView } from "@/lib/offerView";
import { displayName, getCurrentUser } from "@/lib/auth";
import { OfferGridCard } from "@/components/OfferGridCard";
import { Toolbar } from "@/components/Toolbar";
import { MiningBanner } from "@/components/MiningBanner";
import { Greeting } from "@/components/Greeting";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };
const S = (v: SP[string]) => (typeof v === "string" ? v : "");

const CREATIVE_SEL = {
  creatives: {
    orderBy: { adCount: "desc" as const },
    take: 1,
    select: { hookText: true, imageUrl: true, imageHash: true },
  },
};

export default async function FilaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const status = S(sp.status) || "new";
  const niche = S(sp.niche);
  const sort = S(sp.sort) || "ads";
  const market = S(sp.market);
  const onlyDup = sp.dup === "1";
  const onlyArb = sp.arb === "1";
  const onlyMulti = sp.multidom === "1";
  const onlyFav = sp.fav === "1";
  const onlyRec = sp.rec === "1";
  const onlyCloak = sp.cloak === "1";
  const onlyWin = sp.win === "1";
  // tier de duplicação: por padrão só mostra oportunidade CONFIRMADA (+10 no
  // mesmo criativo). "0" = todas, incluindo 2-9 anúncios ainda sem confirmação.
  const tier = S(sp.tier) || "10";
  const minAds = Number(tier) || 0;
  const productType = S(sp.ptype);

  const where: Record<string, unknown> = {};
  if (!onlyFav && !onlyRec && !onlyWin) where.status = status;
  if (niche) where.niche = niche;
  if (market) where.markets = { contains: market };
  if (onlyArb) where.arbitrage = true;
  if (onlyMulti) where.sameIpDomains = { not: "" };
  if (onlyFav) where.favorite = true;
  if (onlyRec) where.recommended = true;
  if (onlyCloak) where.cloakerSuspect = true;
  if (onlyWin) where.tests = { some: { status: "win" } };
  if (productType) where.productType = productType;
  if (onlyDup && minAds === 0) where.OR = [{ trend: "scaling" }, { topCreativeAds: { gte: 10 } }];
  if (sort === "scaling") where.trend = "scaling";
  if (minAds > 0) where.topCreativeAds = { gte: minAds };

  const orderBy =
    sort === "days"
      ? [{ daysActive: "desc" as const }]
      : sort === "score"
        ? [{ score: "desc" as const }]
        : [{ topCreativeAds: "desc" as const }, { pageCount: "desc" as const }];

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const [offers, lastRun, runningRun, statusCounts, favCount, recCount, winCount] = await Promise.all([
    prisma.offer.findMany({ where, orderBy, take: 120, include: CREATIVE_SEL }),
    prisma.run.findFirst({ where: { status: "ok" }, orderBy: { finishedAt: "desc" } }),
    prisma.run.findFirst({
      where: { status: "running", startedAt: { gte: twoHoursAgo } },
      orderBy: { startedAt: "desc" },
      include: { source: true },
    }),
    prisma.offer.groupBy({ by: ["status"], _count: true }),
    prisma.offer.count({ where: { favorite: true } }),
    prisma.offer.count({ where: { recommended: true } }),
    prisma.offer.count({ where: { tests: { some: { status: "win" } } } }),
  ]);
  const counts = Object.fromEntries(statusCounts.map((c) => [c.status, c._count]));
  const nicheLabel = (id: string) => NICHE_BY_ID.get(id)?.label ?? id;
  const user = await getCurrentUser();

  return (
    <>
      <Greeting name={displayName(user)} />
      <p className="sub">
        {lastRun?.finishedAt
          ? `última rodada ${new Date(lastRun.finishedAt).toLocaleString("pt-BR")} · ${lastRun.rawCount} anúncios brutos`
          : "nenhuma rodada ainda"}
      </p>

      <div className="statcards">
        <div className="statcard">
          <div className="k">Novas</div>
          <div className="v" style={{ fontSize: 22 }}>
            {counts.new || 0}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Recomendadas</div>
          <div className="v" style={{ fontSize: 22, color: "var(--violet)" }}>
            {recCount}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Aprovadas</div>
          <div className="v" style={{ fontSize: 22 }}>
            {counts.approved || 0}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Em teste</div>
          <div className="v" style={{ fontSize: 22 }}>
            {counts.testing || 0}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Favoritos</div>
          <div className="v" style={{ fontSize: 22 }}>
            {favCount}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Ignoradas</div>
          <div className="v" style={{ fontSize: 22, color: "var(--faint)" }}>
            {counts.ignored || 0}
          </div>
        </div>
        <div className="statcard">
          <div className="k">Winners</div>
          <div className="v" style={{ fontSize: 22, color: "var(--success)" }}>
            {winCount}
          </div>
        </div>
      </div>

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
        tier={tier}
        productType={productType}
        onlyDup={onlyDup}
        onlyArb={onlyArb}
        onlyMulti={onlyMulti}
        onlyFav={onlyFav}
        onlyRec={onlyRec}
        onlyCloak={onlyCloak}
        onlyWin={onlyWin}
        counts={counts}
        favCount={favCount}
        recCount={recCount}
        winCount={winCount}
      />

      {offers.length === 0 ? (
        <div className="empty">
          {runningRun
            ? "minerando — as ofertas aparecem aqui conforme processa"
            : minAds > 0
              ? `nenhuma oferta com +${minAds} anúncios no mesmo criativo ainda — tente "todas (2+, ainda validando)" ou espere mais rodadas`
              : "nada com esses filtros"}
        </div>
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

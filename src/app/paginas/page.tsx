import { prisma } from "@/lib/db";
import { WatchStar } from "@/components/WatchStar";

export const dynamic = "force-dynamic";
type SP = { [k: string]: string | string[] | undefined };

export default async function PaginasPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const onlyWatched = sp.watched === "1";

  const grouped = await prisma.minedAd.groupBy({
    by: ["pageId", "pageName"],
    where: { active: true, pageId: { not: "?" } },
    _count: { _all: true },
    orderBy: { _count: { pageId: "desc" } },
    take: 120,
  });

  const watches = await prisma.pageWatch.findMany();
  const watchSet = new Set(watches.map((w) => w.pageId));

  // delta: comparar os 2 snapshots mais recentes por página
  const pageIds = grouped.map((g) => g.pageId);
  const snaps = await prisma.pageSnapshot.findMany({
    where: { pageId: { in: pageIds } },
    orderBy: { at: "desc" },
    take: 600,
  });
  const byPage = new Map<string, number[]>();
  for (const s of snaps) {
    const arr = byPage.get(s.pageId) ?? [];
    if (arr.length < 2) arr.push(s.activeAdCount);
    byPage.set(s.pageId, arr);
  }

  const rows = grouped
    .map((g) => {
      const hist = byPage.get(g.pageId) ?? [];
      const delta = hist.length === 2 ? hist[0] - hist[1] : 0;
      return { pageId: g.pageId, pageName: g.pageName, active: g._count._all, delta, watched: watchSet.has(g.pageId) };
    })
    .filter((r) => (onlyWatched ? r.watched : true));

  return (
    <>
      <h1>Páginas</h1>
      <p className="sub">anunciantes por nº de anúncios ativos · ⭐ pra acompanhar (“tava com 300, pulou pra 900”)</p>

      <div className="toolbar">
        <a href="/paginas" className={"chip" + (!onlyWatched ? " on" : "")}>
          todas
        </a>
        <a href="/paginas?watched=1" className={"chip" + (onlyWatched ? " on" : "")}>
          ⭐ acompanhando ({watches.length})
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="empty">nada aqui</div>
      ) : (
        rows.map((r) => (
          <div key={r.pageId} className="rowlist">
            <WatchStar pageId={r.pageId} pageName={r.pageName} initial={r.watched} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{r.pageName}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                <b style={{ color: "var(--text)" }}>{r.active}</b> anúncios ativos
                {r.delta !== 0 && (
                  <span style={{ color: r.delta > 0 ? "var(--warning)" : "var(--danger)", marginLeft: 8 }}>
                    {r.delta > 0 ? "▲" : "▼"} {Math.abs(r.delta)} desde a rodada anterior
                  </span>
                )}
              </div>
            </div>
            <a
              className="btn ghost"
              href={`https://www.facebook.com/ads/library/?active_status=all&ad_type=all&view_all_page_id=${r.pageId}`}
              target="_blank"
              rel="noreferrer"
            >
              Biblioteca ↗
            </a>
          </div>
        ))
      )}
    </>
  );
}

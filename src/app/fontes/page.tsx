import { prisma } from "@/lib/db";
import { NICHE_BY_ID } from "@/lib/niches";
import { SourceForm } from "@/components/SourceForm";
import { SourceRow } from "@/components/SourceRow";

export const dynamic = "force-dynamic";

export default async function FontesPage() {
  const sources = await prisma.source.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { offers: true } },
      runs: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });

  return (
    <>
      <h1>Nova fonte de mineração</h1>
      <p className="sub">escolha o nicho, os mercados, cole as palavras-chave e o sistema começa</p>

      <SourceForm />

      <div className="section-label">Fontes ativas</div>
      {sources.length === 0 ? (
        <div className="empty">nenhuma fonte ainda</div>
      ) : (
        sources.map((s) => (
          <SourceRow
            key={s.id}
            source={{
              id: s.id,
              nicheLabel: NICHE_BY_ID.get(s.niche)?.label ?? s.niche,
              markets: s.markets,
              status: s.status,
              keywordCount: s.keywords.split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#")).length,
              lastRunAt: s.lastRunAt ? s.lastRunAt.toISOString() : null,
              offerCount: s._count.offers,
              lastRunStatus: s.runs[0]?.status ?? null,
            }}
          />
        ))
      )}
    </>
  );
}

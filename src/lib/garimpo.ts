// Garimpo automático: descoberta de domínios de oferta via TikTok Creative
// Center, YouTube e Trustpilot — antes só rodava manual (npm run garimpo).
// Agora entra no ciclo do worker (uma vez por dia, é scraping pesado) e
// alimenta uma Source por nicho+plataforma com os domínios achados, pra a
// mineração normal (Meta Ad Library, 08h/20h) processar como qualquer outra.
import { prisma } from "./db";
import { NICHES, type Niche } from "./niches";
import { marketLang } from "./translate";
import { tiktokDomains, youtubeDomains } from "./sources/discover";
import { trustpilotDomainsDetailed } from "./sources/reviewSites";

const MAX_TERMS_PER_NICHE = Number(process.env.GARIMPO_TERMS_PER_NICHE || "2");
const MAX_KEYWORDS_PER_SOURCE = 80;

function pickTerms(niche: Niche, lang: string): string[] {
  const seeds = niche.seeds[lang as keyof Niche["seeds"]] ?? niche.seeds.en ?? [];
  return seeds.slice(0, MAX_TERMS_PER_NICHE);
}

async function upsertDiscoverySource(niche: string, kind: "tiktok" | "youtube" | "reviews", market: string, domains: string[]) {
  if (!domains.length) return 0;
  const existing = await prisma.source.findFirst({ where: { niche, kind } });
  if (!existing) {
    await prisma.source.create({
      data: { niche, kind, markets: market, keywords: domains.join("\n"), status: "active" },
    });
    return domains.length;
  }
  const current = new Set(existing.keywords.split("\n").map((s) => s.trim()).filter(Boolean));
  const before = current.size;
  for (const d of domains) current.add(d);
  const merged = [...current].slice(-MAX_KEYWORDS_PER_SOURCE); // fica só com os mais recentes
  await prisma.source.update({
    where: { id: existing.id },
    data: {
      keywords: merged.join("\n"),
      markets: [...new Set([...existing.markets.split(","), market])].filter(Boolean).join(","),
    },
  });
  return current.size - before;
}

async function saveDomainReviews(source: string, rows: { domain: string; reviewCount?: number; rating?: number; snippet?: string }[]) {
  for (const r of rows) {
    if (r.reviewCount == null && r.rating == null && !r.snippet) continue;
    await prisma.domainReview
      .upsert({
        where: { domain: r.domain },
        create: { domain: r.domain, source, reviewCount: r.reviewCount, rating: r.rating, snippet: r.snippet },
        update: { source, reviewCount: r.reviewCount, rating: r.rating, snippet: r.snippet },
      })
      .catch(() => {});
  }
}

export interface GarimpoSummary {
  niche: string;
  tiktok: number;
  youtube: number;
  trustpilot: number;
}

/** Garimpa 1 nicho num mercado — best-effort, nunca lança (cada plataforma isolada). */
export async function garimpoNiche(niche: Niche, market: string): Promise<GarimpoSummary> {
  const lang = marketLang(market);
  const terms = pickTerms(niche, lang);
  const out: GarimpoSummary = { niche: niche.id, tiktok: 0, youtube: 0, trustpilot: 0 };
  if (!terms.length) return out;

  for (const term of terms) {
    try {
      const d = await tiktokDomains(term, market);
      out.tiktok += await upsertDiscoverySource(niche.id, "tiktok", market, d);
    } catch (e) {
      console.warn(`[garimpo] tiktok "${term}" (${niche.id}/${market}): ${(e as Error).message}`);
    }
    try {
      const d = await youtubeDomains(term);
      out.youtube += await upsertDiscoverySource(niche.id, "youtube", market, d);
    } catch (e) {
      console.warn(`[garimpo] youtube "${term}" (${niche.id}): ${(e as Error).message}`);
    }
    try {
      const rows = await trustpilotDomainsDetailed(term, market);
      out.trustpilot += await upsertDiscoverySource(niche.id, "reviews", market, rows.map((r) => r.domain));
      await saveDomainReviews("trustpilot", rows);
    } catch (e) {
      console.warn(`[garimpo] trustpilot "${term}" (${niche.id}/${market}): ${(e as Error).message}`);
    }
  }
  return out;
}

/** Garimpa todos os nichos com Source ativa, 1 mercado representativo cada (o 1º da fonte meta). */
export async function garimpoAllActiveNiches(): Promise<GarimpoSummary[]> {
  const sources = await prisma.source.findMany({ where: { status: "active", kind: "meta" } });
  const seen = new Set<string>();
  const out: GarimpoSummary[] = [];
  for (const s of sources) {
    if (seen.has(s.niche)) continue;
    seen.add(s.niche);
    const niche = NICHES.find((n) => n.id === s.niche);
    if (!niche) continue;
    const market = s.markets.split(",")[0]?.trim() || "US";
    out.push(await garimpoNiche(niche, market));
  }
  return out;
}

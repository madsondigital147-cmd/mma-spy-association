import { EU_MARKET_CODES } from "../niches";
import { metaApiSource } from "./metaApi";
import { scraperSource } from "./scraper";
import type { RawAd } from "./types";

export type { RawAd } from "./types";

// Roteia cada mercado para a melhor fonte:
//   - UE  -> API oficial (grátis, estável, com faixa de alcance) SE houver token
//   - resto + BR -> scraper
// Se não houver token da API, a UE cai no scraper também.
export async function mineTerm(term: string, markets: string[]): Promise<RawAd[]> {
  const hasToken = !!process.env.META_ADLIB_TOKEN;
  const euMarkets = markets.filter((m) => EU_MARKET_CODES.has(m) && hasToken);
  const scrapeMarkets = markets.filter((m) => !euMarkets.includes(m));

  const byId = new Map<string, RawAd>();

  if (euMarkets.length) {
    try {
      const rows = await metaApiSource.search({ term, countries: euMarkets });
      for (const r of rows) if (!byId.has(r.adArchiveId)) byId.set(r.adArchiveId, r);
    } catch (e) {
      console.warn(`[mineTerm] meta-api falhou em "${term}": ${(e as Error).message}`);
    }
  }

  if (scrapeMarkets.length) {
    try {
      const rows = await scraperSource.search({ term, countries: scrapeMarkets });
      for (const r of rows) {
        const existing = byId.get(r.adArchiveId);
        if (existing) existing.countries = [...new Set([...existing.countries, ...r.countries])];
        else byId.set(r.adArchiveId, r);
      }
    } catch (e) {
      console.warn(`[mineTerm] scraper falhou em "${term}": ${(e as Error).message}`);
    }
  }

  return [...byId.values()];
}

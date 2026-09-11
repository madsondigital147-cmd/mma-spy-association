import { NICHE_BY_ID } from "./niches";

export interface ScoreInput {
  adCount: number;
  pageCount: number;
  daysActive: number;
  trend: string;
  gateway: string | null;
  funnelType: string | null;
  language: string | null;
  arbitrage: boolean;
  niche: string | null;
  ipDomainCount?: number; // domínios no mesmo IP (grafo — Fase 2)
  gatAdCount?: number | null; // anúncios no Google Ads Transparency (Fase 3)
}

// Heurística inicial. Depois de ~50-100 OfferTest com veredito real, isso vira
// um modelo treinado nos seus dados (ver README > Fase 4).
// Duplicação do MESMO criativo é o sinal mais forte que existe: "tem gente
// botando dinheiro de verdade" — não uma regra linear, tiers (+10/+20/+30/+50/+100/+200).
// Um criativo com 2-4 anúncios ainda pode ser só um teste; isso não pode carregar
// o score sozinho (dias no ar / gateway não compensam duplicação fraca).
export function dupTier(adCount: number): { key: string; label: string; min: number } {
  if (adCount >= 200) return { key: "200", label: "🔥 +200", min: 200 };
  if (adCount >= 100) return { key: "100", label: "🔥 +100", min: 100 };
  if (adCount >= 50) return { key: "50", label: "🔥 +50", min: 50 };
  if (adCount >= 30) return { key: "30", label: "📈 +30", min: 30 };
  if (adCount >= 20) return { key: "20", label: "📈 +20", min: 20 };
  if (adCount >= 10) return { key: "10", label: "📈 +10", min: 10 };
  if (adCount >= 5) return { key: "5", label: "🌱 +5 · validando", min: 5 };
  return { key: "0", label: "🌱 novo · sem confirmação", min: 0 };
}
function dupScore(adCount: number): number {
  if (adCount >= 200) return 70;
  if (adCount >= 100) return 62;
  if (adCount >= 50) return 52;
  if (adCount >= 30) return 42;
  if (adCount >= 20) return 33;
  if (adCount >= 10) return 22;
  if (adCount >= 5) return 10;
  return adCount * 1.2; // 2-4 anúncios: quase não pontua — ainda não é sinal
}

export function scoreOffer(i: ScoreInput): number {
  let s = 0;

  // volume de anúncios no mesmo criativo — domina o score
  s += dupScore(i.adCount); // 0..70

  // tempo no ar — confirma, mas sozinho não carrega um score alto
  s += Math.min(i.daysActive, 60) * 0.2; // 0..12

  // quantas páginas rodam o criativo (pouco = teste; muito = saturado)
  if (i.pageCount >= 2 && i.pageCount <= 6) s += 5;
  else if (i.pageCount >= 7 && i.pageCount <= 12) s += 2;
  else if (i.pageCount > 12) s -= 10;

  // tendência
  if (i.trend === "scaling") s += 12;
  else if (i.trend === "steady") s += 2;
  else if (i.trend === "fading") s -= 15;
  else if (i.trend === "dead") s -= 40;

  // funil montado
  if (i.gateway) s += 4;
  if (i.funnelType === "vsl" || i.funnelType === "advertorial") s += 5;
  else if (i.funnelType === "quiz") s += 3;

  if (i.language && i.language !== "unknown") s += 1;

  // arbitragem de geo: forte lá fora, ainda sem BR
  if (i.arbitrage) s += 6;

  // grafo de domínios: roda em vários domínios do mesmo IP = operação séria
  // (mas muitos = hospedagem compartilhada, não conta)
  const ipd = i.ipDomainCount ?? 0;
  if (ipd >= 2 && ipd <= 20) s += 5;
  else if (ipd > 20 && ipd <= 60) s += 1;

  // Google Ads Transparency: timeline de teste real
  const gat = i.gatAdCount ?? 0;
  if (gat >= 20) s += 8;
  else if (gat >= 5) s += 4;

  const niche = i.niche ? NICHE_BY_ID.get(i.niche) : undefined;
  if (niche) s += niche.bias;

  return Math.max(0, Math.min(100, Math.round(s)));
}

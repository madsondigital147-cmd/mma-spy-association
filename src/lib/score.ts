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
}

// Heurística inicial. Depois de ~50-100 OfferTest com veredito real, isso vira
// um modelo treinado nos seus dados (ver README > Fase 4).
export function scoreOffer(i: ScoreInput): number {
  let s = 0;

  // volume de anúncios no mesmo criativo — sinal mais forte de "tem verba"
  s += Math.min(i.adCount, 15) * 3; // 0..45

  // tempo no ar — validou
  s += Math.min(i.daysActive, 60) * 0.6; // 0..36

  // quantas páginas rodam o criativo (pouco = teste; muito = saturado)
  if (i.pageCount >= 2 && i.pageCount <= 6) s += 8;
  else if (i.pageCount >= 7 && i.pageCount <= 12) s += 3;
  else if (i.pageCount > 12) s -= 12;

  // tendência
  if (i.trend === "scaling") s += 20;
  else if (i.trend === "steady") s += 4;
  else if (i.trend === "fading") s -= 15;
  else if (i.trend === "dead") s -= 40;

  // funil montado
  if (i.gateway) s += 6;
  if (i.funnelType === "vsl" || i.funnelType === "advertorial") s += 8;
  else if (i.funnelType === "quiz") s += 5;

  if (i.language && i.language !== "unknown") s += 2;

  // arbitragem de geo: forte lá fora, ainda sem BR
  if (i.arbitrage) s += 10;

  const niche = i.niche ? NICHE_BY_ID.get(i.niche) : undefined;
  if (niche) s += niche.bias;

  return Math.max(0, Math.min(100, Math.round(s)));
}

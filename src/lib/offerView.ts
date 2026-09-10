import { NICHE_BY_ID } from "./niches";
import { langFlag, marketsFlags } from "./flags";
import type { OfferView } from "@/components/OfferGridCard";

type Row = {
  id: string;
  title: string;
  advertiser: string;
  niche: string | null;
  markets: string;
  gateway: string | null;
  funnelType: string | null;
  player: string | null;
  techStack: string;
  language: string | null;
  adCount: number;
  topCreativeAds: number;
  creativeCount: number;
  daysActive: number;
  trend: string;
  arbitrage: boolean;
  cloakerSuspect: boolean;
  recommended: boolean;
  favorite: boolean;
  score: number;
  status: string;
  updatedAt: Date;
  gatAdCount: number | null;
  sameIpDomains: string;
  creatives?: { hookText: string | null }[];
};

export function toOfferView(o: Row): OfferView {
  return {
    id: o.id,
    title: o.title,
    advertiser: o.advertiser,
    nicheLabel: o.niche ? NICHE_BY_ID.get(o.niche)?.label ?? o.niche : null,
    marketsFlags: marketsFlags(o.markets),
    gateway: o.gateway,
    funnelType: o.funnelType,
    player: o.player,
    techStack: o.techStack,
    langFlag: langFlag(o.language),
    topCreativeAds: o.topCreativeAds || o.adCount,
    creativeCount: o.creativeCount || 1,
    daysActive: o.daysActive,
    trend: o.trend,
    arbitrage: o.arbitrage,
    cloakerSuspect: o.cloakerSuspect,
    recommended: o.recommended,
    favorite: o.favorite,
    score: o.score,
    status: o.status,
    hook: o.creatives?.[0]?.hookText ?? null,
    updatedAt: o.updatedAt.toISOString(),
    active: o.trend !== "dead",
    gatAdCount: o.gatAdCount,
    sameIpCount: o.sameIpDomains ? o.sameIpDomains.split(",").filter(Boolean).length : 0,
  };
}

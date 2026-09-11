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
  discoveredVia: string;
  imageUrl: string | null;
  imageHash?: string | null;
  productType?: string | null;
  creatives?: { hookText: string | null; imageUrl?: string | null; imageHash?: string | null }[];
};

/** "print da frente do criativo": cache durável (/i/<hash>) primeiro, CDN do FB como fallback. */
export function posterSrc(imageHash?: string | null, imageUrl?: string | null): string | null {
  if (imageHash) return `/i/${imageHash}`;
  return imageUrl ?? null;
}

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
    discoveredVia: o.discoveredVia,
    productType: o.productType ?? null,
    imageUrl:
      posterSrc(o.imageHash, o.imageUrl) ??
      posterSrc(o.creatives?.[0]?.imageHash, o.creatives?.[0]?.imageUrl) ??
      null,
  };
}

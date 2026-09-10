export interface RawAd {
  adArchiveId: string;
  pageId: string;
  pageName: string;
  body?: string;
  linkTitle?: string;
  linkCaption?: string;
  linkUrl?: string;
  ctaText?: string;
  countries: string[];
  platforms: string[];
  deliveryStart?: string; // ISO
  deliveryStop?: string; // ISO
  active: boolean;
  snapshotUrl?: string;
  mediaUrl?: string;
  posterUrl?: string; // frame/thumb estático (vídeo ou imagem)
  mediaType?: "image" | "video";
  euReach?: number;
  source: "meta-api" | "scraper";
}

export interface SearchParams {
  term: string;
  countries: string[]; // ISO-2
  limit?: number;
}

export interface AdSource {
  name: string;
  search(p: SearchParams): Promise<RawAd[]>;
}

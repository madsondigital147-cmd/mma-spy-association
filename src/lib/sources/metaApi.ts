import type { AdSource, RawAd, SearchParams } from "./types";

// API oficial da Meta Ad Library.
// Para países da UE, ad_type=ALL retorna TODOS os anúncios (regra de transparência
// do DSA), com faixa de alcance. Fora da UE só volta anúncio político — por isso
// o roteador (./index.ts) só manda mercados da UE para cá.
// Docs: node_modules/next não tem isso; ver https://www.facebook.com/ads/library/api

const GRAPH = () => `https://graph.facebook.com/${process.env.META_GRAPH_VERSION || "v21.0"}/ads_archive`;

const FIELDS = [
  "id",
  "ad_creation_time",
  "ad_delivery_start_time",
  "ad_delivery_stop_time",
  "ad_creative_bodies",
  "ad_creative_link_titles",
  "ad_creative_link_captions",
  "ad_creative_link_descriptions",
  "ad_snapshot_url",
  "page_id",
  "page_name",
  "publisher_platforms",
  "target_locations",
  "eu_total_reach",
].join(",");

interface GraphAd {
  id: string;
  page_id?: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_titles?: string[];
  ad_creative_link_captions?: string[];
  ad_delivery_start_time?: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url?: string;
  publisher_platforms?: string[];
  eu_total_reach?: number;
}

function mapAd(a: GraphAd, countries: string[]): RawAd {
  return {
    adArchiveId: a.id,
    pageId: a.page_id || "",
    pageName: a.page_name || "",
    body: a.ad_creative_bodies?.[0],
    linkTitle: a.ad_creative_link_titles?.[0],
    linkCaption: a.ad_creative_link_captions?.[0],
    linkUrl: a.ad_creative_link_captions?.[0],
    countries,
    platforms: a.publisher_platforms || [],
    deliveryStart: a.ad_delivery_start_time,
    deliveryStop: a.ad_delivery_stop_time,
    active: !a.ad_delivery_stop_time,
    snapshotUrl: a.ad_snapshot_url,
    euReach: a.eu_total_reach,
    source: "meta-api",
  };
}

export const metaApiSource: AdSource = {
  name: "meta-api",
  async search({ term, countries, limit = 200 }: SearchParams): Promise<RawAd[]> {
    const token = process.env.META_ADLIB_TOKEN;
    if (!token) return [];
    const out: RawAd[] = [];
    const params = new URLSearchParams({
      access_token: token,
      search_terms: term,
      ad_type: "ALL",
      ad_active_status: "ACTIVE",
      ad_reached_countries: JSON.stringify(countries),
      fields: FIELDS,
      limit: "100",
    });
    let url = `${GRAPH()}?${params.toString()}`;
    let pages = 0;
    while (url && out.length < limit && pages < 8) {
      pages++;
      let json: { data?: GraphAd[]; paging?: { next?: string }; error?: { message?: string } };
      try {
        const res = await fetch(url);
        json = await res.json();
      } catch (e) {
        console.warn(`[meta-api] falha em "${term}": ${(e as Error).message}`);
        break;
      }
      if (json.error) {
        console.warn(`[meta-api] erro em "${term}": ${json.error.message}`);
        break;
      }
      for (const a of json.data || []) out.push(mapAd(a, countries));
      url = json.paging?.next || "";
    }
    return out;
  },
};

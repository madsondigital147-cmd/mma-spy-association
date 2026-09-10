// Monta todos os links de uma oferta pra abrir de um clique.

export function hostname(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export interface OfferLinks {
  landing: string | null;
  adSnapshot: string | null; // o anúncio na Biblioteca
  fbPage: string; // todos os anúncios da página
  fbLibraryDomain: string; // busca a Biblioteca pelo domínio
  googleTransparency: string | null;
}

export function offerLinks(o: {
  landingUrl?: string | null;
  adSnapshotUrl?: string | null;
  pageId: string;
}): OfferLinks {
  const dom = hostname(o.landingUrl);
  return {
    landing: o.landingUrl ?? null,
    adSnapshot: o.adSnapshotUrl ?? null,
    fbPage: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&view_all_page_id=${o.pageId}`,
    fbLibraryDomain: dom
      ? `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&q=${encodeURIComponent(dom)}`
      : `https://www.facebook.com/ads/library/`,
    googleTransparency: dom
      ? `https://adstransparency.google.com/?region=anywhere&domain=${encodeURIComponent(dom)}`
      : null,
  };
}

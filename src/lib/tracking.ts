// Fase 2 — grafo de domínios.
// Extrai IDs de rastreamento do HTML da landing (GA, GTM, Pixel do FB/TikTok) e
// faz reverse-IP pra achar outros domínios do mesmo anunciante — a ideia do
// "mesmo pixel / mesma tag" dos vídeos de espionagem.

export interface TrackingIds {
  ga: string | null;
  gtm: string | null;
  pixel: string | null;
  tiktok: string | null;
}

export function extractTrackingIds(html: string): TrackingIds {
  const pick = (re: RegExp): string | null => {
    const m = html.match(re);
    return m ? m[1] : null;
  };
  return {
    ga: pick(/\b(G-[A-Z0-9]{6,12}|UA-\d{4,10}-\d{1,4})\b/),
    gtm: pick(/\b(GTM-[A-Z0-9]{5,9})\b/),
    pixel:
      pick(/fbq\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/) ??
      pick(/facebook\.com\/tr\?id=(\d{10,20})/),
    tiktok:
      pick(/ttq\.load\(\s*['"]([A-Z0-9]{16,24})['"]/) ??
      pick(/analytics\.tiktok\.com\/i18n\/pixel\/events\.js\?sdkid=([A-Z0-9]{16,24})/),
  };
}

/** Reverse-IP grátis (hackertarget, ~50/dia). Retorna domínios no mesmo IP. */
export async function reverseIp(domain: string): Promise<string[]> {
  const host = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0];
  if (!host) return [];
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(`https://api.hackertarget.com/reverseiplookup/?q=${encodeURIComponent(host)}`, {
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const text = await res.text();
    if (/API count exceeded|error|Invalid/i.test(text)) return [];
    return [...new Set(text.split(/\s+/).map((s) => s.trim().toLowerCase()).filter((s) => s.includes(".")))]
      .filter((d) => d !== host)
      .slice(0, 40);
  } catch {
    return [];
  }
}

export function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

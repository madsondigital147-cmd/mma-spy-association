import type { AdSource, RawAd, SearchParams } from "./types";

// Scraper da Ad Library pública (www.facebook.com/ads/library).
// Cobre todos os mercados (inclusive BR), mas:
//   - é contra o ToS da Meta (área cinza para pesquisa própria)
//   - a estrutura do JSON interno muda de tempos em tempos -> parser defensivo
//   - a Meta aplica rate-limit / muro de login -> use MMASPY_PROXY se apanhar
// Estratégia: intercepta as respostas do /api/graphql/ e faz um walk recursivo
// procurando qualquer objeto que tenha `ad_archive_id`. Robusto a reestruturação.

const HEADFUL = process.env.MMASPY_HEADFUL === "true";
const MAX_SCROLL = Number(process.env.MMASPY_MAX_SCROLL || "8");

function libUrl(term: string, country: string): string {
  const p = new URLSearchParams({
    active_status: "active",
    ad_type: "all",
    country,
    q: term,
    search_type: "keyword_unordered",
    media_type: "all",
  });
  return `https://www.facebook.com/ads/library/?${p.toString()}`;
}

function pick<T = unknown>(obj: any, keys: string[]): T | undefined {
  for (const k of keys) if (obj && obj[k] != null) return obj[k] as T;
  return undefined;
}

function toIso(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "number") return new Date(v * (v < 1e12 ? 1000 : 1)).toISOString();
  const n = Number(v);
  if (!Number.isNaN(n) && String(v).length >= 8) return new Date(n * (n < 1e12 ? 1000 : 1)).toISOString();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function collectAdNodes(root: unknown): any[] {
  const found: any[] = [];
  const stack = [root];
  const seen = new Set<unknown>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    const anyCur = cur as Record<string, unknown>;
    if (anyCur.ad_archive_id || anyCur.adArchiveID || anyCur.adArchiveId) found.push(anyCur);
    for (const v of Object.values(anyCur)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return found;
}

function mapNode(node: any, country: string): RawAd | null {
  const adArchiveId = String(pick(node, ["ad_archive_id", "adArchiveID", "adArchiveId"]) ?? "");
  if (!adArchiveId) return null;
  const snapshot = pick<any>(node, ["snapshot"]) ?? node;

  const pageId = String(pick(snapshot, ["page_id", "pageID"]) ?? pick(node, ["page_id"]) ?? "");
  const pageName = String(pick(snapshot, ["page_name", "pageName"]) ?? pick(node, ["page_name"]) ?? "");

  const body =
    pick<any>(snapshot, ["body"])?.text ??
    pick<any>(snapshot, ["body"]) ??
    pick<any>(snapshot, ["cards"])?.[0]?.body ??
    undefined;

  const linkUrl = pick<string>(snapshot, ["link_url", "linkUrl"]) ?? pick<any>(snapshot, ["cards"])?.[0]?.link_url;
  const linkTitle = pick<string>(snapshot, ["title", "link_title"]) ?? pick<any>(snapshot, ["cards"])?.[0]?.title;
  const cta = pick<string>(snapshot, ["cta_text", "ctaText"]);

  const images = pick<any[]>(snapshot, ["images"]) ?? [];
  const videos = pick<any[]>(snapshot, ["videos"]) ?? [];
  let mediaUrl: string | undefined;
  let mediaType: "image" | "video" | undefined;
  if (videos.length) {
    mediaUrl = pick<string>(videos[0], ["video_hd_url", "video_sd_url", "watermarked_video_hd_url"]);
    mediaType = "video";
  } else if (images.length) {
    mediaUrl = pick<string>(images[0], ["original_image_url", "resized_image_url"]);
    mediaType = "image";
  }

  const startRaw = pick(node, ["start_date", "startDate"]) ?? pick(snapshot, ["start_date"]);
  const endRaw = pick(node, ["end_date", "endDate"]);
  const isActive = pick<boolean>(node, ["is_active", "isActive"]);

  const platformsRaw =
    pick<string[]>(node, ["publisher_platform", "publisherPlatform"]) ??
    pick<string[]>(snapshot, ["publisher_platform"]) ??
    [];

  return {
    adArchiveId,
    pageId,
    pageName,
    body: typeof body === "string" ? body : undefined,
    linkTitle: typeof linkTitle === "string" ? linkTitle : undefined,
    linkUrl: typeof linkUrl === "string" ? linkUrl : undefined,
    ctaText: typeof cta === "string" ? cta : undefined,
    countries: [country],
    platforms: Array.isArray(platformsRaw) ? platformsRaw.map(String) : [],
    deliveryStart: toIso(startRaw),
    deliveryStop: toIso(endRaw),
    active: isActive ?? !endRaw,
    mediaUrl,
    mediaType,
    source: "scraper",
  };
}

export const scraperSource: AdSource = {
  name: "scraper",
  async search({ term, countries, limit = 300 }: SearchParams): Promise<RawAd[]> {
    let chromium: typeof import("playwright").chromium;
    try {
      ({ chromium } = await import("playwright"));
    } catch {
      console.warn("[scraper] playwright não instalado — pulei. Rode: npx playwright install chromium");
      return [];
    }

    const proxy = process.env.MMASPY_PROXY;
    let browser: import("playwright").Browser;
    try {
      browser = await chromium.launch({
        headless: !HEADFUL,
        proxy: proxy ? { server: proxy } : undefined,
      });
    } catch (e) {
      console.warn(
        `[scraper] não consegui abrir o Chromium (${(e as Error).message}). Rode: npx playwright install chromium`
      );
      return [];
    }
    const byId = new Map<string, RawAd>();

    try {
      for (const country of countries) {
        const ctx = await browser.newContext({
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
          locale: "en-US",
          viewport: { width: 1366, height: 900 },
        });
        const page = await ctx.newPage();

        page.on("response", async (res) => {
          const url = res.url();
          if (!url.includes("/api/graphql/") && !url.includes("/ads/library/async/")) return;
          try {
            const txt = await res.text();
            const clean = txt.replace(/^for \(;;\);/, "").trim();
            for (const line of clean.split("\n")) {
              if (!line.trim().startsWith("{")) continue;
              let json: unknown;
              try {
                json = JSON.parse(line);
              } catch {
                continue;
              }
              for (const node of collectAdNodes(json)) {
                const mapped = mapNode(node, country);
                if (mapped && !byId.has(mapped.adArchiveId)) byId.set(mapped.adArchiveId, mapped);
              }
            }
          } catch {
            // ignora corpo ilegível
          }
        });

        await page.goto(libUrl(term, country), { waitUntil: "domcontentloaded", timeout: 45000 });
        await page.waitForTimeout(3500);

        for (let i = 0; i < MAX_SCROLL && byId.size < limit; i++) {
          await page.mouse.wheel(0, 2600);
          await page.waitForTimeout(1800 + Math.random() * 900);
        }
        await ctx.close();
        if (byId.size >= limit) break;
      }
    } catch (e) {
      console.warn(`[scraper] erro em "${term}": ${(e as Error).message}`);
    } finally {
      await browser.close();
    }

    return [...byId.values()];
  },
};

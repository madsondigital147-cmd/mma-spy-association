import { prisma } from "./db";
import { detectFunnel, fetchLanding } from "./gateway";
import { fetchBuffer, hamming, imageDHash, normalizeText, saveMedia, stripControl, textHash, urlHash } from "./hash";
import { parseKeywords } from "./keywords";
import { detectLang } from "./lang";
import { scoreOffer } from "./score";
import { mineTerm, type RawAd } from "./sources";
import { gatDomainTimeline } from "./sources/googleAdsTransparency";
import { extractTrackingIds, hostOf, reverseIp } from "./tracking";
import { transcribeEnabled, transcribeVideo } from "./transcribe";
import { marketLang, translateKeyword, type Lang } from "./translate";

const MIN_ADS = Number(process.env.MIN_ADS_PER_CREATIVE || "2");
const MIN_DAYS = Number(process.env.MIN_DAYS_ACTIVE || "7");
const DAY = 86_400_000;

// linhas de copy que quase nunca são oferta de DR
const JUNK = [
  /we are hiring|now hiring|vaga de emprego|estamos contratando|join our team/i,
  /grand opening|nova loja|our new location|horário de funcionamento/i,
  /doação|blood drive|volunteer|campanha de vacinação/i,
];

function isJunk(body?: string | null): boolean {
  if (!body) return false;
  return JUNK.some((re) => re.test(body));
}

// rejeita título que veio como placeholder de template não resolvido
function cleanTitle(linkTitle?: string | null, pageName?: string | null): string {
  const t = (linkTitle || "").trim();
  const looksTemplate = /\{\{|\}\}|\$\{|%7B%7B|\[\[/.test(t);
  if (t && !looksTemplate && t.length >= 3) return t.slice(0, 120);
  return (pageName || "Sem título").trim().slice(0, 120);
}

function daysBetween(from?: Date | null, to = new Date()): number {
  if (!from) return 0;
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / DAY));
}

async function fingerprint(ad: RawAd): Promise<{ hash: string; type: string | null; sample: string | null }> {
  if (ad.mediaUrl && ad.mediaType === "image") {
    const buf = await fetchBuffer(ad.mediaUrl);
    if (buf) {
      const h = await imageDHash(buf);
      if (h) {
        let saved: string | null = null;
        try {
          saved = await saveMedia(buf, h.replace(/[^a-z0-9]/gi, ""), "jpg");
        } catch {
          /* pasta pode falhar, tudo bem */
        }
        return { hash: h, type: "image", sample: saved || ad.mediaUrl };
      }
    }
    return { hash: urlHash(ad.mediaUrl), type: "image", sample: ad.mediaUrl };
  }
  if (ad.mediaUrl && ad.mediaType === "video") {
    return { hash: urlHash(ad.mediaUrl), type: "video", sample: ad.mediaUrl };
  }
  // path da API oficial: sem arquivo de mídia -> agrupa pela copy
  const th = textHash(ad.body);
  return { hash: th || `x:${ad.adArchiveId}`, type: null, sample: ad.snapshotUrl || null };
}

/** acha um criativo existente com hash igual OU perceptualmente próximo (imagem) */
async function resolveCreativeId(hash: string, type: string | null, sample: string | null): Promise<string> {
  const exact = await prisma.minedCreative.findUnique({ where: { mediaHash: hash } });
  if (exact) return exact.id;

  if (hash.startsWith("i:")) {
    const imgs = await prisma.minedCreative.findMany({
      where: { mediaHash: { startsWith: "i:" } },
      select: { id: true, mediaHash: true },
      take: 5000,
    });
    for (const c of imgs) if (hamming(hash, c.mediaHash) <= 8) return c.id;
  }

  const created = await prisma.minedCreative.create({
    data: { mediaHash: hash, mediaType: type, sampleMedia: sample },
  });
  return created.id;
}

export interface RunResult {
  runId: string;
  raw: number;
  creatives: number;
  candidates: number;
  offersUpserted: number;
}

export async function runSource(sourceId: string, opts: { reconsolidate?: boolean } = {}): Promise<RunResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} não existe`);

  const markets = source.markets.split(",").map((s) => s.trim()).filter(Boolean);
  const keywords = parseKeywords(source.keywords);
  const run = await prisma.run.create({ data: { sourceId, status: "running" } });

  let raw = 0;
  const touchedCreatives = new Set<string>();

  // modo reconsolidação: pula a raspagem e reprocessa o que já está no banco
  if (opts.reconsolidate) {
    const all = await prisma.minedCreative.findMany({ select: { id: true } });
    for (const c of all) touchedCreatives.add(c.id);
  }

  // agrupa mercados por idioma pra traduzir a palavra-chave na hora da busca
  const marketsByLang = new Map<string, string[]>();
  for (const m of markets) {
    const l = marketLang(m);
    marketsByLang.set(l, [...(marketsByLang.get(l) ?? []), m]);
  }

  try {
    // ---- 1. ingestão + fingerprint + dedup por criativo ----
    for (const term of opts.reconsolidate ? [] : keywords) {
      for (const [lang, langMarkets] of marketsByLang) {
        const q = await translateKeyword(term, lang as Lang);
        let ads: RawAd[] = [];
        try {
          ads = await mineTerm(q, langMarkets);
        } catch (e) {
          console.warn(`[runSource] "${q}" (${lang}) falhou: ${(e as Error).message}`);
          continue;
        }
        raw += ads.length;

      for (const ad of ads) {
        if (!ad.adArchiveId) continue;
        const fp = await fingerprint(ad);
        const creativeId = await resolveCreativeId(fp.hash, fp.type, fp.sample);
        touchedCreatives.add(creativeId);

        const start = ad.deliveryStart ? new Date(ad.deliveryStart) : null;
        const stop = ad.deliveryStop ? new Date(ad.deliveryStop) : null;

        // transcrição opcional (Fase 2) — só p/ vídeo novo, se ligado
        let transcript: string | null = null;
        if (transcribeEnabled() && ad.mediaType === "video" && ad.mediaUrl) {
          const seen = await prisma.minedAd.findUnique({
            where: { adArchiveId: ad.adArchiveId },
            select: { transcript: true },
          });
          if (!seen?.transcript) transcript = await transcribeVideo(ad.mediaUrl);
        }

        await prisma.minedAd.upsert({
          where: { adArchiveId: ad.adArchiveId },
          create: {
            transcript: stripControl(transcript) || null,
            adArchiveId: ad.adArchiveId,
            sourceId,
            pageId: stripControl(ad.pageId) || "?",
            pageName: stripControl(ad.pageName) || "?",
            body: stripControl(ad.body) || null,
            linkTitle: stripControl(ad.linkTitle) || null,
            linkCaption: stripControl(ad.linkCaption) || null,
            linkUrl: stripControl(ad.linkUrl) || null,
            ctaText: stripControl(ad.ctaText) || null,
            countries: ad.countries.join(","),
            platforms: ad.platforms.join(","),
            deliveryStart: start,
            deliveryStop: stop,
            active: ad.active,
            snapshotUrl: ad.snapshotUrl,
            mediaUrl: ad.mediaUrl,
            mediaType: ad.mediaType,
            mediaHash: fp.hash,
            euReach: ad.euReach,
            creativeId,
          },
          update: {
            lastSeen: new Date(),
            active: ad.active,
            deliveryStop: stop,
            countries: ad.countries.join(","),
            creativeId,
            ...(transcript ? { transcript } : {}),
          },
        });
        }
      }
    }

    // ---- 2. recalcula contadores dos criativos tocados ----
    for (const cid of touchedCreatives) {
      try {
        const ads = await prisma.minedAd.findMany({ where: { creativeId: cid } });
        const pages = new Set(ads.map((a) => a.pageId));
        const sample = ads.find((a) => a.body)?.body ?? null;
        await prisma.minedCreative.update({
          where: { id: cid },
          data: {
            adCount: ads.length,
            pageCount: pages.size,
            lastSeen: new Date(),
            sampleBody: sample ? normalizeText(sample) : undefined,
          },
        });
      } catch (e) {
        console.warn(`[recalc criativo ${cid}] ${(e as Error).message}`);
      }
    }

    // ---- 3. candidatas -> consolida em Offer ----
    const ignoredPageIds = new Set(
      (
        await prisma.offer.findMany({ where: { status: "ignored" }, select: { pageId: true } })
      ).map((o) => o.pageId)
    );

    const candidates = await prisma.minedCreative.findMany({
      where: { id: { in: [...touchedCreatives] }, adCount: { gte: MIN_ADS } },
      include: { ads: true },
    });

    let offersUpserted = 0;

    for (const c of candidates) {
     try {
      const ads = c.ads;
      const starts = ads.map((a) => a.deliveryStart).filter(Boolean) as Date[];
      const earliest = starts.length ? new Date(Math.min(...starts.map((d) => d.getTime()))) : null;
      const daysActive = daysBetween(earliest);
      if (daysActive < MIN_DAYS) continue;

      const rep = ads.find((a) => a.linkTitle) ?? ads.find((a) => a.body) ?? ads[0];
      if (isJunk(rep.body)) continue;
      if (ignoredPageIds.has(rep.pageId)) continue;

      const title = cleanTitle(rep.linkTitle, rep.pageName);
      const advertiser = (rep.pageName || "?").slice(0, 120);
      const seenCountries = [...new Set(ads.flatMap((a) => a.countries.split(",").filter(Boolean)))];
      const language = detectLang(rep.body || rep.linkTitle);
      const anyActive = ads.some((a) => a.active);

      // acha/atualiza a Offer (antes do enriquecimento pesado, pra saber se é nova)
      const existing = await prisma.offer.findUnique({
        where: { pageId_title: { pageId: rep.pageId, title } },
        include: { snapshots: { orderBy: { at: "asc" } } },
      });

      // enriquecimento: landing page + rastreamento (Fase 2)
      let gateway: string | null = null;
      let funnelType: string | null = null;
      let priceSeen: string | null = null;
      let landingUrl: string | null = rep.linkUrl || null;
      let track = { ga: null as string | null, gtm: null as string | null, pixel: null as string | null, tiktok: null as string | null };
      if (landingUrl && /^https?:\/\//i.test(landingUrl)) {
        const page = await fetchLanding(landingUrl);
        if (page) {
          const info = detectFunnel(page.html, page.finalUrl);
          gateway = info.gateway;
          funnelType = info.funnelType;
          priceSeen = info.priceSeen;
          landingUrl = page.finalUrl;
          track = extractTrackingIds(page.html);
        }
      }

      // grafo de domínios (Fase 2) + Google Ads Transparency (Fase 3) — só na 1ª vez
      let sameIpDomains = existing?.sameIpDomains ?? "";
      let gatAdCount = existing?.gatAdCount ?? null;
      let gatFirstSeen = existing?.gatFirstSeen ?? null;
      let gatLastSeen = existing?.gatLastSeen ?? null;
      const domain = hostOf(landingUrl);
      if (domain && (!existing || existing.gatAdCount == null)) {
        try {
          const [rip, gat] = await Promise.all([reverseIp(domain), gatDomainTimeline(domain)]);
          if (rip.length) sameIpDomains = rip.join(",").slice(0, 2000);
          if (gat) {
            gatAdCount = gat.adCount;
            gatFirstSeen = gat.firstSeen;
            gatLastSeen = gat.lastSeen;
          }
        } catch (e) {
          console.warn(`[enrich] ${domain}: ${(e as Error).message}`);
        }
      }

      const arbitrage =
        seenCountries.some((c2) => ["US", "GB", "DE", "FR", "CA", "AU", "IT", "ES"].includes(c2)) &&
        !seenCountries.includes("BR");

      // tendência a partir dos snapshots
      let trend = "new";
      const priorSnaps = existing?.snapshots ?? [];
      if (priorSnaps.length >= 1) {
        const first = priorSnaps[0].adCount;
        const last = c.adCount;
        const ratio = last / Math.max(first, 1);
        if (!anyActive || last === 0) trend = "dead";
        else if (ratio >= 1.5 && last - first >= 3) trend = "scaling";
        else if (ratio <= 0.6) trend = "fading";
        else trend = "steady";
      }

      const pageAdCount = await prisma.minedAd
        .findMany({ where: { pageId: rep.pageId, active: true }, select: { id: true } })
        .then((r) => r.length);

      const ipDomainCount = sameIpDomains ? sameIpDomains.split(",").filter(Boolean).length : 0;

      const score = scoreOffer({
        adCount: c.adCount,
        pageCount: c.pageCount,
        daysActive,
        trend,
        gateway,
        funnelType,
        language,
        arbitrage,
        niche: source.niche,
        ipDomainCount,
        gatAdCount,
      });

      const data = {
        sourceId,
        title,
        advertiser,
        pageId: rep.pageId,
        niche: source.niche,
        markets: seenCountries.join(","),
        landingUrl,
        gateway,
        funnelType,
        language,
        adCount: c.adCount,
        pageCount: c.pageCount,
        pageAdCount,
        daysActive,
        trend,
        arbitrage,
        score,
        trackingGa: track.ga,
        trackingGtm: track.gtm,
        trackingPixel: track.pixel,
        trackingTiktok: track.tiktok,
        sameIpDomains,
        gatAdCount,
        gatFirstSeen,
        gatLastSeen,
      };

      const offer = existing
        ? await prisma.offer.update({
            where: { id: existing.id },
            data: existing.status === "ignored" ? { ...data, status: "ignored" } : data,
          })
        : await prisma.offer.create({ data });

      await prisma.minedCreative.update({ where: { id: c.id }, data: { offerId: offer.id } });

      await prisma.offerSnapshot.create({
        data: {
          offerId: offer.id,
          adCount: c.adCount,
          pageAdCount,
          active: anyActive,
          landingUrl,
          priceSeen,
        },
      });

      offersUpserted++;
     } catch (e) {
      console.warn(`[consolida criativo ${c.id}] ${(e as Error).message}`);
     }
    }

    await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "ok",
        finishedAt: new Date(),
        rawCount: raw,
        creativeCount: touchedCreatives.size,
        candidateCount: offersUpserted,
      },
    });
    await prisma.source.update({ where: { id: sourceId }, data: { lastRunAt: new Date() } });

    return { runId: run.id, raw, creatives: touchedCreatives.size, candidates: candidates.length, offersUpserted };
  } catch (e) {
    await prisma.run.update({
      where: { id: run.id },
      data: { status: "error", finishedAt: new Date(), error: (e as Error).message, rawCount: raw },
    });
    throw e;
  }
}

export async function runAllActiveSources(): Promise<RunResult[]> {
  const sources = await prisma.source.findMany({ where: { status: "active" } });
  const results: RunResult[] = [];
  for (const s of sources) {
    console.log(`\n=== minerando fonte ${s.niche} (${s.markets}) ===`);
    try {
      results.push(await runSource(s.id));
    } catch (e) {
      console.error(`fonte ${s.id} falhou:`, (e as Error).message);
    }
  }
  return results;
}

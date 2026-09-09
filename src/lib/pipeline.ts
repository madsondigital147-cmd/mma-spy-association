import { prisma } from "./db";
import { detectFunnel, fetchLanding } from "./gateway";
import { fetchBuffer, hamming, imageDHash, normalizeText, saveMedia, textHash, urlHash } from "./hash";
import { parseKeywords } from "./keywords";
import { detectLang } from "./lang";
import { scoreOffer } from "./score";
import { mineTerm, type RawAd } from "./sources";

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

export async function runSource(sourceId: string): Promise<RunResult> {
  const source = await prisma.source.findUnique({ where: { id: sourceId } });
  if (!source) throw new Error(`Source ${sourceId} não existe`);

  const markets = source.markets.split(",").map((s) => s.trim()).filter(Boolean);
  const keywords = parseKeywords(source.keywords);
  const run = await prisma.run.create({ data: { sourceId, status: "running" } });

  let raw = 0;
  const touchedCreatives = new Set<string>();

  try {
    // ---- 1. ingestão + fingerprint + dedup por criativo ----
    for (const term of keywords) {
      let ads: RawAd[] = [];
      try {
        ads = await mineTerm(term, markets);
      } catch (e) {
        console.warn(`[runSource] "${term}" falhou: ${(e as Error).message}`);
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

        await prisma.minedAd.upsert({
          where: { adArchiveId: ad.adArchiveId },
          create: {
            adArchiveId: ad.adArchiveId,
            sourceId,
            pageId: ad.pageId || "?",
            pageName: ad.pageName || "?",
            body: ad.body,
            linkTitle: ad.linkTitle,
            linkCaption: ad.linkCaption,
            linkUrl: ad.linkUrl,
            ctaText: ad.ctaText,
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
          },
        });
      }
    }

    // ---- 2. recalcula contadores dos criativos tocados ----
    for (const cid of touchedCreatives) {
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

      // enriquecimento: landing page
      let gateway: string | null = null;
      let funnelType: string | null = null;
      let priceSeen: string | null = null;
      let landingUrl: string | null = rep.linkUrl || null;
      if (landingUrl && /^https?:\/\//i.test(landingUrl)) {
        const page = await fetchLanding(landingUrl);
        if (page) {
          const info = detectFunnel(page.html, page.finalUrl);
          gateway = info.gateway;
          funnelType = info.funnelType;
          priceSeen = info.priceSeen;
          landingUrl = page.finalUrl;
        }
      }

      const arbitrage =
        seenCountries.some((c2) => ["US", "GB", "DE", "FR", "CA", "AU", "IT", "ES"].includes(c2)) &&
        !seenCountries.includes("BR");

      // acha/atualiza a Offer
      const existing = await prisma.offer.findUnique({
        where: { pageId_title: { pageId: rep.pageId, title } },
        include: { snapshots: { orderBy: { at: "asc" } } },
      });

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

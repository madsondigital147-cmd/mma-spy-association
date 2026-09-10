// Descoberta de domínios de oferta por plataforma: TikTok, YouTube, tuquejasuma.
// Todos devolvem uma lista de domínios -> viram palavras-chave de uma fonte e o
// scraper da Biblioteca acha os anúncios. Best-effort (scrape frágil, log e segue).

const HEADFUL = process.env.MMASPY_HEADFUL === "true";

async function newBrowser() {
  const { chromium } = await import("playwright");
  return chromium.launch({
    headless: !HEADFUL,
    proxy: process.env.MMASPY_PROXY ? { server: process.env.MMASPY_PROXY } : undefined,
  });
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

function domainsFromText(text: string): string[] {
  const out = new Set<string>();
  const re = /(?:https?:\/\/)?(?:www\.)?([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z]{2,})+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const d = m[1].toLowerCase();
    if (
      d.length > 4 &&
      !/(google|youtube|facebook|instagram|tiktok|bit\.ly|goo\.gl|t\.co|linktr\.ee|gstatic|schema\.org|w3\.org|gmpg\.org|wp\.com|wordpress\.org)/.test(d)
    )
      out.add(d);
  }
  return [...out];
}

// -------- TikTok (Creative Center inspiration) --------
export async function tiktokDomains(term: string, market = "US"): Promise<string[]> {
  const b = await newBrowser();
  const found = new Set<string>();
  try {
    const ctx = await b.newContext({ userAgent: UA, locale: "en-US" });
    const page = await ctx.newPage();
    page.on("response", async (res) => {
      if (!/creative_radar_api|top_ads|creativecenter.*list/i.test(res.url())) return;
      try {
        const j = await res.json();
        const walk = (o: unknown) => {
          if (!o || typeof o !== "object") return;
          for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
            if (typeof v === "string" && /^https?:\/\//.test(v) && /land|click|redirect|url/i.test(k))
              domainsFromText(v).forEach((d) => found.add(d));
            else if (v && typeof v === "object") walk(v);
          }
        };
        walk(j);
      } catch {
        /* ignore */
      }
    });
    await page.goto(
      `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?region=${market}&keyword=${encodeURIComponent(term)}`,
      { waitUntil: "domcontentloaded", timeout: 45000 }
    );
    await page.waitForTimeout(5000);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(1800);
    }
    // fallback: links visíveis na página
    const hrefs: string[] = await page.$$eval("a[href^='http']", (as) =>
      as.map((a) => (a as HTMLAnchorElement).href)
    );
    hrefs.forEach((h) => domainsFromText(h).forEach((d) => found.add(d)));
    await ctx.close();
  } catch (e) {
    console.warn(`[tiktok] "${term}": ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return [...found].slice(0, 40);
}

// -------- YouTube (busca -> descrição dos vídeos) --------
export async function youtubeDomains(term: string): Promise<string[]> {
  const b = await newBrowser();
  const found = new Set<string>();
  try {
    const ctx = await b.newContext({ userAgent: UA, locale: "en-US" });
    const page = await ctx.newPage();
    await page.goto(`https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`, {
      waitUntil: "domcontentloaded",
      timeout: 40000,
    });
    await page.waitForTimeout(3000);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(1200);
    }
    const ids: string[] = await page.$$eval("a#video-title, a#thumbnail", (as) =>
      as
        .map((a) => ((a as HTMLAnchorElement).href.match(/[?&]v=([\w-]{11})/) || [])[1])
        .filter(Boolean)
        .slice(0, 15) as string[]
    );
    for (const id of [...new Set(ids)].slice(0, 12)) {
      try {
        const vp = await ctx.newPage();
        await vp.goto(`https://www.youtube.com/watch?v=${id}`, { waitUntil: "domcontentloaded", timeout: 25000 });
        await vp.waitForTimeout(1500);
        const html = await vp.content();
        const m = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
        if (m) domainsFromText(JSON.parse(`"${m[1]}"`)).forEach((d) => found.add(d));
        await vp.close();
      } catch {
        /* pula vídeo */
      }
    }
    await ctx.close();
  } catch (e) {
    console.warn(`[youtube] "${term}": ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return [...found].slice(0, 40);
}

// -------- tuquejasuma.com (reclamações / reembolso) --------
export async function tuquejasumaDomains(term: string): Promise<string[]> {
  const b = await newBrowser();
  const found = new Set<string>();
  try {
    const ctx = await b.newContext({ userAgent: UA });
    const page = await ctx.newPage();
    for (const url of [
      `https://tuquejasuma.com/?s=${encodeURIComponent(term)}`,
      `https://tuquejasuma.com/busca/?q=${encodeURIComponent(term)}`,
    ]) {
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 35000 });
        await page.waitForTimeout(2500);
        for (let i = 0; i < 3; i++) {
          await page.mouse.wheel(0, 2500);
          await page.waitForTimeout(1000);
        }
        const txt = await page.evaluate(() => document.body.innerText + " " + document.body.innerHTML);
        domainsFromText(txt).forEach((d) => found.add(d));
        if (found.size) break;
      } catch {
        /* tenta próximo url */
      }
    }
    await ctx.close();
  } catch (e) {
    console.warn(`[tuquejasuma] "${term}": ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return [...found].slice(0, 40);
}

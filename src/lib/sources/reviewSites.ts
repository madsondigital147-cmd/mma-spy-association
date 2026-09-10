// Garimpo por site de avaliação — o "Reclame Aqui gringo".
// TrustPilot (EN/ES/PT/DE/FR/IT via subdomínio de país) devolve o DOMÍNIO de cada
// empresa reclamada -> joga esses domínios na Biblioteca de Anúncios.
// Reclame Aqui devolve nomes de empresa (sem domínio direto) — lista de apoio.

const CC: Record<string, string> = {
  US: "www", GB: "uk", EN: "www",
  ES: "es", MX: "es",
  BR: "br", PT: "br",
  DE: "de", FR: "fr", IT: "it",
};

const HEADFUL = process.env.MMASPY_HEADFUL === "true";

async function browser() {
  const { chromium } = await import("playwright");
  return chromium.launch({
    headless: !HEADFUL,
    proxy: process.env.MMASPY_PROXY ? { server: process.env.MMASPY_PROXY } : undefined,
  });
}

export async function trustpilotDomains(term: string, market = "US"): Promise<string[]> {
  const cc = CC[market.toUpperCase()] ?? "www";
  const b = await browser();
  const domains = new Set<string>();
  try {
    const ctx = await b.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      locale: "en-US",
    });
    const page = await ctx.newPage();
    await page.goto(`https://${cc}.trustpilot.com/search?query=${encodeURIComponent(term)}`, {
      waitUntil: "domcontentloaded",
      timeout: 40000,
    });
    await page.waitForTimeout(3000);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(1200);
    }
    const hrefs: string[] = await page.$$eval("a[href*='/review/']", (as) =>
      as.map((a) => (a as HTMLAnchorElement).getAttribute("href") || "")
    );
    for (const h of hrefs) {
      const m = h.match(/\/review\/([a-z0-9.-]+\.[a-z]{2,})/i);
      if (m) domains.add(m[1].toLowerCase());
    }
    await ctx.close();
  } catch (e) {
    console.warn(`[trustpilot] "${term}" (${market}): ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return [...domains];
}

export async function reclameAquiCompanies(term: string): Promise<{ name: string; slug: string }[]> {
  const b = await browser();
  const out: { name: string; slug: string }[] = [];
  const seen = new Set<string>();
  try {
    const ctx = await b.newContext({ locale: "pt-BR" });
    const page = await ctx.newPage();
    await page.goto(`https://www.reclameaqui.com.br/busca/?q=${encodeURIComponent(term)}`, {
      waitUntil: "domcontentloaded",
      timeout: 40000,
    });
    await page.waitForTimeout(3500);
    const items: { name: string; slug: string }[] = await page.$$eval("a[href*='/empresa/']", (as) =>
      as
        .map((a) => {
          const href = (a as HTMLAnchorElement).getAttribute("href") || "";
          const m = href.match(/\/empresa\/([a-z0-9-]+)\/?/i);
          return m ? { name: (a.textContent || "").trim().slice(0, 80), slug: m[1] } : null;
        })
        .filter((x): x is { name: string; slug: string } => !!x)
    );
    for (const it of items) {
      if (seen.has(it.slug)) continue;
      seen.add(it.slug);
      out.push(it);
    }
    await ctx.close();
  } catch (e) {
    console.warn(`[reclameaqui] "${term}": ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return out;
}

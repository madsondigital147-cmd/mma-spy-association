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

export interface ReviewDomain {
  domain: string;
  reviewCount?: number;
  rating?: number;
  snippet?: string;
}

/** compat: só a lista de domínios (usado pelos scripts antigos/CLI) */
export async function trustpilotDomains(term: string, market = "US"): Promise<string[]> {
  return (await trustpilotDomainsDetailed(term, market)).map((r) => r.domain);
}

export async function trustpilotDomainsDetailed(term: string, market = "US"): Promise<ReviewDomain[]> {
  const cc = CC[market.toUpperCase()] ?? "www";
  const b = await browser();
  const byDomain = new Map<string, ReviewDomain>();
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
    // cada resultado é um cartão com o link do domínio + "N,NNN reviews" em algum
    // nó vizinho — sobe até um ancestral razoável e lê o texto dele todo, em vez
    // de confiar numa classe CSS (a Trustpilot troca elas com frequência).
    const rows: { domain: string; text: string }[] = await page.$$eval("a[href*='/review/']", (as) =>
      as.map((a) => {
        const href = a.getAttribute("href") || "";
        const m = href.match(/\/review\/([a-z0-9.-]+\.[a-z]{2,})/i);
        if (!m) return null;
        let node: HTMLElement | null = a as HTMLElement;
        for (let i = 0; i < 4 && node.parentElement; i++) node = node.parentElement;
        return { domain: m[1].toLowerCase(), text: (node.textContent || "").replace(/\s+/g, " ").trim() };
      }).filter((x): x is { domain: string; text: string } => !!x)
    );
    for (const { domain, text } of rows) {
      if (byDomain.has(domain)) continue;
      // "1.5" (nota) seguido de "13,036 reviews" (contagem) sem separador no texto
      // achatado — a contagem é o número imediatamente antes de "review"/"avaliaç".
      const countMatch = text.match(/([\d][\d.,]{1,10})\s*(?:reviews?|avalia)/i);
      const ratingMatch = text.match(/\b([0-5](?:[.,]\d)?)\b/);
      const reviewCount = countMatch ? Number(countMatch[1].replace(/[.,](?=\d{3}\b)/g, "").replace(",", ".")) : undefined;
      const rating = ratingMatch ? Number(ratingMatch[1].replace(",", ".")) : undefined;
      byDomain.set(domain, {
        domain,
        reviewCount: reviewCount && Number.isFinite(reviewCount) ? Math.round(reviewCount) : undefined,
        rating: rating && rating <= 5 ? rating : undefined,
      });
    }
    await ctx.close();
  } catch (e) {
    console.warn(`[trustpilot] "${term}" (${market}): ${(e as Error).message}`);
  } finally {
    await b.close();
  }
  return [...byDomain.values()];
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

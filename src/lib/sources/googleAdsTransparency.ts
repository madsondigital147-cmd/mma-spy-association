// Fase 3 — Google Ads Transparency Center (adstransparency.google.com).
// Dado um domínio, retorna a "timeline de teste" do anunciante: quantos criativos,
// primeira e última exibição. É o "vê o teste do cara em tempo real" dos vídeos.
//
// Usa Playwright e intercepta a RPC interna SearchCreatives. A estrutura do JSON
// muda de tempos em tempos -> parser defensivo (walk recursivo por datas + contagem).

const HEADFUL = process.env.MMASPY_HEADFUL === "true";

export interface GatTimeline {
  adCount: number;
  firstSeen: Date | null;
  lastSeen: Date | null;
}

function collectDates(root: unknown, out: number[]): void {
  const stack = [root];
  const seen = new Set<unknown>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    for (const v of Object.values(cur as Record<string, unknown>)) {
      if (typeof v === "number" && v > 1_400_000_000 && v < 2_000_000_000) out.push(v); // epoch seconds ~2014-2033
      else if (v && typeof v === "object") stack.push(v);
    }
  }
}

function countCreativeIds(root: unknown): number {
  const ids = new Set<string>();
  const stack = [root];
  const seen = new Set<unknown>();
  while (stack.length) {
    const cur = stack.pop();
    if (!cur || typeof cur !== "object" || seen.has(cur)) continue;
    seen.add(cur);
    const anyCur = cur as Record<string, unknown>;
    for (const [k, v] of Object.entries(anyCur)) {
      if (typeof v === "string" && /^CR\d{10,}$/.test(v)) ids.add(v);
      else if (typeof v === "string" && /creativeId/i.test(k) && v) ids.add(v);
      else if (v && typeof v === "object") stack.push(v);
    }
  }
  return ids.size;
}

export async function gatDomainTimeline(domain: string): Promise<GatTimeline | null> {
  const host = domain.replace(/^https?:\/\//, "").split("/")[0].split(":")[0].replace(/^www\./, "");
  if (!host) return null;

  let chromium: typeof import("playwright").chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    return null;
  }

  const proxy = process.env.MMASPY_PROXY;
  let browser: import("playwright").Browser;
  try {
    browser = await chromium.launch({ headless: !HEADFUL, proxy: proxy ? { server: proxy } : undefined });
  } catch {
    return null;
  }

  const dates: number[] = [];
  let adCount = 0;

  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
      locale: "en-US",
    });
    const page = await ctx.newPage();

    page.on("response", async (res) => {
      if (!res.url().includes("/SearchService/") && !res.url().includes("/rpc/")) return;
      try {
        const txt = (await res.text()).replace(/^\)\]\}'\n?/, "");
        let json: unknown;
        try {
          json = JSON.parse(txt);
        } catch {
          return;
        }
        collectDates(json, dates);
        const c = countCreativeIds(json);
        if (c > adCount) adCount = c;
      } catch {
        /* corpo ilegível */
      }
    });

    await page.goto(
      `https://adstransparency.google.com/?region=anywhere&domain=${encodeURIComponent(host)}`,
      { waitUntil: "domcontentloaded", timeout: 45000 }
    );
    await page.waitForTimeout(4000);
    for (let i = 0; i < 4; i++) {
      await page.mouse.wheel(0, 3000);
      await page.waitForTimeout(1500);
    }
    await ctx.close();
  } catch {
    /* segue com o que juntou */
  } finally {
    await browser.close();
  }

  if (adCount === 0 && dates.length === 0) return null;
  const sorted = dates.sort((a, b) => a - b);
  return {
    adCount,
    firstSeen: sorted.length ? new Date(sorted[0] * 1000) : null,
    lastSeen: sorted.length ? new Date(sorted[sorted.length - 1] * 1000) : null,
  };
}

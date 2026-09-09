// Detecta gateway / plataforma de funil a partir do HTML da landing page.

export interface FunnelInfo {
  gateway: string | null;
  funnelType: "vsl" | "advertorial" | "quiz" | "direct" | "unknown";
  priceSeen: string | null;
}

const GATEWAY_SIGNS: [RegExp, string][] = [
  [/cartpanda|pandavideo\.com\.br\/checkout|mycartpanda/i, "Cartpanda"],
  [/cdn\.shopify\.com|myshopify\.com|shopify\.com\/checkout/i, "Shopify"],
  [/clickfunnels|cf-app\.com|myclickfunnels/i, "ClickFunnels"],
  [/hotmart\.com|hotmart\.club|pay\.hotmart/i, "Hotmart"],
  [/kiwify\.com|kiwify\.app/i, "Kiwify"],
  [/monetizze\.com/i, "Monetizze"],
  [/braip\.com/i, "Braip"],
  [/digistore24/i, "Digistore24"],
  [/buygoods\.com/i, "BuyGoods"],
  [/clickbank\.net|cbpays|clkbank/i, "ClickBank"],
  [/systeme\.io/i, "Systeme.io"],
  [/stripe\.com\/(v3|checkout)|js\.stripe\.com/i, "Stripe"],
  [/appmax|yampi|pagar\.me|pagseguro|mercadopago/i, "Checkout BR"],
];

const VSL_SIGNS =
  /vturb|converteai|scripts\.converteai|pandavideo|player\.vimeo|jwplayer|wistia|vsl|video-sales-letter|smartplayer/i;

const QUIZ_SIGNS = /\/quiz|typeform|involve\.me|question 1 of|pergunta 1 de|responda algumas perguntas/i;

const ADVERTORIAL_SIGNS =
  /as seen on|advertorial|reportagem|matéria|breaking:|doctors are stunned|médicos alertam|história de|this changed my life/i;

const PRICE_RE =
  /(?:R\$|US?\$|€|£)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{1,3}[.,]\d{2}\s?(?:reais|dólares|euros)/i;

export function detectFunnel(html: string, finalUrl?: string): FunnelInfo {
  const hay = `${finalUrl || ""}\n${html}`.slice(0, 400_000);
  let gateway: string | null = null;
  for (const [re, name] of GATEWAY_SIGNS) {
    if (re.test(hay)) {
      gateway = name;
      break;
    }
  }
  let funnelType: FunnelInfo["funnelType"] = "unknown";
  if (VSL_SIGNS.test(hay)) funnelType = "vsl";
  else if (QUIZ_SIGNS.test(hay)) funnelType = "quiz";
  else if (ADVERTORIAL_SIGNS.test(hay)) funnelType = "advertorial";
  else if (gateway) funnelType = "direct";

  const priceMatch = hay.match(PRICE_RE);
  return { gateway, funnelType, priceSeen: priceMatch ? priceMatch[0].trim() : null };
}

export async function fetchLanding(url: string): Promise<{ html: string; finalUrl: string } | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36",
      },
    });
    clearTimeout(t);
    const html = await res.text();
    return { html, finalUrl: res.url || url };
  } catch {
    return null;
  }
}

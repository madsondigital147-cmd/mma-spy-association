// Detecta tech stack completo + gateway + tipo de funil + possível cloaker
// a partir do HTML da landing page.

export interface TechInfo {
  gateway: string | null;
  funnelType: "vsl" | "advertorial" | "quiz" | "direct" | "unknown";
  priceSeen: string | null;
  player: string | null;
  tech: string[]; // lista completa: player, checkout, builder, tracking
  cloakerSuspect: boolean;
}

type Sig = [RegExp, string];

// player de vídeo
const PLAYERS: Sig[] = [
  [/scripts?\.converteai|cdn\.converteai|vturb|smartplayer/i, "VTurb"],
  [/pandavideo\.com\.br|player\.pandavideo/i, "Panda Video"],
  [/player\.vimeo|vimeocdn/i, "Vimeo"],
  [/cdn\.jwplayer|jwpsrv/i, "JW Player"],
  [/wistia\.com|wistia\.net|fast\.wistia/i, "Wistia"],
  [/youtube\.com\/embed|youtube-nocookie/i, "YouTube embed"],
];

// checkout / gateway
const GATEWAYS: Sig[] = [
  [/cartpanda|mycartpanda|accounts\.cartpanda/i, "Cartpanda"],
  [/pay\.hotmart|hotmart\.com|checkout\.hotmart/i, "Hotmart"],
  [/kiwify\.com|kiwify\.app|pay\.kiwify/i, "Kiwify"],
  [/monetizze\.com\.br/i, "Monetizze"],
  [/ev\.braip\.com|braip\.com/i, "Braip"],
  [/perfectpay\.com\.br/i, "PerfectPay"],
  [/js\.stripe\.com|checkout\.stripe|stripe\.com\/v3/i, "Stripe"],
  [/clickbank\.net|clkbank|cbpays|jvz|clickbank\.com/i, "ClickBank"],
  [/digistore24|ds24/i, "Digistore24"],
  [/buygoods\.com|bgcdn/i, "BuyGoods"],
  [/paypal\.com\/sdk|paypalobjects/i, "PayPal"],
  [/appmax\.com\.br/i, "AppMax"],
  [/yampi\.com\.br|api\.dooki/i, "Yampi"],
  [/pagar\.me|pagarme/i, "Pagar.me"],
  [/mercadopago|mercadolibre/i, "Mercado Pago"],
  [/pagseguro|pagbank/i, "PagSeguro"],
];

// construtor de página
const BUILDERS: Sig[] = [
  [/atomicat|cdn\.atomicat/i, "Atomicat"],
  [/clickfunnels|cf-app\.com|myclickfunnels/i, "ClickFunnels"],
  [/systeme\.io|systeme-io/i, "Systeme.io"],
  [/wp-content|wp-includes|wordpress/i, "WordPress"],
  [/elementor/i, "Elementor"],
  [/webflow\.com|assets\.website-files/i, "Webflow"],
  [/unbounce\.com|ubembed/i, "Unbounce"],
  [/leadpages|lpages\.co/i, "LeadPages"],
  [/lead\.digital|inlead/i, "Inlead"],
  [/cacto\.com\.br|quiz\.cacto/i, "Cacto"],
];

// tracking / analytics
const TRACKING: Sig[] = [
  [/gtag\('config'|googletagmanager\.com\/gtag/i, "GA4"],
  [/googletagmanager\.com\/gtm|GTM-[A-Z0-9]{5,}/i, "GTM"],
  [/connect\.facebook\.net.*fbevents|fbq\('init'/i, "FB Pixel"],
  [/analytics\.tiktok\.com|ttq\.load/i, "TikTok Pixel"],
  [/static\.hotjar\.com|hotjar\.com/i, "Hotjar"],
  [/clarity\.ms/i, "MS Clarity"],
  [/utmify|cdn\.utmify/i, "Utmify"],
  [/redtrack\.io|rdtrk/i, "RedTrack"],
  [/voluum|vlmapp/i, "Voluum"],
  [/everflow|efpxl/i, "Everflow"],
];

// pegadas de cloaker / white page
const CLOAKER_SIGNS: Sig[] = [
  [/trafficarmor|t-armor|twr\d|whiterabbit|white-rabbit/i, "TrafficArmor / White Rabbit"],
  [/cloaker|cloak\.house|adspect|imklo|m><\s*noscript|redirect_delay/i, "cloaker genérico"],
  [/mightyfish|palladiumzone|justcloudit/i, "cloaker"],
];

const VSL_SIGNS = /video-sales-letter|vsl|assistir o v[íi]deo|watch the video|smartplayer|converteai|pandavideo/i;
const QUIZ_SIGNS = /\/quiz|typeform|involve\.me|question 1 of|pergunta 1 de|responda algumas perguntas|question \d+\/\d+/i;
const ADVERTORIAL_SIGNS =
  /as seen on|advertorial|reportagem|mat[ée]ria|breaking:|doctors are stunned|m[ée]dicos alertam|this changed my life|related topics|related articles/i;
const PRICE_RE =
  /(?:R\$|US?\$|€|£)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?|\d{1,3}[.,]\d{2}\s?(?:reais|d[óo]lares|euros)/i;

// marcadores de página "de verdade" (produto/oferta) — a ausência sugere white page
const REAL_PAGE = /(comprar|add to cart|buy now|checkout|garantia|depoiment|testimonial|order now|adicionar ao carrinho|garanta j[áa])/i;

function matchAll(sigs: Sig[], hay: string): string[] {
  const out: string[] = [];
  for (const [re, name] of sigs) if (re.test(hay) && !out.includes(name)) out.push(name);
  return out;
}

export function detectTech(html: string, finalUrl?: string): TechInfo {
  const hay = `${finalUrl || ""}\n${html}`.slice(0, 500_000);

  const players = matchAll(PLAYERS, hay);
  const gateways = matchAll(GATEWAYS, hay);
  const builders = matchAll(BUILDERS, hay);
  const tracking = matchAll(TRACKING, hay);
  const cloakerNames = matchAll(CLOAKER_SIGNS, hay);

  const player = players[0] ?? null;
  const gateway = gateways[0] ?? null;

  let funnelType: TechInfo["funnelType"] = "unknown";
  if (VSL_SIGNS.test(hay)) funnelType = "vsl";
  else if (QUIZ_SIGNS.test(hay)) funnelType = "quiz";
  else if (ADVERTORIAL_SIGNS.test(hay)) funnelType = "advertorial";
  else if (gateway) funnelType = "direct";

  // cloaker: pegada explícita OU página muito curta sem marcadores de oferta
  const short = html.replace(/<[^>]+>/g, " ").trim().length < 600;
  const cloakerSuspect =
    cloakerNames.length > 0 ||
    (short && !REAL_PAGE.test(hay)) ||
    /hoje n[ãa]o|coming soon|em constru[çc][ãa]o|nothing here|vaza rato/i.test(hay);

  const price = hay.match(PRICE_RE);
  const tech = [...players, ...gateways, ...builders, ...tracking, ...cloakerNames];

  return { gateway, funnelType, priceSeen: price ? price[0].trim() : null, player, tech, cloakerSuspect };
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

// Infoproduto vs produto físico. Foco atual do usuário é infoproduto (curso,
// ebook, método — chega no e-mail, sem correio, sem estoque). Heurística por
// gateway + sinais de texto na landing; nunca decide com falsa certeza.

// Gateways majoritariamente digitais no mercado BR/EN (ClickBank e Digistore24
// são praticamente só infoproduto; Hotmart/Kiwify/Monetizze/Braip/PerfectPay
// também — vendem físico raramente).
const DIGITAL_GATEWAYS = new Set([
  "Hotmart",
  "ClickBank",
  "Digistore24",
  "Kiwify",
  "Monetizze",
  "Braip",
  "PerfectPay",
  "BuyGoods",
]);
// Cartpanda/AppMax/Yampi são o combo padrão de dropship/suplemento físico no BR.
const PHYSICAL_GATEWAYS = new Set(["Cartpanda", "AppMax", "Yampi", "Pagar.me"]);

const DIGITAL_SIGNS = [
  /e-?book/i,
  /\bpdf\b/i,
  /curso online|curso digital|online course/i,
  /acesso (imediato|vital[ií]cio|instant[âa]neo)/i,
  /instant access|digital download|download imediato/i,
  /m[ée]todo (digital|completo|passo a passo)/i,
  /receba (agora )?(no seu|em seu) e-?mail|check your (email|inbox)|you'?ll receive an email|enviado por e-?mail/i,
  /sem sair de casa.{0,20}(acesso|baixe|assista)/i,
  /área de membros|members area|members'? area/i,
];

const PHYSICAL_SIGNS = [
  /frete gr[áa]tis|free shipping/i,
  /entrega em at[ée] \d+ dias|ships? (within|in) \d+/i,
  /correios|rastreio|rastreamento|tracking number/i,
  /em estoque|in stock|out of stock/i,
  /quantidade\s*[:\-]?\s*\d|add to cart|adicionar ao carrinho/i,
  /c[áa]psulas?|frasco|comprimidos?|suplemento/i,
];

export type ProductType = "infoproduto" | "fisico" | "desconhecido";

export function detectProductType(html: string | null | undefined, gateway: string | null): ProductType {
  let digital = 0;
  let physical = 0;

  if (gateway && DIGITAL_GATEWAYS.has(gateway)) digital += 3;
  if (gateway && PHYSICAL_GATEWAYS.has(gateway)) physical += 3;

  const text = (html || "").slice(0, 60_000); // landing inteira já é grande — não precisa mais
  for (const re of DIGITAL_SIGNS) if (re.test(text)) digital++;
  for (const re of PHYSICAL_SIGNS) if (re.test(text)) physical++;

  if (digital === 0 && physical === 0) return "desconhecido";
  if (digital > physical) return "infoproduto";
  if (physical > digital) return "fisico";
  return "desconhecido"; // empate — não força um lado
}

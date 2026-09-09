import "dotenv/config";
import { prisma } from "../lib/db";
import { telegram } from "../lib/notify";

// Camada de veredito (IA) — opcional. Lê o shortlist já reduzido e escreve
// 2 linhas + ângulo por oferta. Nada de HTML cru, nada dos milhares de anúncios.
// Compatível com qualquer endpoint no formato da API da OpenAI.

const ENABLED = process.env.VERDICT_ENABLED === "true";
const BASE = process.env.VERDICT_BASE_URL || "https://api.openai.com/v1";
const KEY = process.env.VERDICT_API_KEY || "";
const MODEL = process.env.VERDICT_MODEL || "gpt-4o-mini";
const MIN_SCORE = Number(process.env.VERDICT_MIN_SCORE || "60");

interface Verdict {
  id: string;
  verdict: string;
  angle: string;
}

async function askLLM(payload: unknown): Promise<Verdict[]> {
  const sys =
    "Você é sócio de uma operação de tráfego pago (dropship + info, mercados EN/EU/BR). " +
    "Recebe um shortlist de ofertas mineradas da Ad Library com sinais já extraídos. " +
    "Para CADA oferta devolva no máximo 2 frases curtas de veredito (saturação, força do funil, " +
    "arbitragem de geo, risco) e um ângulo de criativo sugerido. Responda SÓ com JSON: " +
    '{"verdicts":[{"id":"...","verdict":"...","angle":"..."}]}';

  const res = await fetch(`${BASE}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify(payload) },
      ],
    }),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return parsed.verdicts ?? [];
}

async function main() {
  const offers = await prisma.offer.findMany({
    where: { status: "new", verdict: null, score: { gte: MIN_SCORE } },
    orderBy: { score: "desc" },
    take: 15,
  });

  if (offers.length === 0) {
    console.log("nada novo acima do score mínimo.");
    await prisma.$disconnect();
    return;
  }

  if (ENABLED && KEY) {
    const payload = {
      offers: offers.map((o) => ({
        id: o.id,
        title: o.title,
        advertiser: o.advertiser,
        niche: o.niche,
        markets: o.markets,
        adCount: o.adCount,
        pageCount: o.pageCount,
        daysActive: o.daysActive,
        trend: o.trend,
        arbitrage: o.arbitrage,
        gateway: o.gateway,
        funnelType: o.funnelType,
        score: o.score,
      })),
    };
    try {
      const verdicts = await askLLM(payload);
      for (const v of verdicts) {
        await prisma.offer.update({
          where: { id: v.id },
          data: { verdict: v.verdict?.slice(0, 400), verdictAngle: v.angle?.slice(0, 300) },
        });
      }
      console.log(`veredito gravado em ${verdicts.length} ofertas.`);
    } catch (e) {
      console.error("falha no LLM:", (e as Error).message);
    }
  } else {
    console.log("VERDICT_ENABLED=false — pulei a IA, só monto o resumo.");
  }

  const top = offers.slice(0, 5);
  const lines = top.map(
    (o, i) =>
      `${i + 1}. <b>${o.title}</b> — score ${o.score} · ${o.adCount} anúncios · ${o.daysActive}d · ${o.trend}` +
      (o.arbitrage ? " · arbitragem" : "")
  );
  await telegram(`<b>MMA SPY — top ${top.length} do dia</b>\n${lines.join("\n")}`);
  console.log(`\nTop ${top.length}:\n` + lines.map((l) => l.replace(/<\/?b>/g, "")).join("\n"));

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

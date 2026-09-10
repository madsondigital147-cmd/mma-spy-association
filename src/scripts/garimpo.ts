import "dotenv/config";
import { prisma } from "../lib/db";
import { tiktokDomains, tuquejasumaDomains, youtubeDomains } from "../lib/sources/discover";
import { trustpilotDomains } from "../lib/sources/reviewSites";

// Descoberta cruzada de domínios de oferta e (opcional) cria uma fonte.
//   npx tsx src/scripts/garimpo.ts "keto gummies" US --niche emagrecimento
//   npx tsx src/scripts/garimpo.ts "manifestation" US --niche prosperidade --only youtube,trustpilot
async function main() {
  const args = process.argv.slice(2);
  const term = args.find((a) => !a.startsWith("--") && !/^[A-Z]{2}$/.test(a) && a.length > 2) || "";
  const market = (args.find((a) => /^[A-Z]{2}$/.test(a)) || "US").toUpperCase();
  const niche = args[args.indexOf("--niche") + 1] || null;
  const onlyRaw = args[args.indexOf("--only") + 1];
  const only = onlyRaw && !onlyRaw.startsWith("--") ? onlyRaw.split(",") : null;
  const want = (name: string) => !only || only.includes(name);

  if (!term) {
    console.log('uso: npx tsx src/scripts/garimpo.ts "<termo>" <MERCADO> [--niche <n>] [--only tiktok,youtube,trustpilot,tuquejasuma]');
    process.exit(1);
  }

  const all = new Set<string>();
  const add = (label: string, ds: string[]) => {
    console.log(`\n=== ${label} (${ds.length}) ===`);
    ds.forEach((d) => {
      console.log("  " + d);
      all.add(d);
    });
  };

  if (want("trustpilot")) add("TrustPilot", await trustpilotDomains(term, market));
  if (want("tuquejasuma")) add("tuquejasuma", await tuquejasumaDomains(term));
  if (want("youtube")) add("YouTube (descrições)", await youtubeDomains(term));
  if (want("tiktok")) add("TikTok Creative Center", await tiktokDomains(term, market));

  console.log(`\n>>> total: ${all.size} domínios únicos`);

  if (niche && all.size) {
    const src = await prisma.source.create({
      data: { niche, markets: market, keywords: [...all].join("\n"), kind: "reviews", status: "active" },
    });
    console.log(`\nfonte criada: ${src.id} (${niche} / ${market})`);
    console.log(`rode:  npm run mine ${src.id}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

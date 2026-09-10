import "dotenv/config";
import { prisma } from "../lib/db";
import { reclameAquiCompanies, trustpilotDomains } from "../lib/sources/reviewSites";

// Uso:
//   npx tsx src/scripts/reviews.ts "keto gummies" US
//   npx tsx src/scripts/reviews.ts "emagrecedor" BR --create emagrecimento
async function main() {
  const args = process.argv.slice(2);
  const term = args.find((a) => !a.startsWith("--") && a.length > 2) || "";
  const market = (args.find((a) => /^[A-Z]{2}$/.test(a)) || "US").toUpperCase();
  const createIdx = args.indexOf("--create");
  const createNiche = createIdx >= 0 ? args[createIdx + 1] : null;

  if (!term) {
    console.log('uso: npx tsx src/scripts/reviews.ts "<termo>" <MERCADO> [--create <nicho>]');
    process.exit(1);
  }

  console.log(`\n=== TrustPilot (${market}) — "${term}" ===`);
  const domains = await trustpilotDomains(term, market);
  domains.forEach((d) => console.log("  " + d));
  console.log(`  (${domains.length} domínios)`);

  if (market === "BR") {
    console.log(`\n=== Reclame Aqui — "${term}" ===`);
    const cos = await reclameAquiCompanies(term);
    cos.slice(0, 40).forEach((c) => console.log(`  ${c.name}  [${c.slug}]`));
    console.log(`  (${cos.length} empresas — sem domínio direto, use pra pesquisar)`);
  }

  if (createNiche && domains.length) {
    const src = await prisma.source.create({
      data: {
        niche: createNiche,
        markets: market,
        keywords: domains.join("\n"),
        status: "active",
      },
    });
    console.log(`\nfonte criada: ${src.id} (${createNiche} / ${market}, ${domains.length} domínios)`);
    console.log(`rode:  npm run mine ${src.id}`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

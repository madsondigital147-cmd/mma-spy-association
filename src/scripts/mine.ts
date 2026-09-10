import "dotenv/config";
import { prisma } from "../lib/db";
import { runAllActiveSources, runSource } from "../lib/pipeline";

// Uso:
//   npm run mine                       -> roda todas as fontes ativas
//   npm run mine <sourceId>            -> roda uma fonte
//   npm run mine <sourceId> --reconsolidate -> só reprocessa o que já está no banco (sem raspar)
async function main() {
  const args = process.argv.slice(2);
  const reconsolidate = args.includes("--reconsolidate");
  const id = args.find((a) => !a.startsWith("--"));
  const started = Date.now();
  if (id) {
    const r = await runSource(id, { reconsolidate });
    console.log("\nresultado:", r);
  } else {
    const rs = await runAllActiveSources();
    const total = rs.reduce(
      (acc, r) => ({
        raw: acc.raw + r.raw,
        creatives: acc.creatives + r.creatives,
        offers: acc.offers + r.offersUpserted,
      }),
      { raw: 0, creatives: 0, offers: 0 }
    );
    console.log(`\n=== fim: ${total.raw} anúncios brutos -> ${total.creatives} criativos -> ${total.offers} ofertas ===`);
  }
  console.log(`tempo: ${Math.round((Date.now() - started) / 1000)}s`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

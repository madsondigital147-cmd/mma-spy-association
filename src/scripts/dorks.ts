import "dotenv/config";
import { buildDorks, dorkUrl } from "../lib/dorks";
import { NICHES } from "../lib/niches";

// Uso:  npm run dorks <nicheId> [market]
//   npm run dorks prosperidade US
//   npm run dorks emagrecimento BR
const nicheId = process.argv[2];
const market = (process.argv[3] || "US").toUpperCase();

if (!nicheId) {
  console.log("uso: npm run dorks <nicheId> [market]\n\nnichos:");
  console.log(NICHES.map((n) => "  " + n.id).join("\n"));
  process.exit(0);
}

const dorks = buildDorks(nicheId, market);
if (dorks.length === 0) {
  console.log(`nenhum dork pra "${nicheId}" (nicho não existe ou sem seeds nesse mercado)`);
  process.exit(1);
}

console.log(`\n=== dorks: ${nicheId} / ${market} ===\n`);
for (const d of dorks) {
  console.log(`• ${d.label}  [${d.engine}]`);
  console.log(`  ${d.query}`);
  console.log(`  ${dorkUrl(d)}\n`);
}
console.log("cola no navegador, abre as landings boas e joga a URL numa fonte / na Biblioteca.");

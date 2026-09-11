import "dotenv/config";
import { prisma } from "../lib/db";
import { garimpoAllActiveNiches } from "../lib/garimpo";

// npm run garimpo:auto — garimpa TikTok/YouTube/Trustpilot pra cada nicho ativo
// e alimenta as fontes de descoberta (kind tiktok/youtube/reviews) com os
// domínios achados. É o que o worker roda 1x por dia sozinho.
async function main() {
  const started = Date.now();
  const rs = await garimpoAllActiveNiches();
  for (const r of rs) {
    console.log(`${r.niche}: +${r.tiktok} tiktok · +${r.youtube} youtube · +${r.trustpilot} trustpilot`);
  }
  console.log(`tempo: ${Math.round((Date.now() - started) / 1000)}s`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});

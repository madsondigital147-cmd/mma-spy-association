import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { NICHE_BY_ID } from "../src/lib/niches";

const prisma = new PrismaClient();

// Cria uma fonte de exemplo (Emagrecimento · US/GB/DE/BR) com as seeds do nicho,
// só pra você ver as telas com dados de estrutura. Pode apagar depois.
async function main() {
  const niche = NICHE_BY_ID.get("emagrecimento")!;
  const keywords = [
    ...(niche.seeds.en ?? []),
    ...(niche.seeds.pt ?? []),
    ...(niche.seeds.de ?? []),
  ].join("\n");

  const existing = await prisma.source.findFirst({ where: { niche: "emagrecimento" } });
  if (existing) {
    console.log("fonte de exemplo já existe:", existing.id);
    return;
  }

  const src = await prisma.source.create({
    data: { niche: "emagrecimento", markets: "US,GB,DE,BR", keywords, status: "active" },
  });
  console.log("fonte de exemplo criada:", src.id);
  console.log("rode:  npm run mine", src.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

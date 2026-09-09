import "dotenv/config";
import cron from "node-cron";
import { prisma } from "../lib/db";
import { runAllActiveSources } from "../lib/pipeline";

// Alternativa ao Agendador de Tarefas do Windows: deixe `npm run worker` rodando.
// Minera às 08h e 20h e roda o veredito logo depois.

async function cycle() {
  const t = new Date().toLocaleString("pt-BR");
  console.log(`\n[${t}] iniciando ciclo de mineração`);
  try {
    const rs = await runAllActiveSources();
    const offers = rs.reduce((a, r) => a + r.offersUpserted, 0);
    console.log(`[${t}] ciclo ok — ${offers} ofertas atualizadas`);
  } catch (e) {
    console.error(`[${t}] ciclo falhou:`, (e as Error).message);
  }
  // veredito em processo separado para isolar erro de rede do LLM
  try {
    const { execSync } = await import("node:child_process");
    execSync("npm run verdict", { stdio: "inherit" });
  } catch {
    /* já loga sozinho */
  }
}

cron.schedule("0 8,20 * * *", cycle);
console.log("worker no ar — mineração agendada para 08h e 20h. Ctrl+C para parar.");

if (process.argv.includes("--now")) cycle();

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { runSource } from "@/lib/pipeline";

export const maxDuration = 300;

// Dispara a mineração da fonte. Roda em processo (single-user local).
// A tela não espera — chama e segue.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // No deploy (Vercel) o scraper não roda — Chromium headless não cabe em função
  // serverless. A mineração roda no PC/VPS via `npm run mine` / worker.
  if (process.env.VERCEL) {
    return NextResponse.json(
      { error: "mineração roda no PC/VPS, não no deploy. Use npm run mine ou o worker." },
      { status: 409 }
    );
  }

  const source = await prisma.source.findUnique({ where: { id } });
  if (!source) return NextResponse.json({ error: "fonte não existe" }, { status: 404 });

  runSource(id)
    .then((r) => console.log(`[api] fonte ${id} minerada:`, r))
    .catch((e) => console.error(`[api] fonte ${id} falhou:`, (e as Error).message));

  return NextResponse.json({ started: true });
}

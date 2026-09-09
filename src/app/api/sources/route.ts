import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseKeywords } from "@/lib/keywords";

const Body = z.object({
  niche: z.string().min(1),
  markets: z.array(z.string().min(2).max(3)).min(1),
  keywords: z.string().min(2),
});

export async function GET() {
  const sources = await prisma.source.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(sources);
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const { niche, markets, keywords } = parsed.data;
  if (parseKeywords(keywords).length === 0) {
    return NextResponse.json({ error: "nenhuma palavra-chave válida" }, { status: 400 });
  }

  const source = await prisma.source.create({
    data: { niche, markets: markets.join(","), keywords, status: "active" },
  });
  return NextResponse.json({ id: source.id });
}

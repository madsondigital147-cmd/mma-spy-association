import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Patch = z.object({
  status: z.enum(["active", "paused"]).optional(),
  keywords: z.string().optional(),
  markets: z.array(z.string()).optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.keywords != null) data.keywords = parsed.data.keywords;
  if (parsed.data.markets) data.markets = parsed.data.markets.join(",");

  const updated = await prisma.source.update({ where: { id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.source.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

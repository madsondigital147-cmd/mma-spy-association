import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Body = z.object({
  pageId: z.string().min(1),
  pageName: z.string().default("?"),
  watch: z.boolean(),
});

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  const { pageId, pageName, watch } = p.data;

  if (watch) {
    await prisma.pageWatch.upsert({
      where: { pageId },
      create: { pageId, pageName },
      update: { pageName },
    });
  } else {
    await prisma.pageWatch.deleteMany({ where: { pageId } });
  }
  return NextResponse.json({ ok: true, watch });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Patch = z.object({
  status: z.enum(["new", "approved", "testing", "ignored"]).optional(),
  angle: z.string().max(300).optional(),
  favorite: z.boolean().optional(),
  recommended: z.boolean().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.favorite === true) data.favoritedAt = new Date();
  if (parsed.data.favorite === false) data.favoritedAt = null;

  const offer = await prisma.offer.update({ where: { id }, data });

  // favoritar => passa a monitorar o anunciante também
  if (parsed.data.favorite === true && offer.pageId && offer.pageId !== "?") {
    await prisma.pageWatch
      .upsert({
        where: { pageId: offer.pageId },
        create: { pageId: offer.pageId, pageName: offer.advertiser },
        update: {},
      })
      .catch(() => {});
  }

  if (parsed.data.status === "testing") {
    const open = await prisma.offerTest.findFirst({ where: { offerId: id, status: "running" } });
    if (!open) await prisma.offerTest.create({ data: { offerId: id, angle: parsed.data.angle } });
  }

  return NextResponse.json(offer);
}

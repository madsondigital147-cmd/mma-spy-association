import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const Patch = z.object({
  status: z.enum(["new", "approved", "testing", "ignored"]).optional(),
  angle: z.string().max(300).optional(),
  favorite: z.boolean().optional(),
  recommended: z.boolean().optional(),
  testResult: z.enum(["win", "loss"]).optional(),
  roas: z.number().min(0).max(1000).optional(), // resultado real da campanha — fecha o loop no score
  profitCents: z.number().int().optional(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "payload inválido" }, { status: 400 });

  const { testResult, roas, profitCents, ...offerFields } = parsed.data;
  const data: Record<string, unknown> = { ...offerFields };
  if (parsed.data.favorite === true) data.favoritedAt = new Date();
  if (parsed.data.favorite === false) data.favoritedAt = null;

  const offer = Object.keys(data).length
    ? await prisma.offer.update({ where: { id }, data })
    : await prisma.offer.findUniqueOrThrow({ where: { id } });

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

  // fecha o teste com o resultado real — é isso que vira "Winner". ROAS/lucro
  // reais, quando informados, fecham o loop: a próxima rodada de mineração usa
  // isso pra ajustar o score (ver realWinRoas em pipeline.ts).
  if (testResult) {
    const testData = { status: testResult, ...(roas != null ? { roas } : {}), ...(profitCents != null ? { profitCents } : {}) };
    const open = await prisma.offerTest.findFirst({ where: { offerId: id, status: "running" }, orderBy: { startedAt: "desc" } });
    if (open) {
      await prisma.offerTest.update({ where: { id: open.id }, data: testData });
    } else {
      await prisma.offerTest.create({ data: { offerId: id, ...testData } });
    }
    if (testResult === "win" && offer.status !== "approved") {
      await prisma.offer.update({ where: { id }, data: { status: "approved" } });
    }
  }

  return NextResponse.json(offer);
}

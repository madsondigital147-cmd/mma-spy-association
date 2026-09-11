import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { translateText } from "@/lib/translate";

const Body = z.object({ hook: z.string().max(400).optional() });

// Traduz o título da oferta (cacheado em Offer.titlePt) e, se enviado, o hook
// do criativo (não cacheado no banco — vem de MinedCreative, muda por criativo).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  const hook = parsed.success ? parsed.data.hook : undefined;

  const offer = await prisma.offer.findUnique({ where: { id }, select: { title: true, titlePt: true } });
  if (!offer) return NextResponse.json({ error: "oferta não existe" }, { status: 404 });

  let titlePt = offer.titlePt;
  if (!titlePt) {
    titlePt = await translateText(offer.title, "pt");
    if (titlePt && titlePt !== offer.title) {
      await prisma.offer.update({ where: { id }, data: { titlePt } }).catch(() => {});
    }
  }

  const hookPt = hook ? await translateText(hook, "pt") : null;

  return NextResponse.json({ titlePt, hookPt });
}

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Serve o "print da frente do criativo" a partir do cache no banco.
// /i/<hash>  ->  bytes do MediaCache (nunca expira).
export async function GET(_req: Request, { params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const row = await prisma.mediaCache.findUnique({ where: { hash } });
  if (!row) return new Response("not found", { status: 404 });
  const body = Buffer.isBuffer(row.bytes) ? row.bytes : Buffer.from(row.bytes as unknown as ArrayBuffer);
  return new Response(new Uint8Array(body), {
    status: 200,
    headers: {
      "content-type": row.mime || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
}

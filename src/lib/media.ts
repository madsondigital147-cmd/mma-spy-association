import { createHash } from "node:crypto";
import { prisma } from "./db";
import { fetchBuffer, videoPosterBuffer } from "./hash";

// Cache durável do "print da frente do criativo".
// A CDN do FB assina os links e eles expiram em horas/dias. Aqui a gente baixa
// uma vez, redimensiona pequeno e guarda os bytes no Postgres (MediaCache).
// O front serve por /i/<hash> — nunca mais quebra.

const MAX_W = 512;

async function shrink(buf: Buffer): Promise<{ bytes: Buffer; mime: string } | null> {
  try {
    const sharp = (await import("sharp")).default;
    const out = await sharp(buf).rotate().resize(MAX_W, MAX_W, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 72 }).toBuffer();
    return { bytes: out, mime: "image/jpeg" };
  } catch {
    // sharp falhou (formato raro) — guarda o original se for pequeno
    return buf.length <= 400_000 ? { bytes: buf, mime: "image/jpeg" } : null;
  }
}

/**
 * Garante um poster no cache. `key` estável por criativo (mediaHash). `url` é a
 * imagem estática do FB; `videoUrl` (opcional) é usado como fallback via ffmpeg.
 * Devolve a chave do /i/<hash> ou null se não deu pra capturar nada.
 */
export async function cachePoster(key: string, url?: string | null, videoUrl?: string | null): Promise<string | null> {
  if (!key) return null;
  const hash = "p:" + createHash("sha1").update(key).digest("hex").slice(0, 24);
  const existing = await prisma.mediaCache.findUnique({ where: { hash }, select: { hash: true } });
  if (existing) return hash;

  let raw: Buffer | null = null;
  if (url && /^https?:\/\//i.test(url)) raw = await fetchBuffer(url, 15000);
  if (!raw && videoUrl && /^https?:\/\//i.test(videoUrl)) raw = await videoPosterBuffer(videoUrl);
  if (!raw || raw.length < 400) return null;

  const small = await shrink(raw);
  if (!small) return null;

  try {
    await prisma.mediaCache.upsert({
      where: { hash },
      create: { hash, mime: small.mime, bytes: new Uint8Array(small.bytes) },
      update: {},
    });
    return hash;
  } catch {
    return null;
  }
}

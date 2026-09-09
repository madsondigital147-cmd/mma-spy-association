import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

// ---------------------------------------------------------------------------
// Fingerprint de criativo.
//   - imagem  -> dHash de 64 bits (perceptual, resistente a recorte/compressão leve)
//   - vídeo   -> hash da URL normalizada (sem query) — v1, ver README
//   - sem mídia (path da API oficial) -> hash da copy normalizada
// ---------------------------------------------------------------------------

const MEDIA_DIR = process.env.MEDIA_DIR || "./media";

export function normalizeText(text: string | null | undefined): string {
  return (text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

export function textHash(text: string | null | undefined): string {
  const norm = normalizeText(text);
  if (!norm) return "";
  return "t:" + createHash("sha1").update(norm).digest("hex").slice(0, 24);
}

export function urlHash(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  return "v:" + createHash("sha1").update(clean).digest("hex").slice(0, 24);
}

export async function fetchBuffer(url: string, timeoutMs = 15000): Promise<Buffer | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "Mozilla/5.0" } });
    clearTimeout(t);
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

/** dHash 64 bits em hex (16 chars). Requer `sharp`. */
export async function imageDHash(buf: Buffer): Promise<string | null> {
  try {
    const sharp = (await import("sharp")).default;
    const w = 9;
    const h = 8;
    const raw = await sharp(buf).grayscale().resize(w, h, { fit: "fill" }).raw().toBuffer();
    let bits = "";
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w - 1; col++) {
        const left = raw[row * w + col];
        const right = raw[row * w + col + 1];
        bits += left < right ? "1" : "0";
      }
    }
    let hex = "";
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return "i:" + hex;
  } catch {
    return null;
  }
}

export async function saveMedia(buf: Buffer, key: string, ext: string): Promise<string> {
  const dir = path.resolve(MEDIA_DIR);
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `${key}.${ext}`);
  await writeFile(file, buf);
  return file;
}

const HEX = "0123456789abcdef";
function nibbleBits(c: string): number {
  const v = HEX.indexOf(c);
  return v < 0 ? 0 : v;
}

/** Distância de Hamming entre dois hashes "i:<hex>". Retorna 999 se incomparáveis. */
export function hamming(a: string, b: string): number {
  if (!a || !b) return 999;
  if (!a.startsWith("i:") || !b.startsWith("i:")) return a === b ? 0 : 999;
  const ha = a.slice(2);
  const hb = b.slice(2);
  if (ha.length !== hb.length) return 999;
  let d = 0;
  for (let i = 0; i < ha.length; i++) {
    let x = nibbleBits(ha[i]) ^ nibbleBits(hb[i]);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

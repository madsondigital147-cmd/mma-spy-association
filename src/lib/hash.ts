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

// Tira byte nulo, controles C0/C1 e surrogates soltos — o Postgres rejeita isso.
export function stripControl(text: string | null | undefined): string {
  if (!text) return "";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13) {
      out += " ";
      continue;
    }
    if (c < 0x20 || (c >= 0x7f && c <= 0x9f)) continue;
    if (c >= 0xd800 && c <= 0xdbff) {
      const n = text.charCodeAt(i + 1);
      if (n >= 0xdc00 && n <= 0xdfff) {
        out += text[i] + text[i + 1];
        i++;
      }
      continue;
    }
    if (c >= 0xdc00 && c <= 0xdfff) continue;
    out += text[i];
  }
  return out;
}

export function normalizeText(text: string | null | undefined): string {
  return stripControl(text)
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

// pHash de um frame do vídeo — pega ~1s, extrai 1 quadro com ffmpeg e roda dHash.
// Assim o MESMO vídeo re-upado (URL diferente) agrupa no mesmo criativo.
async function findFfmpeg(): Promise<string | null> {
  if (process.env.MMASPY_FFMPEG) return process.env.MMASPY_FFMPEG;
  const { existsSync } = await import("node:fs");
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const guesses = [
    path.join(home, "AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe"),
    path.join(home, "AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg.exe"),
    "ffmpeg",
  ];
  for (const g of guesses) {
    try {
      if (g === "ffmpeg" || existsSync(g)) return g;
    } catch {
      /* ignore */
    }
  }
  return null;
}

export async function videoFrameHash(url: string): Promise<string | null> {
  try {
    const ff = await findFfmpeg();
    if (!ff) return null;
    const { execFile } = await import("node:child_process");
    const { readFile, unlink } = await import("node:fs/promises");
    const os = await import("node:os");
    const out = path.join(os.tmpdir(), `mmaspy_${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`);
    await new Promise<void>((resolve, reject) => {
      execFile(
        ff,
        ["-ss", "1", "-i", url, "-frames:v", "1", "-vf", "scale=64:-1", "-y", out],
        { timeout: 20000 },
        (err) => (err ? reject(err) : resolve())
      );
    });
    const buf = await readFile(out).catch(() => null);
    unlink(out).catch(() => {});
    if (!buf || buf.length < 200) return null;
    return imageDHash(buf);
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

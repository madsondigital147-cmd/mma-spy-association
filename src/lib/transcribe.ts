// Fase 2 — transcrição opcional da fala do vídeo do anúncio.
// Desligada por padrão (custo). Aceita qualquer endpoint compatível com a API
// da OpenAI (/audio/transcriptions, modelo whisper-1 ou similar).

const ENABLED = process.env.TRANSCRIBE_ENABLED === "true";
const BASE = process.env.TRANSCRIBE_BASE_URL || "https://api.openai.com/v1";
const KEY = process.env.TRANSCRIBE_API_KEY || "";
const MODEL = process.env.TRANSCRIBE_MODEL || "whisper-1";

export function transcribeEnabled(): boolean {
  return ENABLED && !!KEY;
}

export async function transcribeVideo(url: string): Promise<string | null> {
  if (!transcribeEnabled()) return null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 60000);
    const media = await fetch(url, { signal: ctrl.signal });
    if (!media.ok) {
      clearTimeout(t);
      return null;
    }
    const buf = Buffer.from(await media.arrayBuffer());
    clearTimeout(t);
    if (buf.length > 24 * 1024 * 1024) return null; // limite típico de 25MB

    const form = new FormData();
    form.append("file", new Blob([buf]), "ad.mp4");
    form.append("model", MODEL);
    form.append("response_format", "text");

    const res = await fetch(`${BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { authorization: `Bearer ${KEY}` },
      body: form,
    });
    if (!res.ok) return null;
    const txt = (await res.text()).trim();
    return txt ? txt.slice(0, 8000) : null;
  } catch {
    return null;
  }
}

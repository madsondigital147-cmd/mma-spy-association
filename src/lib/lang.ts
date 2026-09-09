// Detecção de idioma barata por stopwords. Suficiente para rotear palavra-chave
// e marcar o idioma da oferta. Não é NLP sério — é heurística.

const STOP: Record<string, string[]> = {
  en: ["the", "and", "your", "you", "for", "with", "this", "that", "how", "without", "best", "get"],
  pt: ["que", "para", "com", "uma", "não", "como", "seu", "sua", "por", "mais", "isso", "você", "de"],
  es: ["que", "para", "con", "una", "como", "tu", "por", "más", "sin", "el", "la", "de"],
  de: ["und", "der", "die", "das", "mit", "ohne", "für", "ihre", "wie", "schnell", "nicht"],
  fr: ["le", "la", "les", "et", "pour", "avec", "sans", "votre", "comment", "vite"],
  it: ["il", "la", "le", "e", "per", "con", "senza", "come", "tuo", "veloce"],
};

export type Lang = "en" | "pt" | "es" | "de" | "fr" | "it" | "unknown";

export function detectLang(text: string | null | undefined): Lang {
  if (!text) return "unknown";
  const words = text.toLowerCase().replace(/[^\p{L}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (words.length === 0) return "unknown";
  const set = new Set(words);
  let best: Lang = "unknown";
  let bestScore = 0;
  for (const [lang, stops] of Object.entries(STOP)) {
    let hits = 0;
    for (const s of stops) if (set.has(s)) hits++;
    // acento forte de PT/ES
    if (lang === "pt" && /[ãõáâàéêíóôúç]/i.test(text)) hits += 2;
    if (lang === "es" && /[¿¡ñáéíóú]/i.test(text)) hits += 2;
    if (lang === "de" && /[äöüß]/i.test(text)) hits += 2;
    if (hits > bestScore) {
      bestScore = hits;
      best = lang as Lang;
    }
  }
  return bestScore >= 1 ? best : "unknown";
}

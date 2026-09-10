// Tradução de palavra-chave "na hora da pesquisa": a Source guarda os termos num
// idioma só; quando o minerador busca num mercado de outro idioma, traduz o termo
// pro nativo antes de jogar na Biblioteca. Dicionário do nicho + fallback MyMemory.

export type Lang = "en" | "pt" | "es" | "de" | "fr" | "it";

const MARKET_LANG: Record<string, Lang> = {
  US: "en", GB: "en", CA: "en", AU: "en", IE: "en", NZ: "en",
  BR: "pt", PT: "pt",
  ES: "es", MX: "es", AR: "es", CO: "es", CL: "es", PE: "es",
  DE: "de", AT: "de",
  FR: "fr", BE: "fr",
  IT: "it",
};

export function marketLang(code: string): Lang {
  return MARKET_LANG[code.toUpperCase()] ?? "en";
}

// Dicionário curado do vocabulário de prosperidade / manifestação / DR genérico.
// chave = frase EN normalizada (minúscula, sem acento).
const DICT: Record<string, Partial<Record<Lang, string>>> = {
  "manifestation": { fr: "manifestation", de: "Manifestation", es: "manifestación", pt: "manifestação", it: "manifestazione" },
  "abundance": { fr: "abondance", de: "Fülle", es: "abundancia", pt: "abundância", it: "abbondanza" },
  "manifest money": { fr: "manifester de l'argent", de: "Geld manifestieren", es: "manifestar dinero", pt: "manifestar dinheiro", it: "manifestare denaro" },
  "money manifestation": { fr: "manifestation d'argent", de: "Geld-Manifestation", es: "manifestación de dinero", pt: "manifestação de dinheiro", it: "manifestazione di denaro" },
  "wealth manifestation": { fr: "manifestation de richesse", de: "Reichtum manifestieren", es: "manifestación de riqueza", pt: "manifestar riqueza", it: "manifestazione della ricchezza" },
  "manifest abundance": { fr: "manifester l'abondance", de: "Fülle manifestieren", es: "manifestar abundancia", pt: "manifestar abundância" },
  "law of attraction": { fr: "loi de l'attraction", de: "Gesetz der Anziehung", es: "ley de la atracción", pt: "lei da atração", it: "legge di attrazione" },
  "biblical manifestation": { fr: "manifestation biblique", de: "biblische Manifestation", es: "manifestación bíblica", pt: "manifestação bíblica" },
  "god frequency": { fr: "fréquence de Dieu", de: "Frequenz Gottes", es: "frecuencia de Dios", pt: "frequência de Deus" },
  "divine frequency": { fr: "fréquence divine", de: "göttliche Frequenz", es: "frecuencia divina", pt: "frequência divina" },
  "divine script": { fr: "script divin", de: "göttliches Skript", es: "guion divino", pt: "roteiro divino", it: "copione divino" },
  "12 word script": { fr: "script de 12 mots", de: "12-Wörter-Skript", es: "guion de 12 palabras", pt: "roteiro de 12 palavras", it: "copione di 12 parole" },
  "12 words": { fr: "12 mots", de: "12 Wörter", es: "12 palabras", pt: "12 palavras", it: "12 parole" },
  "wealth frequency": { fr: "fréquence de la richesse", de: "Wohlstandsfrequenz", es: "frecuencia de la riqueza", pt: "frequência da riqueza" },
  "money frequency": { fr: "fréquence de l'argent", de: "Geldfrequenz", es: "frecuencia del dinero", pt: "frequência do dinheiro" },
  "abundance frequency": { fr: "fréquence de l'abondance", de: "Fülle-Frequenz", es: "frecuencia de la abundancia", pt: "frequência da abundância" },
  "millionaire mind": { fr: "esprit millionnaire", de: "Millionärs-Gehirn", es: "mente millonaria", pt: "mente milionária" },
  "millionaire mindset": { fr: "état d'esprit millionnaire", de: "Millionär-Mindset", es: "mentalidad millonaria", pt: "mentalidade milionária" },
  "financial breakthrough": { fr: "percée financière", de: "finanzieller Durchbruch", es: "avance financiero", pt: "virada financeira" },
  "prosperity prayer": { fr: "prière de prospérité", de: "Wohlstandsgebet", es: "oración de prosperidad", pt: "oração de prosperidade" },
  "money prayer": { fr: "prière pour l'argent", de: "Gebet für Geld", es: "oración para el dinero", pt: "oração para dinheiro" },
  "abundance prayer": { fr: "prière d'abondance", de: "Gebet für Fülle", es: "oración de abundancia", pt: "oração da abundância" },
  "biblical abundance": { fr: "abondance biblique", de: "biblische Fülle", es: "abundancia bíblica", pt: "abundância bíblica" },
  "biblical secret": { fr: "secret biblique", de: "biblisches Geheimnis", es: "secreto bíblico", pt: "segredo bíblico" },
  "hidden bible secret": { fr: "secret caché de la Bible", de: "verstecktes Bibel-Geheimnis", es: "secreto oculto de la Biblia", pt: "segredo escondido da bíblia" },
  "ancient prayer": { fr: "prière ancienne", de: "uraltes Gebet", es: "oración antigua", pt: "oração antiga" },
  "unlock abundance": { fr: "débloquer l'abondance", de: "Fülle freischalten", es: "desbloquear la abundancia", pt: "destravar a abundância" },
  "manifestation secret": { fr: "secret de manifestation", de: "Manifestations-Geheimnis", es: "secreto de manifestación", pt: "segredo da manifestação" },
};

const cache = new Map<string, string>();

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

// não traduz: domínios, tokens sem letra, siglas curtas (iscas de link de exibição)
function skipTranslate(kw: string): boolean {
  return !/[a-zà-ú]/i.test(kw) || /\.[a-z]{2,}$/i.test(kw) || (kw.length <= 4 && !kw.includes(" "));
}

export async function translateKeyword(kw: string, target: Lang): Promise<string> {
  if (target === "en" || skipTranslate(kw)) return kw;
  const key = `${target}:${norm(kw)}`;
  if (cache.has(key)) return cache.get(key)!;

  const dict = DICT[norm(kw)]?.[target];
  if (dict) {
    cache.set(key, dict);
    return dict;
  }

  try {
    const email = process.env.TRANSLATE_EMAIL ? `&de=${encodeURIComponent(process.env.TRANSLATE_EMAIL)}` : "";
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(kw)}&langpair=en|${target}${email}`;
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);
    const json = await res.json();
    const out = String(json?.responseData?.translatedText || "").trim();
    if (out && out.toLowerCase() !== kw.toLowerCase() && !/MYMEMORY WARNING|INVALID/i.test(out)) {
      cache.set(key, out);
      return out;
    }
  } catch {
    /* fica no original */
  }
  cache.set(key, kw);
  return kw;
}

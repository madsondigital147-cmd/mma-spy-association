// ISO-3166 alpha-2 -> emoji de bandeira (regional indicator symbols)
export function flag(code: string): string {
  const c = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

const NAMES: Record<string, string> = {
  US: "EUA", GB: "Reino Unido", CA: "Canadá", AU: "Austrália", IE: "Irlanda", NZ: "N. Zelândia",
  BR: "Brasil", PT: "Portugal", DE: "Alemanha", AT: "Áustria", FR: "França", BE: "Bélgica",
  IT: "Itália", ES: "Espanha", MX: "México", NL: "Holanda", PL: "Polônia", SE: "Suécia",
};
export function countryName(code: string): string {
  return NAMES[code.trim().toUpperCase()] ?? code.toUpperCase();
}

const LANG_FLAG: Record<string, string> = {
  en: "GB", pt: "BR", es: "ES", de: "DE", fr: "FR", it: "IT",
};
const LANG_NAME: Record<string, string> = {
  en: "Inglês", pt: "Português", es: "Espanhol", de: "Alemão", fr: "Francês", it: "Italiano",
};
export function langFlag(lang: string | null | undefined): string {
  return lang && LANG_FLAG[lang] ? flag(LANG_FLAG[lang]) : "";
}
export function langName(lang: string | null | undefined): string {
  return lang && LANG_NAME[lang] ? LANG_NAME[lang] : (lang ?? "—");
}

export function marketsFlags(csv: string): string {
  return [...new Set(csv.split(",").map((s) => s.trim()).filter(Boolean))].map(flag).join(" ");
}

// Converte o bloco de texto colado na tela "Fontes" numa lista limpa.
// Aceita uma por linha OU separado por vírgula. Ignora vazias e linhas com "#".

export function parseKeywords(raw: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const linePart of raw.split(/\r?\n/)) {
    const line = linePart.trim();
    if (!line || line.startsWith("#")) continue;
    const chunks = line.includes(",") ? line.split(",") : [line];
    for (const c of chunks) {
      const kw = c.trim().replace(/\s+/g, " ").toLowerCase();
      if (kw.length < 2 || kw.length > 120) continue;
      if (seen.has(kw)) continue;
      seen.add(kw);
      out.push(kw);
    }
  }
  return out;
}

export function keywordCount(raw: string): number {
  return parseKeywords(raw).length;
}

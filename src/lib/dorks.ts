// Fase 4 — Google/Yandex dorks pra garimpar landing pages e pressels que não
// aparecem fácil na Biblioteca. Templates prontos; o `npm run dorks` monta as
// queries pra você colar (Google bloqueia automação, então é harvest-assist).

import { NICHE_BY_ID } from "./niches";

export interface Dork {
  label: string;
  query: string;
  engine: "google" | "yandex";
}

// disclaimer padrão de quem roda DR no Facebook
const FB_DISCLAIMER = '"This site is not a part of the Facebook website or Facebook Inc"';

// padrões de tecnologia / checkout
const TECH_PATTERNS = [
  '"scripts.converteai.net"', // VTurb
  '"cdn.converteai.net"',
  '"pay.hotmart.com"',
  '"cartpanda"',
  '"clickbank.net"',
  '"digistore24"',
  '"buygoods.com"',
];

export function buildDorks(nicheId: string, market = "US"): Dork[] {
  const n = NICHE_BY_ID.get(nicheId);
  const langKeys = market === "BR" ? ["pt"] : market === "IT" ? ["it"] : market === "ES" ? ["es"] : ["en"];
  const seeds = (n ? langKeys.flatMap((k) => (n.seeds as Record<string, string[]>)[k] ?? []) : []).slice(0, 6);

  const out: Dork[] = [];

  // 1. disclaimer + termo do nicho -> pressels e advertorials
  for (const s of seeds) {
    out.push({
      label: `pressel/advertorial — "${s}"`,
      engine: "google",
      query: `${FB_DISCLAIMER} "${s}"`,
    });
  }

  // 2. tecnologia + termo do nicho -> páginas de VSL / checkout
  for (const s of seeds.slice(0, 3)) {
    out.push({
      label: `VSL/checkout — "${s}"`,
      engine: "google",
      query: `(${TECH_PATTERNS.slice(0, 3).join(" OR ")}) "${s}"`,
    });
  }

  // 3. site: nos builders de quiz/página (BR)
  if (market === "BR") {
    for (const s of seeds.slice(0, 3)) {
      out.push({ label: `quiz Inlead — "${s}"`, engine: "google", query: `site:lead.digital "${s}"` });
      out.push({ label: `quiz Cacto — "${s}"`, engine: "google", query: `site:quiz.cacto.com.br "${s}"` });
    }
  }

  // 4. related-topics / advertorial gringo
  for (const s of seeds.slice(0, 2)) {
    out.push({
      label: `related-topics loop — "${s}"`,
      engine: "google",
      query: `"related topics" "${s}" ${FB_DISCLAIMER}`,
    });
  }

  // 5. Yandex guarda o que o Google já removeu
  for (const s of seeds.slice(0, 3)) {
    out.push({
      label: `Yandex (histórico) — "${s}"`,
      engine: "yandex",
      query: `${FB_DISCLAIMER} "${s}"`,
    });
  }

  return out;
}

export function dorkUrl(d: Dork): string {
  const q = encodeURIComponent(d.query);
  return d.engine === "yandex"
    ? `https://yandex.com/search/?text=${q}`
    : `https://www.google.com/search?q=${q}&num=50`;
}

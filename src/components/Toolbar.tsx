"use client";

import { useRouter } from "next/navigation";
import { NICHES } from "@/lib/niches";
import { flag } from "@/lib/flags";

const STATUSES: [string, string][] = [
  ["new", "Novas"],
  ["approved", "Aprovadas"],
  ["testing", "Testando"],
  ["ignored", "Ignoradas"],
];
const SORTS: [string, string][] = [
  ["ads", "mais anúncios"],
  ["scaling", "escalando"],
  ["days", "mais dias no ar"],
  ["score", "score"],
];
const MARKETS = ["US", "GB", "FR", "DE", "BR", "ES", "IT"];
const TIERS: [string, string][] = [
  ["10", "📈 +10 (padrão — oportunidade confirmada)"],
  ["20", "📈 +20"],
  ["50", "🔥 +50"],
  ["100", "🔥 +100"],
  ["0", "todas (2+, ainda validando)"],
];

export function Toolbar({
  status,
  niche,
  sort,
  market,
  tier,
  onlyDup,
  onlyArb,
  onlyMulti,
  onlyFav,
  onlyRec,
  onlyCloak,
  counts,
  favCount,
  recCount,
}: {
  status: string;
  niche: string;
  sort: string;
  market: string;
  tier: string;
  onlyDup: boolean;
  onlyArb: boolean;
  onlyMulti: boolean;
  onlyFav: boolean;
  onlyRec: boolean;
  onlyCloak: boolean;
  counts: Record<string, number>;
  favCount: number;
  recCount: number;
}) {
  const router = useRouter();
  function apply(patch: Record<string, string | null>) {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(patch)) {
      if (v == null || v === "") url.searchParams.delete(k);
      else url.searchParams.set(k, v);
    }
    router.push(url.pathname + url.search);
  }

  return (
    <div className="toolbar">
      {STATUSES.map(([v, l]) => (
        <span
          key={v}
          className={"chip" + (status === v && !onlyFav && !onlyRec ? " on" : "")}
          onClick={() => apply({ status: v, fav: null, rec: null })}
        >
          {l}
          {counts[v] ? ` ${counts[v]}` : ""}
        </span>
      ))}
      <span
        className={"chip" + (onlyRec ? " on" : "")}
        onClick={() => apply({ rec: onlyRec ? null : "1", fav: null })}
        style={{ color: onlyRec ? undefined : "#b8a6ff" }}
      >
        ★ recomendadas{recCount ? ` ${recCount}` : ""}
      </span>
      <span className={"chip" + (onlyFav ? " on" : "")} onClick={() => apply({ fav: onlyFav ? null : "1", rec: null })}>
        ⭐ favoritos{favCount ? ` ${favCount}` : ""}
      </span>

      <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />

      <select
        className="chip"
        value={tier}
        onChange={(e) => apply({ tier: e.target.value === "10" ? null : e.target.value })}
        style={{ fontWeight: 600 }}
      >
        {TIERS.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <select className="chip" value={sort} onChange={(e) => apply({ sort: e.target.value })}>
        {SORTS.map(([v, l]) => (
          <option key={v} value={v}>
            ordenar: {l}
          </option>
        ))}
      </select>
      <span className={"chip" + (onlyDup ? " on" : "")} onClick={() => apply({ dup: onlyDup ? null : "1" })}>
        escalando / duplicando
      </span>
      <span className={"chip" + (onlyCloak ? " on" : "")} onClick={() => apply({ cloak: onlyCloak ? null : "1" })}>
        possível cloaker
      </span>
      <span className={"chip" + (onlyArb ? " on" : "")} onClick={() => apply({ arb: onlyArb ? null : "1" })}>
        arbitragem
      </span>
      <span className={"chip" + (onlyMulti ? " on" : "")} onClick={() => apply({ multidom: onlyMulti ? null : "1" })}>
        multi-domínio
      </span>
      <select className="chip" value={market} onChange={(e) => apply({ market: e.target.value || null })}>
        <option value="">todos os países</option>
        {MARKETS.map((m) => (
          <option key={m} value={m}>
            {flag(m)} {m}
          </option>
        ))}
      </select>
      <select className="chip" value={niche} onChange={(e) => apply({ niche: e.target.value || null })}>
        <option value="">todos os nichos</option>
        {NICHES.map((n) => (
          <option key={n.id} value={n.id}>
            {n.label}
          </option>
        ))}
      </select>
    </div>
  );
}

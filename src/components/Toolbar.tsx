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

export function Toolbar({
  status,
  niche,
  sort,
  market,
  onlyDup,
  onlyArb,
  onlyMulti,
  counts,
}: {
  status: string;
  niche: string;
  sort: string;
  market: string;
  onlyDup: boolean;
  onlyArb: boolean;
  onlyMulti: boolean;
  counts: Record<string, number>;
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
        <span key={v} className={"chip" + (status === v ? " on" : "")} onClick={() => apply({ status: v })}>
          {l}
          {counts[v] ? ` ${counts[v]}` : ""}
        </span>
      ))}
      <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
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

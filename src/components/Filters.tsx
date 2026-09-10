"use client";

import { useRouter } from "next/navigation";
import { NICHES } from "@/lib/niches";

const STATUSES: [string, string][] = [
  ["new", "Novas"],
  ["approved", "Aprovadas"],
  ["testing", "Testando"],
  ["ignored", "Ignoradas"],
];

export function FilaFilters({
  status,
  niche,
  onlyArbitrage,
  onlyScaling,
  onlyMultiDomain,
  minAds,
  counts,
}: {
  status: string;
  niche: string;
  onlyArbitrage: boolean;
  onlyScaling: boolean;
  onlyMultiDomain: boolean;
  minAds: number;
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
      {STATUSES.map(([val, label]) => (
        <span
          key={val}
          className={"chip" + (status === val ? " on" : "")}
          onClick={() => apply({ status: val })}
        >
          {label}
          {counts[val] ? ` ${counts[val]}` : ""}
        </span>
      ))}

      <span style={{ width: 1, background: "var(--border)", margin: "0 4px" }} />

      <span
        className={"chip" + (onlyScaling ? " on" : "")}
        onClick={() => apply({ scaling: onlyScaling ? null : "1" })}
      >
        escalando
      </span>
      <span
        className={"chip" + (onlyArbitrage ? " on" : "")}
        onClick={() => apply({ arbitrage: onlyArbitrage ? null : "1" })}
      >
        arbitragem de geo
      </span>
      <span
        className={"chip" + (onlyMultiDomain ? " on" : "")}
        onClick={() => apply({ multidom: onlyMultiDomain ? null : "1" })}
      >
        multi-domínio
      </span>
      <span className={"chip" + (minAds >= 3 ? " on" : "")} onClick={() => apply({ minAds: minAds >= 3 ? null : "3" })}>
        3+ anúncios no criativo
      </span>

      <select
        className="chip"
        value={niche}
        onChange={(e) => apply({ niche: e.target.value || null })}
        style={{ padding: "5px 10px" }}
      >
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

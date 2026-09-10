"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { NICHES, MARKETS, NICHE_BY_ID } from "@/lib/niches";

export function SourceForm() {
  const router = useRouter();
  const [niche, setNiche] = useState("emagrecimento");
  const [markets, setMarkets] = useState<string[]>(["US", "GB", "DE", "BR"]);
  const [kind, setKind] = useState<"meta" | "reviews" | "tiktok" | "youtube">("meta");
  const [kw, setKw] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const parsed = useMemo(
    () => kw.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#")),
    [kw]
  );

  function toggleMarket(code: string) {
    setMarkets((m) => (m.includes(code) ? m.filter((x) => x !== code) : [...m, code]));
  }

  function loadSeeds() {
    const n = NICHE_BY_ID.get(niche);
    if (!n) return;
    const all = Object.values(n.seeds).flat();
    setKw((prev) => (prev.trim() ? prev.trim() + "\n" + all.join("\n") : all.join("\n")));
  }

  async function start() {
    if (parsed.length === 0) {
      setMsg("cole ao menos uma palavra-chave");
      return;
    }
    if (markets.length === 0) {
      setMsg("escolha ao menos um mercado");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ niche, markets, keywords: kw, kind }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "falhou");
      setMsg("fonte criada — mineração iniciada em segundo plano");
      setKw("");
      // dispara a primeira rodada sem travar a tela
      fetch(`/api/sources/${json.id}/run`, { method: "POST" }).catch(() => {});
      setTimeout(() => router.refresh(), 800);
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="section-label" style={{ marginTop: 0 }}>
        1 · Nicho
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {NICHES.map((n) => (
          <span key={n.id} className={"chip" + (niche === n.id ? " on" : "")} onClick={() => setNiche(n.id)}>
            {n.label}
            {n.risk === "gray" ? " ·gray" : ""}
          </span>
        ))}
      </div>

      <div className="section-label">2 · Origem</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {([
          ["meta", "Meta / Biblioteca de Anúncios"],
          ["reviews", "Reviews (TrustPilot / tuquejasuma) → domínios"],
          ["tiktok", "TikTok Creative Center → domínios"],
          ["youtube", "YouTube (descrições) → domínios"],
        ] as const).map(([id, label]) => (
          <span key={id} className={"chip" + (kind === id ? " on" : "")} onClick={() => setKind(id)}>
            {label}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
        as origens que não são Meta usam as palavras-chave pra descobrir domínios de oferta; o scraper da Biblioteca acha os anúncios desses domínios.
      </div>

      <div className="section-label">3 · Mercados</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {MARKETS.map((m) => (
          <span key={m.code} className={"chip" + (markets.includes(m.code) ? " on" : "")} onClick={() => toggleMarket(m.code)}>
            {m.label}
            {m.eu ? " ·UE" : ""}
          </span>
        ))}
      </div>

      <div className="section-label" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>4 · Palavras-chave</span>
        <span className="btn ghost" style={{ padding: "2px 8px", fontSize: 12 }} onClick={loadSeeds}>
          + carregar sugestões do nicho
        </span>
      </div>
      <textarea
        className="mono"
        rows={8}
        placeholder={"uma por linha\nweight loss without exercise\ncomo perder barriga em 21 dias\nabnehmen ohne sport"}
        value={kw}
        onChange={(e) => setKw(e.target.value)}
      />
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--muted)" }}>
        <span>{parsed.length} palavras-chave</span>
        <span>UE entra pela API oficial · resto pelo scraper</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
        <button className="btn primary" disabled={busy} onClick={start}>
          {busy ? "iniciando…" : "▶ Iniciar mineração"}
        </button>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>roda agora e depois pelo worker/agendador</span>
      </div>
      {msg && (
        <p style={{ fontSize: 12, marginTop: 10, color: msg.includes("criada") ? "var(--success)" : "var(--danger)" }}>{msg}</p>
      )}
    </div>
  );
}

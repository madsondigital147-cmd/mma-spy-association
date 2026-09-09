"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const sp = useSearchParams();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ user, pass }),
    });
    if (res.ok) {
      window.location.href = sp.get("next") || "/";
      return;
    }
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    setErr(j.error || "falhou");
  }

  return (
    <div style={{ maxWidth: 320, margin: "12vh auto 0", padding: "0 20px" }}>
      <div className="brand" style={{ fontSize: 18 }}>
        MMA SPY ASSOCIATION
      </div>
      <p className="sub" style={{ marginTop: 6 }}>
        acesso restrito
      </p>
      <form onSubmit={submit} className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input type="text" placeholder="usuário" value={user} onChange={(e) => setUser(e.target.value)} autoFocus />
        <input type="password" placeholder="senha" value={pass} onChange={(e) => setPass(e.target.value)} />
        <button className="btn primary" disabled={busy} type="submit">
          {busy ? "entrando…" : "Entrar"}
        </button>
        {err && <p style={{ color: "var(--danger)", fontSize: 12, margin: 0 }}>{err}</p>}
      </form>
    </div>
  );
}

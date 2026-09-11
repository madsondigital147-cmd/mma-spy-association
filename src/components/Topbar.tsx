"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Busca global real: manda pra /ofertas?q=... que já filtra por título/anunciante
// no banco (Prisma). Nada de resultado inventado.
export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");

  if (pathname === "/login") return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const term = q.trim();
    if (!term) return;
    router.push(`/ofertas?q=${encodeURIComponent(term)}`);
  }

  return (
    <div className="topbar">
      <form className="topbar-search" onSubmit={submit}>
        <span className="ico">⌕</span>
        <input
          type="text"
          placeholder="Buscar oferta, domínio, anunciante…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <kbd>Enter</kbd>
      </form>
      <button
        type="button"
        className="topbar-account"
        title="Sair"
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          window.location.href = "/login";
        }}
      >
        ⎋
      </button>
    </div>
  );
}

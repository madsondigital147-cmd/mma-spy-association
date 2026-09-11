"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV: { href: string; label: string; ico: string; tag?: string }[] = [
  { href: "/", label: "Fila de review", ico: "▦" },
  { href: "/favoritos", label: "Favoritos", ico: "★" },
  { href: "/ofertas", label: "Ofertas", ico: "◎" },
  { href: "/criativos", label: "Criativos", ico: "▤" },
  { href: "/paginas", label: "Páginas", ico: "⚑" },
  { href: "/fontes", label: "Fontes", ico: "⌗" },
];

export function Sidebar({ showLogout }: { showLogout: boolean }) {
  const path = usePathname();
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  return (
    <aside className="sidebar">
      <div className="sb-brand">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/icon.png" alt="" width={20} height={20} className="brand-mark" /> MMA SPY
        </div>
        <div className="sb-tagline">FIND. ANALYZE. SCALE.</div>
      </div>
      <div className="sb-section">Geral</div>
      {NAV.map((n) => (
        <Link key={n.href} href={n.href} className={"sb-link" + (isActive(n.href) ? " active" : "")}>
          <span className="ico">{n.ico}</span>
          {n.label}
          {n.tag && <span className="sb-tag">{n.tag}</span>}
        </Link>
      ))}
      {showLogout && (
        <>
          <div className="sb-section">Conta</div>
          <a
            href="#"
            className="sb-link"
            onClick={async (e) => {
              e.preventDefault();
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            <span className="ico">⎋</span> Sair
          </a>
        </>
      )}
    </aside>
  );
}

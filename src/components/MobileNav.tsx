"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Barra inferior — só aparece <860px (sidebar some nessa largura). Rotas
// reais, nada inventado: as mesmas 5 que cabem melhor no polegar.
const TABS: { href: string; label: string; ico: string }[] = [
  { href: "/", label: "Fila", ico: "▦" },
  { href: "/favoritos", label: "Favoritos", ico: "★" },
  { href: "/ofertas", label: "Ofertas", ico: "◎" },
  { href: "/criativos", label: "Criativos", ico: "▤" },
  { href: "/fontes", label: "Fontes", ico: "⌗" },
];

export function MobileNav() {
  const path = usePathname();
  if (path === "/login") return null;
  const isActive = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  return (
    <nav className="mobilenav">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={"mn-tab" + (isActive(t.href) ? " active" : "")}>
          <span className="mn-ico">{t.ico}</span>
          <span className="mn-label">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

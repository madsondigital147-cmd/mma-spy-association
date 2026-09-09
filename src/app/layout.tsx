import type { Metadata } from "next";
import Link from "next/link";
import { authDisabled } from "@/lib/auth";
import { LogoutLink } from "@/components/LogoutLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMA SPY ASSOCIATION",
  description: "Mineração de ofertas na Ad Library — EN / EU / BR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="topbar">
          <span className="brand">MMA SPY ASSOCIATION</span>
          <nav className="nav">
            <Link href="/">Fila</Link>
            <Link href="/fontes">Fontes</Link>
          </nav>
          {!authDisabled() && <LogoutLink />}
        </div>
        <div className="wrap">{children}</div>
      </body>
    </html>
  );
}

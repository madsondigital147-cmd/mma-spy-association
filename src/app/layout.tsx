import type { Metadata } from "next";
import { authDisabled } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "MMA SPY ASSOCIATION",
  description: "Mineração de ofertas na Ad Library — EN / EU / BR",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="shell">
          <Sidebar showLogout={!authDisabled()} />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}

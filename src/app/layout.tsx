import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { authDisabled } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { Topbar } from "@/components/Topbar";
import { MobileNav } from "@/components/MobileNav";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "MMA SPY — Find. Analyze. Scale.",
  description: "Inteligência competitiva de ofertas em performance marketing — EN / EU / BR",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "MMA SPY" },
  icons: { apple: "/brand/apple-touch-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#080c12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <div className="shell">
          <Sidebar showLogout={!authDisabled()} />
          <div className="shell-main">
            <Topbar />
            <main className="main">{children}</main>
          </div>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}

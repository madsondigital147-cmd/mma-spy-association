"use client";

import { useRouter } from "next/navigation";

export function LogoutLink() {
  const router = useRouter();
  return (
    <a
      href="#"
      onClick={async (e) => {
        e.preventDefault();
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      style={{ marginLeft: "auto", color: "var(--muted)", fontSize: 13 }}
    >
      sair
    </a>
  );
}

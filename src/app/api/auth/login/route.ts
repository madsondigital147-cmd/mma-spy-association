import { NextResponse } from "next/server";
import { SESSION_COOKIE, authDisabled, signToken, verifyLogin } from "@/lib/auth";

export async function POST(req: Request) {
  if (authDisabled()) return NextResponse.json({ ok: true, note: "auth desligado" });

  const body = await req.json().catch(() => null);
  const user = String(body?.user || "");
  const pass = String(body?.pass || "");
  if (!user || !pass) return NextResponse.json({ error: "faltou usuário ou senha" }, { status: 400 });

  const ok = await verifyLogin(user, pass);
  if (!ok) return NextResponse.json({ error: "usuário ou senha inválidos" }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await signToken(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

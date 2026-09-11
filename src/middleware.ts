import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, authDisabled, verifyToken } from "./lib/auth";

// /brand e /icon.png precisam ficar públicos — senão a própria tela de login
// (deslogado, sem cookie) não consegue carregar o logo nem o favicon.
const PUBLIC = ["/login", "/api/auth/", "/brand/", "/icon.png", "/apple-icon.png", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  if (authDisabled()) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const user = await verifyToken(token);
  if (user) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

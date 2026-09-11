// Login simples, compatível com edge (Web Crypto). Fica DESLIGADO se AUTH_USERS
// estiver vazio — nesse caso o app roda aberto (uso local). Ligue definindo
// AUTH_USERS e AUTH_SECRET no ambiente (Vercel) quando expor na web.
//
// AUTH_USERS = "matheus:<sha256 da senha>,socio:<sha256 da senha>"
// gere o hash com:  npm run hash-password -- "sua senha longa"

export const SESSION_COOKIE = "mma_sess";

export function authDisabled(): boolean {
  return !process.env.AUTH_USERS || !process.env.AUTH_SECRET;
}

// primeiro nome pra saudação — só cosmético, mapeado dos 2 e-mails cadastrados.
// sem mapa (usuário novo/email desconhecido): usa a parte antes do @.
const DISPLAY_NAMES: Record<string, string> = {
  "madsondigital147@gmail.com": "Madson",
  "ayricke23@gmail.com": "Ayricke",
};

export function displayName(user: string | null): string {
  if (!user) return "";
  return DISPLAY_NAMES[user.toLowerCase()] || user.split("@")[0];
}

/** Lê o cookie de sessão (server component/route) e devolve o e-mail logado, se houver. */
export async function getCurrentUser(): Promise<string | null> {
  if (authDisabled()) return null;
  const { cookies } = await import("next/headers");
  const jar = await cookies();
  return verifyToken(jar.get(SESSION_COOKIE)?.value);
}

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseUsers(): Map<string, string> {
  const map = new Map<string, string>();
  for (const pair of (process.env.AUTH_USERS || "").split(",")) {
    const [u, h] = pair.split(":").map((s) => s.trim());
    if (u && h) map.set(u.toLowerCase(), h.toLowerCase());
  }
  return map;
}

export async function verifyLogin(user: string, pass: string): Promise<boolean> {
  const users = parseUsers();
  const want = users.get((user || "").toLowerCase());
  if (!want) return false;
  const got = await sha256Hex(pass);
  return timingSafeEqual(got, want);
}

async function hmac(msg: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.AUTH_SECRET || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signToken(user: string): Promise<string> {
  const u = user.toLowerCase();
  return `${u}.${await hmac(u)}`;
}

export async function verifyToken(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;
  const user = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(user);
  return timingSafeEqual(sig, expected) ? user : null;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

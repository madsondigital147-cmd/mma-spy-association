import { createHash, randomBytes } from "node:crypto";

// Uso:  npm run hash-password -- "sua senha longa aqui"
// Cola a linha AUTH_USERS gerada no .env / nas env vars da Vercel.

const pass = process.argv.slice(2).join(" ");
if (!pass) {
  console.error('uso: npm run hash-password -- "sua senha"');
  process.exit(1);
}

const hash = createHash("sha256").update(pass).digest("hex");
console.log("\nhash da senha (sha256):");
console.log(hash);
console.log('\nexemplo de AUTH_USERS (troque "matheus" pelo login que quiser):');
console.log(`AUTH_USERS="matheus:${hash}"`);
console.log("\ne um AUTH_SECRET novo (guarde, é o que assina a sessão):");
console.log(`AUTH_SECRET="${randomBytes(32).toString("hex")}"`);

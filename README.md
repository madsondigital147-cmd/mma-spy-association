# MMA SPY ASSOCIATION

Mineração de ofertas na Meta Ad Library — mercados **EN / EU / BR**.
Banco no **Neon** (Postgres, free), mineração roda **local** (custo ~R$ 0).
Sócio em outra cidade acessa o mesmo banco / o mesmo dashboard.

O braço é código (scraper + API oficial). Você (ou a camada de IA opcional)
só entra no fim, sobre o shortlist já reduzido.

---

## Como funciona

```
palavras-chave  ──►  fontes (scraper p/ BR+mundo · API oficial p/ UE)
                     ──►  baixa mídia, gera hash, agrupa por criativo
                     ──►  filtra: 2+ anúncios no criativo · 7+ dias no ar · não-lixo
                     ──►  segue a landing: gateway, tipo de funil, preço
                     ──►  score 0–100  ──►  fila de review no dashboard
                     ──►  snapshot diário  ──►  tendência (escalando/murchando)
```

## Setup (uma vez)

1. **Pegue as strings do Neon** em `console.neon.tech` → projeto **mma-spy-association** → **Connect**:
   - `DATABASE_URL` = *Pooled connection* (tem `-pooler` no host)
   - `DATABASE_URL_UNPOOLED` = *Direct connection* (sem `-pooler`)

2. ```bash
   cd D:\mma-spy-association
   copy .env.example .env      # cole as duas strings do Neon no .env
   npm install
   npx playwright install chromium
   npm run db:migrate:mark     # marca a migration 0001 como aplicada (o schema já está no Neon)
   npm run dev                 # dashboard em http://localhost:3000
   ```

   > O schema já foi criado no Neon. `db:migrate:mark` só registra isso no histórico
   > do Prisma. Se algum dia quiser recriar do zero: `npx prisma migrate deploy`.

Node não fica no PATH do shell não-interativo do Windows:
`set PATH=C:\Program Files\nodejs;%PATH%`

## Uso

1. **/fontes** → nicho + mercados → **cole as palavras-chave** → “Iniciar mineração”.
2. Ou: `npm run mine` (todas as fontes) / `npm run mine <sourceId>`.
3. **/** (Fila de review) → Aprovar / Vou testar / Ignorar.

## Rodar sozinho (mineração)

- **Agendador de Tarefas do Windows** → aponte para `run-mine.bat` (ex. 08:00 e 20:00).
- **ou** deixe `npm run worker` rodando (cron interno; `--now` roda na hora).

A mineração escreve direto no Neon, então tanto faz de qual PC roda.

## Acesso do sócio (outra cidade)

**Agora (grátis, PC seu ligado):** instale o **Tailscale** nos dois PCs. O sócio
abre `http://SEU-IP-TAILSCALE:3000`. Túnel privado, ninguém de fora enxerga.

**Depois (24/7, ~R$ 0–20/mês):** deploy do dashboard na **Vercel** apontando pro
mesmo `DATABASE_URL` do Neon. Aí **ligue o login**:

```bash
npm run hash-password -- "uma senha longa de verdade"
# cole AUTH_USERS e AUTH_SECRET nas Environment Variables da Vercel
# (pode ter dois: AUTH_USERS="matheus:HASH1,socio:HASH2")
```

Sem `AUTH_USERS`/`AUTH_SECRET` o app roda **aberto** (bom pra local). Com eles,
todo acesso passa pela tela de login. A mineração continua rodando no seu PC —
a Vercel só serve o dashboard (lá o scraper não roda bem).

## Fontes de dados

| Mercado | Fonte | Precisa de |
|---|---|---|
| UE (DE, FR, IT, ES, PT, NL…) | **API oficial** da Ad Library — todos os anúncios comerciais, com faixa de alcance | `META_ADLIB_TOKEN` |
| EUA, UK, CA, AU, BR, resto | **Scraper** (Playwright) da Ad Library pública | `npx playwright install chromium` |

Sem `META_ADLIB_TOKEN`, os mercados da UE caem no scraper também.
Se a Meta bloquear o scraper, configure `MMASPY_PROXY` (proxy residencial).

## Camada de veredito (IA) — opcional

Desligada por padrão (`VERDICT_ENABLED=false`, custo zero). Ligando, lê só o
shortlist (score ≥ `VERDICT_MIN_SCORE`) e escreve 2 linhas + ângulo por oferta.
Aceita qualquer endpoint compatível com a API da OpenAI (`VERDICT_BASE_URL`).

## Alertas — opcional

Preencha `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` para receber o top 5 do dia.

## Limitações conhecidas (v1)

- **Hash de vídeo** é pela URL normalizada, não pelo conteúdo. Imagem usa dHash
  perceptual (agrupa de verdade).
- **Path da API oficial** não entrega arquivo de mídia — agrupa criativo pela copy.
- **Scraper** depende da estrutura do JSON interno da Meta; parser é defensivo
  (walk recursivo por `ad_archive_id`), mas pode precisar de ajuste se a Meta mudar.
- **"Escalando"** é inferido de nº de anúncios ao longo do tempo (snapshots), não
  de spend real — a Ad Library não expõe gasto de anúncio comercial fora da UE.
- Precisa de ≥ 2 rodadas em dias diferentes pra tendência sair de "novo".
- Mídia baixada (`/media`) fica no disco local; num deploy Vercel ela é efêmera.

## Roadmap

- Fase 2 — detector de "escalando" com alerta + watch de página direto
- Fase 3 — `OfferTest` puxando ROAS/lucro real (fecha o loop) + extensão de captura
- Fase 4 — score treinado nos seus próprios vereditos (win/loss)
- Fase 5 — executor de regras (kill/scale automático)

## Stack

Next.js 15 · Prisma 6 + **Neon Postgres** · Playwright · sharp · node-cron

# MMA SPY ASSOCIATION

Mineração de ofertas na Meta Ad Library — mercados **EN / EU / BR**.
Banco no **Neon** (Postgres, free), mineração roda **local**, dashboard na **Vercel**.
Referência de UX: American Swipe.

O braço é código (scraper + APIs). Você (ou a camada de IA opcional) só entra no
fim, sobre o shortlist já reduzido.

---

## Fluxo

```
palavras-chave → traduz por mercado → scraper (BR+mundo) + API oficial (UE)
  → baixa mídia · dHash imagem · frame+dHash vídeo (ffmpeg) → agrupa por criativo
  → filtra: 2+ anúncios · 7+ dias · não-lixo · relevante ao nicho
  → segue a landing: gateway, funil, GA/GTM/Pixel · reverse-IP · Google Ads Transparency
  → score → fila de review
  → snapshot diário (oferta + página) → tendência "escalando/murchando"
```

## Telas

| Rota | O que é |
|---|---|
| `/` | Fila de review — grid de cards, ordena por nº de anúncios no criativo, filtros |
| `/ofertas` | Todas as ofertas mineradas (qualquer status) |
| `/criativos` | Criativos por nº de anúncios — "o mesmo criativo duplicado N vezes" |
| `/oferta/[id]` | Detalhe: stat cards, gráfico de análises, links (landing + página na Biblioteca), criativos |
| `/paginas` | Anunciantes por anúncios ativos + ⭐ watchlist + delta entre rodadas |
| `/fontes` | Cadastro de palavras-chave por nicho + mercados |

## Setup (uma vez)

```bash
cd D:\mma-spy-association
copy .env.example .env      # cole as strings do Neon (Connect no console.neon.tech)
npm install
npx playwright install chromium
npm run db:migrate:mark
npm run dev                 # http://localhost:3000
```

Node fora do PATH no Windows: `set PATH=C:\Program Files\nodejs;%PATH%`

## Comandos

| Comando | Faz |
|---|---|
| `npm run mine` | roda todas as fontes ativas |
| `npm run mine <sourceId>` | roda uma fonte |
| `npx tsx src/scripts/mine.ts <id> --reconsolidate` | reprocessa o banco **sem raspar** (recovery/backfill) |
| `npm run verdict` | camada de IA (se `VERDICT_ENABLED=true`) + resumo Telegram |
| `npm run worker` | cron interno 08h/20h (alternativa ao Agendador) |
| `npm run dorks <nicho> [mercado]` | gera queries Google/Yandex pra garimpar landings |
| `npm run hash-password -- "senha"` | gera `AUTH_USERS` / `AUTH_SECRET` |

## Rodar sozinho

**Windows:** 2 tarefas no Agendador apontando pra `run-mine.bat` (08:00 e 20:00).
Já criadas nesta máquina: `MMASPY Mine AM` / `MMASPY Mine PM`.

## Fontes de dados

| Mercado | Fonte | Precisa de |
|---|---|---|
| UE | **API oficial** da Ad Library | `META_ADLIB_TOKEN` |
| EUA/UK/BR/resto | **Scraper** (Playwright) | `npx playwright install chromium` |
| Enriquecimento | landing (gateway/tracking) · reverse-IP (hackertarget) · Google Ads Transparency | — |
| Vídeo | frame via ffmpeg (bundle do Playwright) | — |

Sem `META_ADLIB_TOKEN`, a UE cai no scraper. `MMASPY_PROXY` se a Meta bloquear.

## Filtros / limites (`.env`)

- `MIN_ADS_PER_CREATIVE` / `MIN_DAYS_ACTIVE` — piso pra virar candidata
- `ENRICH_LIMIT` — quantas candidatas (top do ranking) ganham reverse-IP + GAT por rodada
- `TRANSCRIBE_ENABLED` + `TRANSCRIBE_*` — transcrição de vídeo (opcional, custo)
- `VERDICT_*` — camada de veredito por IA (opcional)
- `TELEGRAM_*` — alerta do top 5 (opcional)

## Deploy (Vercel)

`vercel deploy --prod --scope <scope>` — precisa de token da conta.
Env vars na Vercel: `DATABASE_URL` (Neon pooled), `AUTH_SECRET`, `AUTH_USERS`.
A mineração **não** roda na Vercel (scraper não cabe em serverless) — só o dashboard.

## Limitações conhecidas

- **"Escalando"** precisa de 2+ snapshots em dias diferentes.
- Frame de vídeo depende do ffmpeg do Playwright estar presente; senão cai no hash da URL.
- `reverseIp` (hackertarget) é ~50/dia grátis — por isso o `ENRICH_LIMIT`.
- Mídia baixada (`/media`) é local; num deploy Vercel seria efêmera.

## Roadmap

- `OfferTest` puxando ROAS/lucro real → fecha o loop
- score treinado nos vereditos win/loss
- executor de regras (kill/scale automático)
- extensão de captura manual

## Stack

Next.js 15 · Prisma 6 + Neon Postgres · Playwright · sharp · ffmpeg · node-cron

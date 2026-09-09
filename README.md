# MMA SPY ASSOCIATION

Mineração de ofertas na Meta Ad Library — mercados **EN / EU / BR**.
Projeto standalone, roda na sua máquina, SQLite local, custo ~R$ 0/dia.

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

```bash
cd D:\mma-spy-association
copy .env.example .env
npm install
npx playwright install chromium
npm run db:push
npm run db:seed      # cria 1 fonte de exemplo (opcional)
npm run dev          # dashboard em http://localhost:3000
```

Node não fica no PATH do shell não-interativo do Windows:
`set PATH=C:\Program Files\nodejs;%PATH%`

## Uso

1. Abra **/fontes**, escolha nicho + mercados, **cole as palavras-chave**, “Iniciar mineração”.
2. Ou pela linha de comando: `npm run mine` (todas as fontes) / `npm run mine <sourceId>`.
3. Veja o resultado em **/** (Fila de review). Aprovar / Vou testar / Ignorar.

## Rodar sozinho

- **Agendador de Tarefas do Windows** → aponte para `run-mine.bat` (ex. 08:00 e 20:00).
- **ou** deixe `npm run worker` rodando (cron interno, 08h e 20h; `--now` roda na hora).

## Fontes de dados

| Mercado | Fonte | Precisa de |
|---|---|---|
| UE (DE, FR, IT, ES, PT, NL…) | **API oficial** da Ad Library — todos os anúncios comerciais, com faixa de alcance | `META_ADLIB_TOKEN` no `.env` |
| EUA, UK, CA, AU, BR, resto | **Scraper** (Playwright) da Ad Library pública | `npx playwright install chromium` |

Sem `META_ADLIB_TOKEN`, os mercados da UE caem no scraper também.
Se a Meta bloquear o scraper, configure `MMASPY_PROXY` (proxy residencial).

## Camada de veredito (IA) — opcional

Desligada por padrão (`VERDICT_ENABLED=false`, custo zero). Ligando, ela lê só o
shortlist (score ≥ `VERDICT_MIN_SCORE`) e escreve 2 linhas + ângulo por oferta.
Aceita qualquer endpoint compatível com a API da OpenAI (`VERDICT_BASE_URL`).

## Alertas — opcional

Preencha `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` para receber o top 5 do dia.

## Limitações conhecidas (v1)

- **Hash de vídeo** é pela URL normalizada, não pelo conteúdo. Dois uploads do
  mesmo vídeo podem não agrupar. Imagem usa dHash perceptual (agrupa de verdade).
- **Path da API oficial** não entrega arquivo de mídia — agrupa criativo pela copy.
- **Scraper** depende da estrutura do JSON interno da Meta; se ela mudar, o parser
  para de achar anúncios. O parser é defensivo (walk recursivo por `ad_archive_id`),
  mas pode precisar de ajuste.
- **"Escalando"** é inferido de nº de anúncios ao longo do tempo (snapshots), não
  de spend real — a Ad Library não expõe gasto de anúncio comercial fora da UE.
- Precisa de ≥ 2 rodadas em dias diferentes pra tendência sair de "novo".

## Roadmap

- Fase 2 — detector de "escalando" com alerta + watch de página direto
- Fase 3 — `OfferTest` puxando ROAS/lucro real (fecha o loop) + extensão de captura
- Fase 4 — score treinado nos seus próprios vereditos (win/loss)
- Fase 5 — executor de regras (kill/scale automático)

## Stack

Next.js 15 (App Router) · Prisma 6 + SQLite · Playwright · sharp · node-cron

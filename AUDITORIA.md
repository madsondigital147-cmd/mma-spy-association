# MMA SPY ASSOCIATION — auditoria do que você pediu

Conferência item por item de tudo que foi pedido nas conversas. Status:
**FEITO** · **PARCIAL** (funciona, falta profundidade) · **PENDENTE**.

URL: https://mma-spy-association.vercel.app · login `madsondigital147@gmail.com` / `ayricke23@gmail.com` · senha `123456`

---

## 1. Mineração (núcleo)

| # | Pedido | Status | Onde |
|---|--------|--------|------|
| 1 | Minerar a Biblioteca de Anúncios por palavras-chave | **FEITO** | scraper (Playwright, intercepta GraphQL) + API oficial pros mercados da UE |
| 2 | Filtrar criativo com **+2 anúncios** (já tem gente botando dinheiro) | **FEITO** | `MIN_ADS`, agrupamento por criativo, aba **Criativos** com filtro 2/3/5/10/20+ |
| 3 | Tempo ativo de anúncio | **FEITO** | `daysActive` no card e no detalhe |
| 4 | Se está escalando | **FEITO** | `trend` (scaling/steady/fading), série de `OfferSnapshot`, gráfico no detalhe. *Obs: "scaling" só aparece depois de 2+ dias de rodada — precisa de histórico.* |
| 5 | Começar pelas de **mais anúncios e mais oportunidade** | **FEITO** | ordenação padrão por `topCreativeAds` + `pageCount`; `score` 0-100 |
| 6 | Entregar oferta que **escala E duplica o mesmo criativo** | **FEITO** | filtro "escalando/duplicando", `topCreativeAds` = maior nº de anúncios num único criativo |
| 7 | Rodar **no automático** todo dia | **FEITO** | `run-mine.bat` + Task Scheduler (08:00 e 20:00). Roda local (custo zero). |
| 8 | Mercados: inglês, Europa, Brasil (+ espanhol) | **FEITO** | US, GB, CA, AU, DE, FR, IT, ES, PT, NL, PL, SE, BR, MX |
| 9 | **Traduzir a palavra-chave na hora da pesquisa**, por mercado | **FEITO** | `translate.ts` — dicionário + MyMemory; o pipeline traduz por idioma antes de buscar |
| 10 | Campo pra colar palavras-chave e o sistema começar | **FEITO** | `/fontes` → cola, escolhe nicho/mercados, "Iniciar mineração" |

## 2. Estudo das VSLs e dos vídeos de espionagem

| # | Pedido | Status | Resultado |
|---|--------|--------|-----------|
| 11 | Ler as 2 VSLs (PT + italiana) — mecanismo, palavras, "malícia" | **FEITO** | virou a lista de palavras-chave e os padrões de nicho da fonte **prosperidade** |
| 12 | Ouvir/estudar os 3 vídeos do YouTube (Artur Oliveira, Vittor Cupo, Gabriel Fogaça) | **FEITO** | a "malícia" (duplicação de criativo = dinheiro, dias no ar, mesmo domínio em vários anunciantes, cloaker = oferta protegida, arbitragem, gateway montado) está codificada no `score`, nas heurísticas de cloaker e na regra de "recomendada pra modelar" |
| 13 | Prosperidade primeiro, depois outros nichos | **FEITO** | fonte prosperidade com **182 ofertas**; 20 nichos pré-cadastrados |
| 14 | Lista das 30 keywords em **inglês, francês e alemão** | **FEITO** | fonte prosperidade nos mercados US, GB, FR, DE. As iscas genéricas (`news.com`, `twr`) foram isoladas numa fonte separada `rede-ampla` porque poluíam o nicho com suplemento. |

## 3. Dashboard estilo American Swipe

| # | Pedido | Status |
|---|--------|--------|
| 15 | Sidebar de navegação | **FEITO** — Fila de review, Favoritos, Ofertas, Criativos, Páginas, Fontes |
| 16 | Grid de cards com o **número grande de anúncios** | **FEITO** — `OfferGridCard` |
| 17 | Hook na thumbnail + bandeiras de país | **FEITO** |
| 18 | Página da oferta com stat cards + gráfico + lista de criativos | **FEITO** — `/oferta/[id]` |
| 19 | Aba **Criativos** | **FEITO** — `/criativos` |
| 20 | Aba **Páginas** | **FEITO** — `/paginas` (com estrela de watchlist e delta de anúncios da página) |

## 4. Fingerprint, tech stack e cloaker

| # | Pedido | Status | Detalhe |
|---|--------|--------|---------|
| 21 | Identificar no código: **VTurb, Cartpanda, Stripe, Hotmart, Atomicat** — "um geral" | **FEITO** | `detectTech()` — mapas de assinatura: players (VTurb/converteai, Panda, Vimeo, JW, Wistia), gateways (Cartpanda, Hotmart, Kiwify, Monetizze, Braip, PerfectPay, Stripe, ClickBank, Digistore24, BuyGoods, AppMax, Yampi, Pagar.me, Mercado Pago, PagSeguro), builders (Atomicat, ClickFunnels, Systeme, WordPress, Elementor, Webflow, Unbounce, LeadPages, Inlead, Cacto), tracking (GA4, GTM, Pixel, TikTok, Hotjar, Clarity, Utmify, RedTrack, Voluum). Painel "Tech stack" no detalhe da oferta. **118/182 ofertas já com stack detectada** (backfill rodando). |
| 22 | **Fingerprint de vídeo** (frame + hash) | **FEITO** | `videoFrameHash` — ffmpeg extrai 1 frame, dHash; mesmo vídeo re-upado agrupa no mesmo criativo |
| 23 | Watchlist de página | **FEITO** | `PageWatch` + `PageSnapshot` (foto diária de anúncios ativos da página) |
| 24 | Gateway/tracking pra todos os candidatos | **FEITO** | `extractTrackingIds` + `detectTech` em todo candidato com landing acessível |
| 25 | Flag **"(possível cloaker)"** e pôr em destaque | **FEITO** | `cloakerSuspect` (slug de cloaker na URL, link exibido ≠ destino, página branca curta sem oferta, "coming soon"), badge no card, filtro "possível cloaker", +6 no score. **19 ofertas marcadas.** |

## 5. Reclame Aqui gringo

| # | Pedido | Status | Detalhe |
|---|--------|--------|---------|
| 26 | Usar **tuquejasuma.com** (reembolso/reclamação) | **PARCIAL** | `tuquejasumaDomains()` busca no site e extrai os domínios de oferta citados → viram palavras-chave/fonte. **Falta**: puxar o conteúdo da reclamação (texto, volume de queixa) e mostrar na página da oferta. |
| — | (TrustPilot como reforço) | **FEITO** | `trustpilotDomains()` por país |

## 6. Favoritos e monitoramento

| # | Pedido | Status |
|---|--------|--------|
| 27 | Aba de favoritos | **FEITO** — `/favoritos` |
| 28 | Favoritar → manda pra aba de monitoramento; acompanhar a oferta **e o anunciante e tudo que a pessoa faz** | **FEITO** — ao favoritar, a página do anunciante entra na watchlist automaticamente; `/favoritos` mostra nº de anúncios no criativo, ativos na página, **delta desde a rodada anterior**, dias no ar, gráfico |

## 7. Links por oferta

| # | Pedido | Status |
|---|--------|--------|
| 29 | Trazer link de **tudo**: página de venda, página de VSL, página do Facebook Ads, biblioteca de anúncio, Google Ads Transparency (se roda Google) | **FEITO** — `offerLinks()`: landing (venda/VSL), anúncio na Biblioteca, página FB Ads (`view_all_page_id`), Biblioteca por domínio, Google Ads Transparency por domínio. Painel "Links" no detalhe. |

## 8. Fonte / origem e cross-platform

| # | Pedido | Status | Detalhe |
|---|--------|--------|---------|
| 30 | **Toda oferta com a tag da fonte de onde veio** | **FEITO** | `discoveredVia` (meta-scraper / meta-api / tiktok / youtube / reviews) no card e no detalhe |
| 31 | Cruzar: a mesma oferta pode estar em **plataformas diferentes** | **FEITO (por domínio)** | seção "Mesma oferta (mesmo domínio) em outras fontes/nichos" no detalhe, via `landingDomain` |
| 32 | **TikTok Ads** | **PARCIAL** | `tiktokDomains()` descobre domínios de oferta no TikTok Creative Center → o scraper acha os anúncios. **Falta**: ingerir os criativos/biblioteca do próprio TikTok. |
| 33 | Mineração no **YouTube** com as mesmas palavras-chave | **PARCIAL** | `youtubeDomains()` busca no YouTube e extrai domínios das descrições. **Falta**: rodar automático a lista inteira de keywords de uma fonte (hoje é via script `garimpo` com termo manual). |

## 9. Criativos no sistema (vídeo / foto)

| # | Pedido | Status |
|---|--------|--------|
| 34 | "Se conseguir botar os vídeos… se não, só a **foto pra saber do que se trata**" + "se não conseguir o vídeo, traga **print da frente do criativo**" | **FEITO** (foto/print) — implementado agora nesta rodada: |

- o scraper agora pega `video_preview_image_url` → **poster do vídeo**, não só de imagem;
- **cache durável**: `MediaCache` no Postgres + rota `/i/<hash>`. O sistema baixa o print **uma vez**, redimensiona e guarda os bytes. Os links da CDN do Facebook expiram — o print no sistema **não expira mais**;
- fallback: se não tem poster, extrai um frame do vídeo com ffmpeg;
- o print aparece nos **cards**, na aba **Criativos** e na **lista de criativos da oferta**.
- Vídeo em si (arquivo) não é guardado — decisão de custo; o print resolve "saber do que se trata".

## 10. Curadoria "as melhores na sua opinião pra modelar"

| # | Pedido | Status |
|---|--------|--------|
| 35 | IA marca as melhores pra **modelar e rodar em outros países** | **FEITO** — campo `recommended` + aba **Favoritos → recomendadas**. Regra: score ≥ 62, funil identificável (gateway/player/tech/VSL), ≥ 21 dias no ar, duplicando criativo ou rodando ≥ 45 dias, **fora do BR**. Cada uma vem com o motivo e a sugestão de mercado (ES/LATAM ou BR). **41 ofertas recomendadas agora.** |

## 11. Infra

| # | Pedido | Status |
|---|--------|--------|
| 36 | Repo próprio + banco próprio (pra passar pro outro PC / sócio em outra cidade) | **FEITO** — projeto separado, Neon Postgres |
| 37 | Deploy, me dá a URL | **FEITO** — https://mma-spy-association.vercel.app |
| 38 | Login dos 2, senha 123456 | **FEITO** — hash no ambiente, nunca em código |
| 39 | Custo baixo, mineração local | **FEITO** — Vercel free + Neon free; mineração roda no seu PC |

---

## O que ainda falta (honesto)

1. **tuquejasuma / reclame aqui**: hoje só extrai domínios. Falta ler e mostrar o texto/volume de reclamação na oferta.
2. **TikTok Ads de verdade**: hoje descobre domínio via Creative Center. Falta ingerir a biblioteca/criativos do TikTok.
3. **YouTube automático**: falta rodar a lista de keywords de uma fonte sozinho (hoje é script manual).
4. **Fonte ES dedicada**: os mercados ES/MX funcionam e a tradução cobre espanhol; falta criar uma fonte de prosperidade só de espanhol.
5. **Fechar o loop com ROAS real** (`OfferTest`) pra treinar o score com ganho/perda.
6. **Arquivo de vídeo** no sistema (só o print é guardado hoje).

## Feito nesta rodada

- Print da frente do criativo pra **vídeo** (não só imagem) + cache durável no banco (`/i/<hash>`) que não expira.
- Regra de "recomendadas" recalibrada — antes dava 0, agora 41.
- Seletor de **Origem** (meta / reviews / tiktok / youtube) no formulário de fonte.
- Backfill rodando pra preencher tech stack, print e recomendadas nas 182 ofertas que já existem.

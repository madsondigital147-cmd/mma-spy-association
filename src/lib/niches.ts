// Nichos que escalam pesado no Meta (EN / EU / BR). Dados puros — importável no client.
// `risk`: white = ok no Meta · gray = escala muito mas queima BM.
// `bias`: ajuste fino no score (nichos que costumam ter mais ruído levam bias negativo).

export type NicheRisk = "white" | "gray";

export interface Niche {
  id: string;
  label: string;
  group: "saude" | "dinheiro" | "relacionamento" | "outros";
  risk: NicheRisk;
  bias: number;
  seeds: Partial<Record<"en" | "pt" | "es" | "de" | "fr" | "it", string[]>>;
}

export const NICHES: Niche[] = [
  {
    id: "emagrecimento",
    label: "Emagrecimento",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["weight loss without exercise", "belly fat over 40", "lose weight fast", "flatten your belly", "stubborn belly fat"],
      pt: ["como perder barriga", "chá que seca a barriga", "receita caseira para emagrecer", "secar a barriga em 21 dias", "emagrecer rápido"],
      es: ["bajar de peso rápido", "quemar grasa abdominal", "adelgazar sin dieta"],
      de: ["abnehmen ohne sport", "bauchfett verlieren", "schnell abnehmen"],
      fr: ["perdre du ventre", "maigrir vite sans sport"],
      it: ["dimagrire velocemente", "pancia piatta"],
    },
  },
  {
    id: "ozempic-natural",
    label: "Ozempic natural / GLP-1 caseiro",
    group: "saude",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["natural ozempic alternative", "nature's ozempic", "glp-1 drops", "poor man's ozempic"],
      pt: ["ozempic natural", "receita ozempic caseiro", "monjaro natural"],
      es: ["ozempic natural", "alternativa natural a ozempic"],
    },
  },
  {
    id: "suplemento-geral",
    label: "Suplemento geral",
    group: "saude",
    risk: "white",
    bias: -3,
    seeds: {
      en: ["collagen supplement", "magnesium glycinate", "ashwagandha benefits", "sea moss gel", "greens powder"],
      pt: ["colágeno hidrolisado", "magnésio dimalato", "ashwagandha para que serve", "cloreto de magnésio"],
      es: ["colágeno hidrolizado", "magnesio para dormir"],
      de: ["kollagen pulver", "magnesium kapseln"],
    },
  },
  {
    id: "glicose",
    label: "Glicose / diabetes",
    group: "saude",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["blood sugar support", "lower blood sugar naturally", "healthy glucose levels", "reverse type 2 diabetes"],
      pt: ["controlar a glicose", "baixar açúcar no sangue", "diabetes tipo 2 reverter", "pré-diabetes"],
      es: ["bajar el azúcar en sangre", "controlar la diabetes"],
      de: ["blutzucker natürlich senken"],
    },
  },
  {
    id: "prostata",
    label: "Próstata / saúde masculina",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["prostate health supplement", "shrink enlarged prostate", "frequent urination at night"],
      pt: ["saúde da próstata", "próstata aumentada tratamento", "vontade de urinar à noite"],
      de: ["prostata verkleinern", "häufiges wasserlassen nachts"],
    },
  },
  {
    id: "performance-masculina",
    label: "Performance sexual masculina",
    group: "saude",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["last longer in bed", "harder erections naturally", "boost male performance"],
      pt: ["durar mais na cama", "ereção mais forte", "melhorar o desempenho sexual"],
      es: ["durar más en la cama", "mejorar la ereccion"],
    },
  },
  {
    id: "menopausa",
    label: "Menopausa / hormônio feminino",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["menopause belly fat", "hot flashes relief", "hormone balance for women"],
      pt: ["menopausa e barriga", "ondas de calor menopausa", "equilíbrio hormonal feminino"],
      de: ["wechseljahre bauchfett", "hitzewallungen lindern"],
    },
  },
  {
    id: "dor-articular",
    label: "Dor articular / joelho / coluna",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["knee pain relief", "joint pain drops", "sciatica relief at home", "nerve pain in feet"],
      pt: ["dor no joelho o que fazer", "dor nas articulações", "dor no nervo ciático", "neuropatia nos pés"],
      de: ["knieschmerzen lindern", "gelenkschmerzen hausmittel"],
      fr: ["douleur au genou", "douleur articulaire"],
    },
  },
  {
    id: "queda-cabelo",
    label: "Queda de cabelo",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["regrow thinning hair", "stop hair loss", "hair growth serum"],
      pt: ["parar a queda de cabelo", "fazer o cabelo crescer", "calvície tratamento caseiro"],
      es: ["detener la caída del cabello", "hacer crecer el cabello"],
    },
  },
  {
    id: "saude-bucal",
    label: "Saúde bucal / gengiva",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["receding gums remedy", "rebuild tooth enamel", "get rid of bad breath"],
      pt: ["retração da gengiva", "mau hálito acabar", "gengivite tratamento caseiro"],
    },
  },
  {
    id: "visao",
    label: "Visão / saúde ocular",
    group: "saude",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["improve eyesight naturally", "restore your vision", "macular degeneration support"],
      pt: ["melhorar a visão naturalmente", "vista cansada", "degeneração macular"],
    },
  },
  {
    id: "sono-ansiedade",
    label: "Sono / ansiedade / calm",
    group: "saude",
    risk: "white",
    bias: -2,
    seeds: {
      en: ["fall asleep fast", "deep sleep supplement", "calm anxiety naturally", "stop overthinking at night"],
      pt: ["dormir rápido", "insônia o que fazer", "acalmar a ansiedade", "pensamento acelerado à noite"],
      de: ["schnell einschlafen", "angst natürlich lindern"],
    },
  },
  {
    id: "skincare",
    label: "Skincare / anti-idade",
    group: "saude",
    risk: "white",
    bias: -3,
    seeds: {
      en: ["remove dark spots", "anti aging serum", "tighten sagging skin", "collagen for face"],
      pt: ["manchas no rosto", "sérum anti-idade", "flacidez no rosto", "colágeno para o rosto"],
      es: ["manchas en la cara", "serum antiedad"],
    },
  },
  {
    id: "detox-intestino",
    label: "Detox / fígado / intestino",
    group: "saude",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["debloat fast", "liver detox drink", "gut health reset", "parasite cleanse"],
      pt: ["desinchar a barriga", "detox do fígado", "limpar o intestino", "eliminar parasitas"],
    },
  },
  {
    id: "tinnitus",
    label: "Zumbido no ouvido (tinnitus)",
    group: "saude",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["stop ringing in ears", "tinnitus relief", "what causes tinnitus"],
      pt: ["zumbido no ouvido tratamento", "parar o zumbido no ouvido"],
      de: ["tinnitus stoppen", "ohrgeräusche loswerden"],
    },
  },
  {
    id: "renda-extra",
    label: "Renda extra / afiliado / IA",
    group: "dinheiro",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["make money online 2026", "faceless youtube automation", "ai side hustle", "digital marketing from home"],
      pt: ["ganhar dinheiro na internet", "renda extra em casa", "marketing digital do zero", "dropshipping para iniciantes"],
      es: ["ganar dinero por internet", "ingreso extra desde casa"],
    },
  },
  {
    id: "trading-cripto",
    label: "Trading / cripto / opções",
    group: "dinheiro",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["crypto trading bot", "options income strategy", "learn day trading"],
      pt: ["robô de opções binárias", "day trade do zero", "viver de trade", "sinais de cripto"],
      es: ["bot de trading", "aprender trading"],
    },
  },
  {
    id: "financas-dividas",
    label: "Finanças / dívidas / crédito",
    group: "dinheiro",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["get out of debt fast", "fix your credit score", "credit repair secret"],
      pt: ["sair das dívidas", "limpar o nome", "aumentar o score do serasa", "renegociar dívida"],
    },
  },
  {
    id: "apostas",
    label: "Apostas / trader esportivo",
    group: "dinheiro",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["matched betting system", "sports betting method", "football prediction tips"],
      pt: ["método de apostas esportivas", "trader esportivo do zero", "green todo dia", "planilha de apostas"],
    },
  },
  {
    // cluster "Divine Script / Genie Script / Wealth Manifestation" — oração/roteiro
    // de 12 palavras, frequência de Deus, versículo censurado, mente milionária.
    // Muito gray no Meta (claims espirituais + de dinheiro).
    id: "prosperidade",
    label: "Prosperidade / manifestação de dinheiro",
    group: "dinheiro",
    risk: "gray",
    bias: 0,
    seeds: {
      en: [
        "divine script",
        "12 word script",
        "divine prayer",
        "wealth prayer",
        "god's frequency",
        "manifest wealth fast",
        "law of attraction not working",
        "secret bible verse for money",
        "censored bible page",
        "genie script",
        "wealth manifestation",
        "abundance prayer",
        "millionaire mind reprogram",
        "tune your heart to god",
        "1 minute wealth prayer",
        "ancient money prayer",
      ],
      pt: [
        "oração forte para prosperidade",
        "oração para dinheiro urgente",
        "roteiro divino",
        "manifestar dinheiro",
        "lei da atração não funciona",
        "versículo secreto da bíblia para dinheiro",
        "frequência de Deus",
        "oração da abundância",
        "mente milionária",
        "salmo para prosperidade",
        "oração de 1 minuto para dinheiro",
      ],
      es: [
        "oración para la prosperidad",
        "oración para el dinero urgente",
        "guion divino",
        "manifestar dinero rápido",
        "ley de atracción no funciona",
        "versículo secreto de la biblia para el dinero",
        "frecuencia de Dios",
        "oración de la abundancia",
        "mentalidad millonaria",
      ],
      it: [
        "copione divino",
        "script divino",
        "preghiera per la prosperità",
        "manifestare denaro",
        "legge di attrazione non funziona",
        "versetto segreto della Bibbia",
        "frequenza di Dio",
        "preghiera per l'abbondanza",
        "mentalità da milionario",
        "preghiera potente per soldi",
      ],
    },
  },
  {
    id: "reconquista",
    label: "Reconquista / relacionamento",
    group: "relacionamento",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["get your ex back", "make him miss you", "text your ex back"],
      pt: ["reconquistar o ex", "fazer ele sentir sua falta", "voltar com o ex", "meu ex não me procura"],
      es: ["recuperar a tu ex", "hacer que te extrañe"],
    },
  },
  {
    // rede ampla: iscas de link de exibição (news.com, twr, api. …) — pega tudo
    // que usa aquele padrão, sem filtro de nicho. Garimpo à parte.
    id: "rede-ampla",
    label: "Rede ampla (iscas de link)",
    group: "outros",
    risk: "gray",
    bias: -4,
    seeds: {},
  },
  // ---- bônus ----
  {
    id: "espiritualidade",
    label: "Manifestação / espiritualidade / oração",
    group: "outros",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["manifest money", "wealth affirmations", "guardian angel prayer"],
      pt: ["oração forte para dinheiro", "manifestar dinheiro", "simpatia para prosperidade"],
    },
  },
  {
    id: "idiomas",
    label: "Idiomas (inglês rápido)",
    group: "outros",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["learn english fast", "speak english fluently"],
      pt: ["aprender inglês sozinho", "inglês em 3 meses", "destravar o inglês"],
    },
  },
  {
    id: "pets",
    label: "Pets (adestramento / petisco)",
    group: "outros",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["stop dog barking", "train your dog at home", "dog dental chews"],
      pt: ["adestrar cachorro em casa", "parar cachorro de latir", "petisco dental para cães"],
    },
  },
  {
    id: "cozinha-lowcarb",
    label: "Air fryer / receitas / low carb",
    group: "outros",
    risk: "white",
    bias: -3,
    seeds: {
      en: ["air fryer recipes cookbook", "keto recipes for beginners"],
      pt: ["receitas para air fryer", "cardápio low carb", "receitas fit"],
    },
  },
  {
    id: "survival",
    label: "Survival / prepper / patriota",
    group: "outros",
    risk: "gray",
    bias: 0,
    seeds: {
      en: ["off grid power", "survival food kit", "ez battery reconditioning", "patriot solar generator"],
    },
  },
  {
    id: "golf",
    label: "Golf swing",
    group: "outros",
    risk: "white",
    bias: 0,
    seeds: {
      en: ["fix your slice", "add 30 yards to your drive", "simple golf swing"],
    },
  },
];

export const NICHE_BY_ID = new Map(NICHES.map((n) => [n.id, n]));

export const MARKETS: { code: string; label: string; eu: boolean }[] = [
  { code: "US", label: "EUA", eu: false },
  { code: "GB", label: "Reino Unido", eu: false },
  { code: "CA", label: "Canadá", eu: false },
  { code: "AU", label: "Austrália", eu: false },
  { code: "DE", label: "Alemanha", eu: true },
  { code: "FR", label: "França", eu: true },
  { code: "IT", label: "Itália", eu: true },
  { code: "ES", label: "Espanha", eu: true },
  { code: "PT", label: "Portugal", eu: true },
  { code: "NL", label: "Holanda", eu: true },
  { code: "PL", label: "Polônia", eu: true },
  { code: "SE", label: "Suécia", eu: true },
  { code: "BR", label: "Brasil", eu: false },
  { code: "MX", label: "México", eu: false },
];

export const EU_MARKET_CODES = new Set(MARKETS.filter((m) => m.eu).map((m) => m.code));

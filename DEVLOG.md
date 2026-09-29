# DEVLOG — PageClone AI

## ✅ Funcionalidades prontas (MVP v0.1)

- Landing page (hero, features, how it works, FAQ)
- Página `/clone` para colar URL
- Server function `fetchAndExtract` (proxy + parsing com linkedom)
- Extração: title, headline, subheadline, imagens, vídeos, CTAs, benefícios, depoimentos, cores
- Editor `/editor` com:
  - Modos FULL e SLIM
  - Preview responsivo (mobile / tablet / desktop)
  - Campo de link de afiliado → substitui todos os CTAs
  - Edição de headline, subheadline, CTA, logo
  - Export HTML e ZIP (com `netlify.toml`)
- Storage local (`localStorage`) com histórico
- Design system em `src/styles.css` (tokens oklch, dark mode ready)

## ✅ FASE 2 — Parser HTML (2026-09-28)

Layout e componentes visuais (`routes/`, `components/`, `styles.css`) **não foram alterados**.

### Pastas conferidas / organizadas

```
src/
├── parser/     htmlParser.ts, extractPage.ts, index.ts
├── cleaner/    trackers.ts, scripts.ts, index.ts
├── dom/        ctas.ts, headlines.ts, index.ts
├── cloner/     index.ts (reexporta o gerador atual — FASE 3+)
├── export/     downloadZip.ts, index.ts
└── utils/      url.ts, storage.ts, index.ts
```

### O que o parser faz

1. **Recebe URL** — `parseHtmlFromUrl` no server (`clone.functions.ts`); `parseHtmlDocument` para HTML já baixado.
2. **Filtra scripts/trackers** — analytics (GA, GTM, Meta Pixel, Hotjar, Clarity, TikTok, etc.), pixels 1×1, iframes de ads; widgets de chat/cookie (Intercom, Tawk, Crisp, OneTrust, Cookiebot…).
3. **Identifica CTAs** — `a` / `button` / `role=button` / submit, por copy (quero, comprar, checkout…) e classes (`btn`, `cta`…).
4. **Identifica headlines** — `og:title`, `h1`/`h2`/`h3`, fallback em classes `headline` / `hero-title`.
5. **Extração rica** — `extractFromHtml` continua preenchendo imagens, vídeos, benefícios, depoimentos e cores; ignora pixels de tracking na galeria.

### Integração

`fetchAndExtract` chama `parseHtmlFromUrl` e depois `extractFromHtml` com o resultado parseado. O editor e o export usam o mesmo `ExtractedPage`.

## ✅ FASE 3 — Motor de reconstrução (2026-09-28, reforço 2026-09-29)

O editor visual (`src/routes/editor.tsx`) **não mudou de layout**. `src/editor/buildClone.ts` só reexporta o motor.

### Onde vive

```
src/cloner/
├── build.ts        → orquestra FULL vs SLIM
├── full.ts         → HTML limpo + overlay responsivo (fallback semântico)
├── slim.ts         → só o essencial
├── rewrite.ts      → afiliado global + overrides do editor
├── document.ts     → parse/serialize no browser
├── affiliate.ts    → href único para todos os CTAs
├── styles.ts       → CSS responsivo (mobile / tablet 768 / desktop 1024)
├── escape.ts
└── types.ts
```

### FULL (2026-09-29)

Usa o `cleanedHtml` da Fase 2 como estrutura completa: injeta `<base>` + viewport, remove scripts, aplica CSS de adaptação (imagens/tabelas fluidas; breakpoints 768 / 1024) e o mesmo link de afiliado em todos os CTAs. Headline, subheadline, título e logo do editor são gravados no markup. Se o HTML limpo for curto ou inválido, cai no rebuild semântico (hero, oferta, benefícios, galeria, vídeos, prova social, CTAs).

### SLIM

Filtra para: headline, oferta, até 5 benefícios, até 3 depoimentos (prova social) e um único botão de CTA (barra fixa no rodapé). Sem logo, galeria, vídeos ou CTAs extras.

### Link de afiliado

`resolveAffiliateHref` define **um** `href`. `applyGlobalAffiliate` reescreve âncoras/botões de CTA nas duas versões (`data-affiliate-cta`). Se o campo do editor estiver preenchido, substitui os destinos; senão usa o primeiro CTA da página.

## 🐛 Bugs conhecidos / limitações

- Páginas SPA pesadas (React/Vue client-rendered) podem devolver pouco conteúdo, pois só lemos HTML inicial sem rodar JS.
- Sem renderização headless (puppeteer não roda em workerd).
- Extração de "depoimentos" é heurística — pode pegar falsos positivos.
- Imagens não são baixadas no export — apenas referenciadas por URL original.
- Scripts de produto (Stripe, reCAPTCHA, jQuery da página) são mantidos de propósito.

## 🧱 Estrutura do sistema

```
src/
├── components/SiteHeader.tsx
├── routes/
│   ├── __root.tsx
│   ├── index.tsx        → Landing
│   ├── clone.tsx        → input URL
│   └── editor.tsx       → editor + preview + export
├── services/
│   └── clone.functions.ts   → server fn (fetchAndExtract)
├── parser/
│   ├── htmlParser.ts        → FASE 2: URL + limpeza + CTA/headline
│   └── extractPage.ts       → extração HTML (campos do editor)
├── cleaner/
│   ├── trackers.ts          → analytics / pixels
│   └── scripts.ts           → widgets de chat / cookie
├── dom/
│   ├── ctas.ts
│   └── headlines.ts
├── editor/
│   └── buildClone.ts        → reexporta o motor (compat)
├── cloner/
│   ├── build.ts             → FASE 3: FULL / SLIM
│   ├── full.ts              → HTML limpo + responsivo
│   ├── slim.ts
│   ├── rewrite.ts           → afiliado global no DOM
│   └── affiliate.ts         → resolve href único
├── export/
│   └── downloadZip.ts       → download HTML e ZIP
├── utils/
│   ├── storage.ts           → localStorage
│   └── url.ts               → absolutize / normalizeHttpUrl
└── styles.css
```

## 🚀 Próximos passos

### Curto prazo
- [ ] Drag & drop para reordenar seções no editor
- [ ] Upload de imagem local para substituir hero
- [ ] Baixar imagens junto do ZIP (assets inline)
- [x] Detectar e remover scripts de tracking (Hotjar, FB pixel) opcionalmente
- [ ] Histórico visual de clones na sidebar
- [x] FASE 3: pipeline em `src/cloner` (FULL responsivo + SLIM essencial + afiliado global)

### Médio prazo
- [ ] Autenticação (Lovable Cloud / Supabase)
- [ ] Persistência de clones por usuário
- [ ] Stripe + sistema de créditos
- [ ] AI optimization (rewriter de headlines via Lovable AI)
- [ ] Templates marketplace

### Longo prazo
- [ ] Empacotar como APK Android via Capacitor
- [ ] Deploy 1-click para Netlify/Vercel via API
- [ ] Renderização headless opcional via serviço externo (browserless.io)

## 📦 Portabilidade

- Código é React puro + Tailwind → portável para Next.js movendo `src/routes/` → `app/`.
- Server functions (`createServerFn`) viram `route handlers` no Next.
- Sem dependências de backend exclusivo — `localStorage` no MVP.
- Exportável via GitHub a qualquer momento (botão GitHub no Lovable).

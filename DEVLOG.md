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
│   └── buildClone.ts        → gera HTML FULL/SLIM
├── cloner/
│   └── index.ts             → pipeline de clonagem (FASE 3+)
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
- [ ] FASE 3: pipeline em `src/cloner` (clonagem estruturada além do gerador FULL/SLIM)

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

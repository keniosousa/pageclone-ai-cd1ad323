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

## 🐛 Bugs conhecidos / limitações

- Páginas SPA pesadas (React/Vue client-rendered) podem devolver pouco conteúdo, pois só lemos HTML inicial sem rodar JS.
- Sem renderização headless (puppeteer não roda em workerd).
- Extração de "depoimentos" é heurística — pode pegar falsos positivos.
- Imagens não são baixadas no export — apenas referenciadas por URL original.

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
│   └── extractPage.ts       → extração HTML
├── editor/
│   └── buildClone.ts        → gera HTML FULL/SLIM
├── export/
│   └── downloadZip.ts       → download HTML e ZIP
├── utils/
│   └── storage.ts           → localStorage
└── styles.css
```

## 🚀 Próximos passos

### Curto prazo
- [ ] Drag & drop para reordenar seções no editor
- [ ] Upload de imagem local para substituir hero
- [ ] Baixar imagens junto do ZIP (assets inline)
- [ ] Detectar e remover scripts de tracking (Hotjar, FB pixel) opcionalmente
- [ ] Histórico visual de clones na sidebar

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

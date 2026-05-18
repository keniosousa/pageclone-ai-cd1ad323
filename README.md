# PageClone AI

AI-powered sales page cloning SaaS.

## Features

- Full Clone Mode
- Slim Clone Mode
- Affiliate CTA replacement
- Responsive editor
- HTML export
- Mobile optimization
- SaaS-ready architecture

## Stack

- React
- TanStack Start (SSR + server functions) — facilmente portável para Next.js
- Tailwind CSS v4
- linkedom (HTML parsing server-side)
- JSZip (export ZIP)

## Estrutura

```
src/
├── components/   # UI compartilhada (header, footer, etc.)
├── routes/       # páginas (/, /clone, /editor)
├── services/     # server functions (fetch + extract)
├── parser/       # extração de HTML
├── editor/       # geração do clone (FULL / SLIM)
├── export/       # download HTML / ZIP
├── utils/        # storage local, helpers
└── styles.css    # design system (tokens oklch)
```

## Future Features

- Stripe integration
- User accounts
- AI optimization
- Android APK (Capacitor)
- Template marketplace

## Status

MVP in development.

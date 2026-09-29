// Build FULL and SLIM HTML clones from an ExtractedPage.
import type { ExtractedPage } from "@/parser/extractPage";

export interface CloneOptions {
  affiliateUrl?: string;
  mode: "full" | "slim";
  title?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  logo?: string;
}

export function buildHtml(page: ExtractedPage, opts: CloneOptions): string {
  const cta = opts.ctaText || page.ctas[0]?.text || "Quero garantir agora";
  const href = opts.affiliateUrl || page.ctas[0]?.href || "#";
  const title = opts.title || page.title || "Página Clonada";
  const headline = opts.headline || page.headline;
  const subheadline = opts.subheadline || page.subheadline;
  const heroImg = page.images[0]?.src || "";
  const benefits = opts.mode === "slim" ? page.benefits.slice(0, 5) : page.benefits.slice(0, 10);
  const testimonials = opts.mode === "slim" ? page.testimonials.slice(0, 2) : page.testimonials.slice(0, 5);
  const gallery = opts.mode === "slim" ? [] : page.images.slice(1, 7);

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(page.description)}" />
<style>
  *,*::before,*::after{box-sizing:border-box}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:#0b0d12;color:#f5f7fb;line-height:1.6}
  .container{max-width:980px;margin:0 auto;padding:24px}
  header{padding:20px 0;text-align:center}
  .logo{font-weight:700;font-size:20px;color:#3b82f6}
  .hero{padding:48px 0 24px;text-align:center}
  h1{font-size:clamp(28px,5vw,52px);line-height:1.15;margin:0 0 16px;letter-spacing:-.02em}
  h2{font-size:clamp(20px,3vw,28px);font-weight:500;color:#cbd5e1;margin:0 0 24px}
  img{max-width:100%;height:auto;border-radius:12px;display:block;margin:24px auto}
  .cta{display:inline-block;background:#3b82f6;color:#fff;font-weight:700;padding:18px 36px;border-radius:12px;text-decoration:none;font-size:18px;transition:transform .2s}
  .cta:hover{transform:translateY(-2px)}
  .benefits{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;margin:40px 0}
  .benefit{background:#151922;padding:20px;border-radius:12px;border:1px solid #1f2937}
  .testimonial{background:#151922;padding:24px;border-radius:12px;border-left:4px solid #3b82f6;margin:16px 0;font-style:italic}
  .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px}
  footer{padding:40px 0;text-align:center;color:#64748b;font-size:14px}
  section{padding:32px 0}
</style>
</head>
<body>
  <div class="container">
    <header>
      ${opts.logo ? `<img src="${escapeAttr(opts.logo)}" alt="logo" style="max-height:48px;margin:0 auto"/>` : `<div class="logo">${escapeHtml(title)}</div>`}
    </header>

    <section class="hero">
      <h1>${escapeHtml(headline)}</h1>
      ${subheadline ? `<h2>${escapeHtml(subheadline)}</h2>` : ""}
      ${heroImg ? `<img src="${escapeAttr(heroImg)}" alt="${escapeAttr(headline)}" loading="lazy"/>` : ""}
      <a class="cta" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(cta)}</a>
    </section>

    ${
      benefits.length
        ? `<section><h2 style="text-align:center">Benefícios</h2><div class="benefits">${benefits
            .map((b) => `<div class="benefit">✓ ${escapeHtml(b)}</div>`)
            .join("")}</div></section>`
        : ""
    }

    ${
      gallery.length
        ? `<section><div class="gallery">${gallery
            .map((g) => `<img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.alt)}" loading="lazy"/>`)
            .join("")}</div></section>`
        : ""
    }

    ${
      testimonials.length
        ? `<section><h2 style="text-align:center">Depoimentos</h2>${testimonials
            .map((t) => `<div class="testimonial">"${escapeHtml(t)}"</div>`)
            .join("")}</section>`
        : ""
    }

    <section style="text-align:center;padding:48px 0">
      <a class="cta" href="${escapeAttr(href)}" target="_blank" rel="noopener">${escapeHtml(cta)}</a>
    </section>

    <footer>Página otimizada por PageClone AI</footer>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, "&quot;");
}

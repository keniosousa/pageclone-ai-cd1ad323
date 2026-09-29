import { affiliateCtas, ctaAnchor } from "./affiliate";
import { canParseDom, parseCloneDocument, serializeCloneDocument } from "./document";
import { escapeAttr, escapeHtml } from "./escape";
import {
  applyEditorOverrides,
  applyGlobalAffiliate,
  injectBaseAndViewport,
  injectStyle,
  stripScripts,
} from "./rewrite";
import { documentShell, fullPreserveStyles } from "./styles";
import type { CloneContext } from "./types";

function videoBlock(src: string): string {
  const yt = src.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${escapeAttr(yt[1])}" title="Vídeo" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
  }
  const vimeo = src.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) {
    return `<iframe src="https://player.vimeo.com/video/${escapeAttr(vimeo[1])}" title="Vídeo" allow="autoplay;fullscreen" allowfullscreen loading="lazy"></iframe>`;
  }
  if (/\.mp4(\?|$)/i.test(src)) {
    return `<video controls playsinline src="${escapeAttr(src)}"></video>`;
  }
  return `<iframe src="${escapeAttr(src)}" title="Vídeo" loading="lazy"></iframe>`;
}

function preserveFullHtml(ctx: CloneContext, cleanedHtml: string): string {
  const doc = parseCloneDocument(cleanedHtml);
  stripScripts(doc);
  injectBaseAndViewport(doc, ctx.page.url);
  injectStyle(doc, fullPreserveStyles(), "data-pageclone-responsive");
  applyEditorOverrides(doc, ctx);
  applyGlobalAffiliate(doc, ctx);
  doc.body?.setAttribute("data-clone-mode", "full");
  return serializeCloneDocument(doc);
}

/** Semantic rebuild when cleaned HTML is missing (e.g. clones antigos no storage). */
function reconstructFullHtml(ctx: CloneContext): string {
  const { page, opts, title, headline, subheadline, description, ctaText, ctaHref, logo } = ctx;
  const heroImg = page.images[0];
  const gallery = page.images.slice(1, 24);
  const benefits = page.benefits.slice(0, 12);
  const testimonials = page.testimonials.slice(0, 8);
  const videos = page.videos.slice(0, 6);
  const ctas = affiliateCtas(page, ctaHref, ctaText);
  const extraCtas = ctas.slice(1, 8);

  const logoBlock = logo
    ? `<img class="logo-img" src="${escapeAttr(logo)}" alt="${escapeAttr(title)}" />`
    : `<div class="logo">${escapeHtml(title)}</div>`;

  const ctaCluster = `<div class="cta-row">${ctas
    .slice(0, 1)
    .map((c) => ctaAnchor(c.text, c.href))
    .join("")}${extraCtas.map((c) => ctaAnchor(c.text, c.href)).join("")}</div>`;

  const media = heroImg
    ? `<div class="hero-media"><img src="${escapeAttr(heroImg.src)}" alt="${escapeAttr(heroImg.alt || headline)}" loading="eager" /></div>`
    : "";

  const body = `
  <div class="wrap">
    <header class="brand">${logoBlock}</header>
    <section class="hero hero-split">
      <div>
        <h1>${escapeHtml(headline)}</h1>
        ${subheadline ? `<p class="sub">${escapeHtml(subheadline)}</p>` : ""}
        ${ctaCluster}
      </div>
      ${media}
    </section>
    ${
      description
        ? `<section class="section"><h2>Oferta</h2><div class="offer"><p>${escapeHtml(description)}</p></div></section>`
        : ""
    }
    ${
      benefits.length
        ? `<section class="section"><h2>Benefícios</h2><div class="benefits">${benefits
            .map((b) => `<div class="benefit">✓ ${escapeHtml(b)}</div>`)
            .join("")}</div></section>`
        : ""
    }
    ${
      gallery.length
        ? `<section class="section"><h2>Galeria</h2><div class="gallery">${gallery
            .map((g) => `<img src="${escapeAttr(g.src)}" alt="${escapeAttr(g.alt)}" loading="lazy" />`)
            .join("")}</div></section>`
        : ""
    }
    ${
      videos.length
        ? `<section class="section"><h2>Vídeos</h2><div class="videos">${videos.map(videoBlock).join("")}</div></section>`
        : ""
    }
    ${
      testimonials.length
        ? `<section class="section"><h2>Prova social</h2>${testimonials
            .map((t) => `<blockquote class="testimonial">"${escapeHtml(t)}"</blockquote>`)
            .join("")}</section>`
        : ""
    }
    <section class="cta-band">
      ${ctaAnchor(ctaText, ctaHref)}
    </section>
    <footer class="note">Página otimizada por PageClone AI · ${escapeHtml(opts.mode.toUpperCase())}</footer>
  </div>`;

  return documentShell({
    title,
    description: description || headline,
    accent: ctx.accent,
    mode: "full",
    body,
  });
}

/** FULL: estrutura do HTML limpo + overlay responsivo; fallback semântico. */
export function buildFullHtml(ctx: CloneContext): string {
  const cleaned = (ctx.page.cleanedHtml || "").trim();
  if (cleaned.length > 400 && canParseDom()) {
    try {
      return preserveFullHtml(ctx, cleaned);
    } catch {
      /* reconstructed page below */
    }
  }
  return reconstructFullHtml(ctx);
}

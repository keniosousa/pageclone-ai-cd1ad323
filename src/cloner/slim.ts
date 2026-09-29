import { ctaAnchor } from "./affiliate";
import { canParseDom, parseCloneDocument, serializeCloneDocument } from "./document";
import { escapeHtml } from "./escape";
import { applyGlobalAffiliate } from "./rewrite";
import { documentShell } from "./styles";
import type { CloneContext } from "./types";

/** SLIM: só headline, oferta, benefícios, prova social e botão de CTA. */
export function buildSlimHtml(ctx: CloneContext): string {
  const { page, title, headline, description, subheadline, ctaText, ctaHref } = ctx;
  const offer = description || subheadline;
  const benefits = page.benefits.slice(0, 5);
  const proof = page.testimonials.slice(0, 3);

  const body = `
  <div class="wrap">
    <section class="hero">
      <h1>${escapeHtml(headline)}</h1>
    </section>
    ${
      offer
        ? `<section class="section"><h2>Oferta</h2><div class="offer"><p>${escapeHtml(offer)}</p></div></section>`
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
      proof.length
        ? `<section class="section"><h2>Prova social</h2>${proof
            .map((t) => `<blockquote class="testimonial">"${escapeHtml(t)}"</blockquote>`)
            .join("")}</section>`
        : ""
    }
    <div class="sticky-cta">${ctaAnchor(ctaText, ctaHref)}</div>
    <footer class="note">Página otimizada por PageClone AI · SLIM</footer>
  </div>`;

  let html = documentShell({
    title,
    description: offer || headline,
    accent: ctx.accent,
    mode: "slim",
    body,
  });

  if (canParseDom()) {
    try {
      const doc = parseCloneDocument(html);
      applyGlobalAffiliate(doc, ctx);
      html = serializeCloneDocument(doc);
    } catch {
      /* keep generated markup */
    }
  }

  return html;
}

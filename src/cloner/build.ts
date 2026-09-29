import type { ExtractedPage } from "@/parser/extractPage";
import { resolveAffiliateHref, resolveCtaText } from "./affiliate";
import { buildFullHtml } from "./full";
import { buildSlimHtml } from "./slim";
import { cloneAccent } from "./styles";
import type { CloneContext, CloneOptions } from "./types";

export type { CloneMode, CloneOptions, CloneContext } from "./types";

function context(page: ExtractedPage, opts: CloneOptions): CloneContext {
  const headline = (opts.headline || page.headline || page.title || "").trim();
  const subheadline = (opts.subheadline ?? page.subheadline ?? "").trim();
  const title = (opts.title || page.title || "Página Clonada").trim();
  return {
    page,
    opts,
    title,
    headline,
    subheadline,
    description: (page.description || "").trim(),
    ctaText: resolveCtaText(page, opts.ctaText),
    ctaHref: resolveAffiliateHref(page, opts.affiliateUrl),
    accent: cloneAccent(page.colors || []),
    logo: (opts.logo || "").trim(),
  };
}

/** Motor FASE 3: FULL (estrutura + responsivo) ou SLIM (essencial), mesmo href de afiliado. */
export function buildHtml(page: ExtractedPage, opts: CloneOptions): string {
  const ctx = context(page, opts);
  return opts.mode === "slim" ? buildSlimHtml(ctx) : buildFullHtml(ctx);
}

export { resolveAffiliateHref, resolveCtaText, affiliateCtas } from "./affiliate";
export { buildFullHtml } from "./full";
export { buildSlimHtml } from "./slim";

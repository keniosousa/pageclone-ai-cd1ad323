import type { ExtractedPage } from "@/parser/extractPage";
import { escapeAttr, escapeHtml } from "./escape";

/** One href for every CTA: affiliate link when present, otherwise the first detected CTA. */
export function resolveAffiliateHref(page: ExtractedPage, affiliateUrl?: string): string {
  const trimmed = (affiliateUrl || "").trim();
  if (trimmed) return trimmed;
  return page.ctas[0]?.href || "#";
}

export function resolveCtaText(page: ExtractedPage, ctaText?: string): string {
  const trimmed = (ctaText || "").trim();
  if (trimmed) return trimmed;
  return page.ctas[0]?.text || "Quero garantir agora";
}

/**
 * All original CTA labels, rewritten to the global affiliate href.
 * Primary button uses the editor CTA text; extras keep detected copy.
 */
export function affiliateCtas(
  page: ExtractedPage,
  href: string,
  primaryText: string,
): { text: string; href: string }[] {
  const seen = new Set<string>();
  const out: { text: string; href: string }[] = [];
  const push = (text: string) => {
    const key = text.toLowerCase();
    if (!text || seen.has(key)) return;
    seen.add(key);
    out.push({ text, href });
  };
  push(primaryText);
  for (const c of page.ctas) push(c.text);
  return out;
}

export function ctaAnchor(text: string, href: string, extraClass = ""): string {
  const cls = extraClass ? `cta ${extraClass}` : "cta";
  return `<a class="${cls}" data-affiliate-cta="true" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;
}

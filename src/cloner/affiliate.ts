import { looksLikeCta } from "@/dom/ctas";
import type { ExtractedPage } from "@/parser/extractPage";
import { collapseWhitespace } from "@/utils/url";
import { escapeAttr, escapeHtml } from "./escape";
import type { CloneContext } from "./types";

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

function isSkippableHref(raw: string): boolean {
  const t = (raw || "").trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  if (lower.startsWith("#")) return true;
  if (lower.startsWith("mailto:")) return true;
  if (lower.startsWith("tel:")) return true;
  if (lower.startsWith("sms:")) return true;
  if (lower.startsWith("javascript:")) return true;
  if (lower.startsWith("data:")) return true;
  if (lower.startsWith("blob:")) return true;
  return false;
}

function applyAffiliateHref(el: Element, href: string): void {
  el.setAttribute("href", href);
  el.setAttribute("target", "_blank");
  el.setAttribute("rel", "noopener noreferrer");
  el.setAttribute("data-affiliate-cta", "true");
}

function copyVisualAttrs(from: Element, to: Element): void {
  for (const attr of ["class", "style", "id", "aria-label", "title"]) {
    const value = from.getAttribute(attr);
    if (value) to.setAttribute(attr, value);
  }
}

/** Turn a CTA control into an affiliate link without rebuilding surrounding markup. */
function replaceControlWithAffiliateLink(el: Element, href: string): Element {
  const parentLink = el.closest("a");
  if (parentLink) {
    applyAffiliateHref(parentLink, href);
    return parentLink;
  }

  const tag = el.tagName.toLowerCase();
  if (tag === "a") {
    applyAffiliateHref(el, href);
    return el;
  }

  const doc = el.ownerDocument;
  const a = doc.createElement("a");
  applyAffiliateHref(a, href);
  copyVisualAttrs(el, a);
  if (tag === "input") {
    a.textContent = el.getAttribute("value") || el.getAttribute("aria-label") || "";
  } else {
    a.innerHTML = el.innerHTML;
  }
  el.replaceWith(a);
  return a;
}

function setCtaCopy(el: Element, text: string): void {
  if (el.tagName.toLowerCase() === "input") el.setAttribute("value", text);
  else el.textContent = text;
}

/**
 * Replace every destination link and detected CTA button in the cloned document
 * with the single affiliate href. Layout and non-link markup stay as-is.
 */
export function applyGlobalAffiliate(doc: Document, ctx: CloneContext): void {
  const href = (ctx.ctaHref || "").trim();
  if (!href) return;

  const marked: Element[] = [];
  const seen = new Set<Element>();
  const mark = (el: Element) => {
    if (seen.has(el)) return;
    seen.add(el);
    marked.push(el);
  };

  doc.querySelectorAll("a[href], a[data-affiliate-cta], a.cta, area[href]").forEach((a) => {
    const raw = a.getAttribute("href") || "";
    const already = a.getAttribute("data-affiliate-cta") === "true" || a.classList.contains("cta");
    if (!already && isSkippableHref(raw)) return;
    applyAffiliateHref(a, href);
    mark(a);
  });

  doc.querySelectorAll("form[action]").forEach((form) => {
    const raw = form.getAttribute("action") || "";
    if (isSkippableHref(raw)) return;
    form.setAttribute("action", href);
    form.setAttribute("data-affiliate-cta", "true");
    mark(form);
  });

  doc
    .querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']")
    .forEach((el) => {
      if (!looksLikeCta(el) && el.getAttribute("data-affiliate-cta") !== "true") return;
      mark(replaceControlWithAffiliateLink(el, href));
    });

  if (!ctx.ctaText || !marked.length) return;
  const original = collapseWhitespace(ctx.page.ctas[0]?.text).toLowerCase();
  const preferred =
    marked.find((el) => collapseWhitespace(el.textContent).toLowerCase() === original) || marked[0];
  if (preferred.tagName.toLowerCase() === "form") return;
  setCtaCopy(preferred, ctx.ctaText);
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

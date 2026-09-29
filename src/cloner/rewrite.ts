import { looksLikeCta } from "@/dom/ctas";
import { absolutize, collapseWhitespace } from "@/utils/url";
import type { CloneContext } from "./types";

function ensureHead(doc: Document): HTMLHeadElement {
  if (doc.head) return doc.head;
  const head = doc.createElement("head");
  doc.documentElement.insertBefore(head, doc.body);
  return head;
}

export function injectBaseAndViewport(doc: Document, pageUrl: string): void {
  const head = ensureHead(doc);
  if (pageUrl && !head.querySelector("base")) {
    const base = doc.createElement("base");
    base.setAttribute("href", pageUrl);
    head.insertBefore(base, head.firstChild);
  }
  if (!head.querySelector('meta[name="viewport"]')) {
    const meta = doc.createElement("meta");
    meta.setAttribute("name", "viewport");
    meta.setAttribute("content", "width=device-width, initial-scale=1");
    head.insertBefore(meta, head.firstChild);
  }
  if (!head.querySelector("meta[charset]")) {
    const charset = doc.createElement("meta");
    charset.setAttribute("charset", "utf-8");
    head.insertBefore(charset, head.firstChild);
  }
}

export function injectStyle(doc: Document, css: string, marker: string): void {
  const head = ensureHead(doc);
  if (head.querySelector(`style[${marker}]`)) return;
  const style = doc.createElement("style");
  style.setAttribute(marker, "true");
  style.textContent = css;
  head.appendChild(style);
}

export function stripScripts(doc: Document): void {
  doc.querySelectorAll("script, noscript").forEach((n) => n.remove());
}

export function applyEditorOverrides(doc: Document, ctx: CloneContext): void {
  const titleEl = doc.querySelector("title");
  if (titleEl && ctx.title) titleEl.textContent = ctx.title;
  else if (ctx.title) {
    const t = doc.createElement("title");
    t.textContent = ctx.title;
    ensureHead(doc).appendChild(t);
  }

  const h1 = doc.querySelector("h1");
  if (h1 && ctx.headline) h1.textContent = ctx.headline;

  if (ctx.subheadline) {
    const h2 = doc.querySelector("h2");
    if (h2) h2.textContent = ctx.subheadline;
  }

  if (ctx.logo) {
    const logo = doc.querySelector(
      "header img, .logo img, img[alt*='logo' i], img[class*='logo' i]",
    );
    if (logo) logo.setAttribute("src", ctx.logo);
  }
}

function setCtaCopy(el: Element, text: string): void {
  if (el.tagName.toLowerCase() === "input") el.setAttribute("value", text);
  else el.textContent = text;
}

/** One href on every CTA-like control (and any link that already was a detected CTA). */
export function applyGlobalAffiliate(doc: Document, ctx: CloneContext): void {
  const href = ctx.ctaHref;
  const known = new Set(ctx.page.ctas.map((c) => c.href).filter(Boolean));
  const marked: Element[] = [];

  const mark = (el: Element) => {
    if (el.tagName.toLowerCase() === "a") {
      el.setAttribute("href", href);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
    el.setAttribute("data-affiliate-cta", "true");
    marked.push(el);
  };

  doc.querySelectorAll("a[href], a[data-affiliate-cta], a.cta").forEach((a) => {
    const raw = a.getAttribute("href") || "";
    const abs = raw ? absolutize(ctx.page.url, raw) : "";
    const already = a.getAttribute("data-affiliate-cta") === "true" || a.classList.contains("cta");
    if (already || known.has(abs) || looksLikeCta(a)) mark(a);
  });

  doc.querySelectorAll("button, [role='button'], input[type='submit'], input[type='button']").forEach((el) => {
    if (!looksLikeCta(el)) return;
    mark(el);
  });

  if (!ctx.ctaText || !marked.length) return;
  const original = collapseWhitespace(ctx.page.ctas[0]?.text).toLowerCase();
  const preferred =
    marked.find((el) => collapseWhitespace(el.textContent).toLowerCase() === original) || marked[0];
  setCtaCopy(preferred, ctx.ctaText);
}

import type { CloneContext } from "./types";

export { applyGlobalAffiliate } from "./affiliate";

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


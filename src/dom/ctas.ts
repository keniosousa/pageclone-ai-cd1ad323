import { absolutize, collapseWhitespace } from "@/utils/url";

export interface CtaNode {
  text: string;
  href: string;
  tag: string;
}

const CTA_COPY =
  /comprar|quero|garantir|adquirir|assinar|inscrever|cadastre|cadastr|baixar|download|buy|get started|start now|join|sign up|claim|access|eu quero|saiba mais|aprender|matricul|checkout|add to cart|adicionar/i;

const CTA_CLASS = /btn|button|cta|buy|purchase|checkout|hero-cta|primary/i;

export function findCtas(document: Document, baseUrl: string): CtaNode[] {
  const out: CtaNode[] = [];
  const seen = new Set<string>();

  document
    .querySelectorAll("a, button, [role='button'], input[type='submit'], input[type='button']")
    .forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const text =
      tag === "input"
        ? collapseWhitespace(el.getAttribute("value") || el.getAttribute("aria-label"))
        : collapseWhitespace(el.textContent || el.getAttribute("aria-label"));

    if (!text || text.length > 80) return;

    const hrefRaw = el.getAttribute("href") || "";
    const href = hrefRaw ? absolutize(baseUrl, hrefRaw) : "";
    const className = el.getAttribute("class") || "";
    const type = el.getAttribute("type") || "";

    const looksLikeCta =
      CTA_COPY.test(text) ||
      CTA_CLASS.test(className) ||
      type === "submit" ||
      el.getAttribute("role") === "button";

    if (!looksLikeCta) return;

    const key = `${text.toLowerCase()}|${href}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ text, href, tag });
  });

  return out.slice(0, 12);
}

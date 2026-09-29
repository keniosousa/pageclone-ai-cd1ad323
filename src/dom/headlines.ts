import { collapseWhitespace } from "@/utils/url";

export interface HeadlineNode {
  tag: "h1" | "h2" | "h3" | "og:title";
  text: string;
}

const MIN = 8;
const MAX = 180;

function takeText(el: Element | null): string {
  return collapseWhitespace(el?.textContent);
}

function isUsable(text: string): boolean {
  return text.length >= MIN && text.length <= MAX;
}

/** Rank visible headings: first H1, then H2s near the top of the document. */
export function findHeadlines(document: Document): HeadlineNode[] {
  const out: HeadlineNode[] = [];
  const seen = new Set<string>();

  const push = (tag: HeadlineNode["tag"], text: string) => {
    if (!isUsable(text)) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ tag, text });
  };

  const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
  if (og) push("og:title", collapseWhitespace(og));

  document.querySelectorAll("h1").forEach((el) => push("h1", takeText(el)));
  document.querySelectorAll("h2").forEach((el) => push("h2", takeText(el)));
  if (out.filter((h) => h.tag === "h1" || h.tag === "h2").length < 2) {
    document.querySelectorAll("h3").forEach((el) => push("h3", takeText(el)));
  }
  if (!out.some((h) => h.tag === "h1")) {
    document
      .querySelectorAll("[class*='headline' i], [class*='hero-title' i], [class*='hero_title' i]")
      .forEach((el) => push("h1", takeText(el)));
  }

  return out.slice(0, 8);
}

export function primaryHeadline(headlines: HeadlineNode[], fallback: string): string {
  const h1 = headlines.find((h) => h.tag === "h1");
  if (h1) return h1.text;
  const og = headlines.find((h) => h.tag === "og:title");
  if (og) return og.text;
  return headlines[0]?.text || fallback;
}

export function primarySubheadline(headlines: HeadlineNode[], fallback: string): string {
  const h2 = headlines.find((h) => h.tag === "h2");
  if (h2) return h2.text;
  const h3 = headlines.find((h) => h.tag === "h3");
  if (h3) return h3.text;
  return fallback;
}

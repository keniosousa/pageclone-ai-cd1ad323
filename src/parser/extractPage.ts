// HTML parsing & extraction utilities for PageClone AI
// Runs on the server (linkedom) and can also be used in the browser via DOMParser.

import { parseHTML } from "linkedom";

export interface ExtractedPage {
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  images: { src: string; alt: string }[];
  videos: string[];
  ctas: { text: string; href: string }[];
  benefits: string[];
  testimonials: string[];
  colors: string[];
  rawHtml: string;
  cleanedHtml: string;
}

const absolutize = (base: string, src: string | null | undefined): string => {
  if (!src) return "";
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
};

export function extractFromHtml(html: string, baseUrl: string): ExtractedPage {
  const { document } = parseHTML(html);

  // Strip noisy / heavy nodes for the "cleaned" version
  const cleanedDoc = parseHTML(html).document;
  cleanedDoc.querySelectorAll(
    "script, noscript, iframe[src*='ads'], link[rel='preload'][as='script']",
  ).forEach((n) => n.remove());

  const title = document.querySelector("title")?.textContent?.trim() ?? "";
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const h1 = document.querySelector("h1")?.textContent?.trim() ?? "";
  const h2 = document.querySelector("h2")?.textContent?.trim() ?? "";

  const images: { src: string; alt: string }[] = [];
  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (!src) return;
    const abs = absolutize(baseUrl, src);
    if (abs.startsWith("data:")) return;
    images.push({ src: abs, alt: img.getAttribute("alt") ?? "" });
  });

  const videos: string[] = [];
  document.querySelectorAll("video source, video, iframe").forEach((el) => {
    const src = el.getAttribute("src");
    if (!src) return;
    if (/youtube|vimeo|wistia|vturb|player|\.mp4/i.test(src)) {
      videos.push(absolutize(baseUrl, src));
    }
  });

  const ctas: { text: string; href: string }[] = [];
  document.querySelectorAll("a, button").forEach((el) => {
    const text = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!text || text.length > 80) return;
    const href = el.getAttribute("href") || "";
    const looksLikeCTA = /comprar|quero|garantir|adquirir|assinar|inscrever|buy|get|start|join|sign|claim|comprar agora|access/i.test(
      text,
    );
    if (looksLikeCTA || /btn|button|cta/i.test(el.getAttribute("class") || "")) {
      ctas.push({ text, href: href ? absolutize(baseUrl, href) : "" });
    }
  });

  const benefits: string[] = [];
  document.querySelectorAll("ul li, ol li").forEach((li) => {
    const t = (li.textContent || "").replace(/\s+/g, " ").trim();
    if (t.length > 10 && t.length < 220) benefits.push(t);
  });

  const testimonials: string[] = [];
  document
    .querySelectorAll(
      "[class*='testimonial' i], [class*='depoiment' i], [class*='review' i], blockquote",
    )
    .forEach((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t.length > 30 && t.length < 600) testimonials.push(t);
    });

  // Color sampling from inline styles
  const colorSet = new Set<string>();
  document.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const matches = style.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    matches?.forEach((c) => colorSet.add(c));
  });

  return {
    url: baseUrl,
    title,
    headline: h1 || title,
    subheadline: h2 || description,
    description,
    images: dedupeBy(images, (i) => i.src).slice(0, 24),
    videos: Array.from(new Set(videos)).slice(0, 6),
    ctas: dedupeBy(ctas, (c) => c.text.toLowerCase()).slice(0, 12),
    benefits: Array.from(new Set(benefits)).slice(0, 12),
    testimonials: Array.from(new Set(testimonials)).slice(0, 6),
    colors: Array.from(colorSet).slice(0, 8),
    rawHtml: html,
    cleanedHtml: cleanedDoc.documentElement.outerHTML,
  };
}

function dedupeBy<T>(arr: T[], key: (x: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

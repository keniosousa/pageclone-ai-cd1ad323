// HTML parsing & extraction utilities for PageClone AI
// Runs on the server (linkedom) and can also be used in the browser via DOMParser.

import { parseHTML } from "linkedom";
import { parseHtmlDocument, type ParsedHtml } from "@/parser/htmlParser";
import { isTrackerUrl, type RemovedTracker } from "@/cleaner/trackers";
import { absolutize } from "@/utils/url";

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
  removedTrackers?: RemovedTracker[];
}

export function extractFromHtml(
  html: string,
  baseUrl: string,
  parsed: ParsedHtml = parseHtmlDocument(html, baseUrl),
): ExtractedPage {
  const { document } = parseHTML(html);

  const description =
    document.querySelector('meta[name="description"]')?.getAttribute("content") ??
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const images: { src: string; alt: string }[] = [];
  document.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (!src) return;
    const abs = absolutize(baseUrl, src);
    if (abs.startsWith("data:") || isTrackerUrl(abs) || /1x1|pixel/i.test(abs)) return;
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

  const colorSet = new Set<string>();
  document.querySelectorAll("[style]").forEach((el) => {
    const style = el.getAttribute("style") || "";
    const matches = style.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/g);
    matches?.forEach((c) => colorSet.add(c));
  });

  return {
    url: parsed.url,
    title: parsed.title,
    headline: parsed.headline,
    subheadline: parsed.subheadline || description,
    description,
    images: dedupeBy(images, (i) => i.src).slice(0, 24),
    videos: Array.from(new Set(videos)).slice(0, 6),
    ctas: parsed.ctas.map(({ text, href }) => ({ text, href })),
    benefits: Array.from(new Set(benefits)).slice(0, 12),
    testimonials: Array.from(new Set(testimonials)).slice(0, 6),
    colors: Array.from(colorSet).slice(0, 8),
    rawHtml: html,
    cleanedHtml: parsed.cleanedHtml,
    removedTrackers: parsed.removedTrackers,
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

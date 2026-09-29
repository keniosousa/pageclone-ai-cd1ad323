import { parseHTML } from "linkedom";
import { stripTrackers, type RemovedTracker } from "@/cleaner/trackers";
import { stripUnnecessaryScripts } from "@/cleaner/scripts";
import { findCtas, type CtaNode } from "@/dom/ctas";
import {
  findHeadlines,
  primaryHeadline,
  primarySubheadline,
  type HeadlineNode,
} from "@/dom/headlines";
import { normalizeHttpUrl } from "@/utils/url";

export interface ParsedHtml {
  url: string;
  title: string;
  headline: string;
  subheadline: string;
  headlines: HeadlineNode[];
  ctas: CtaNode[];
  removedTrackers: RemovedTracker[];
  cleanedHtml: string;
  rawHtml: string;
}

export interface ParseHtmlOptions {
  /** When true, drop remaining script/noscript nodes after tracker/widget strip. */
  aggressiveScriptStrip?: boolean;
}

type QueryDoc = {
  querySelector: (selector: string) => Element | null;
  querySelectorAll: (selector: string) => { forEach: (fn: (n: Element) => void) => void };
  documentElement?: { outerHTML?: string } | null;
};

/**
 * FASE 2 — Parser HTML inicial.
 * Recebe o markup de uma URL, filtra scripts/trackers desnecessários
 * e identifica headlines + botões de CTA. Não altera o layout da app.
 */
export function parseHtmlDocument(
  html: string,
  pageUrl: string,
  options: ParseHtmlOptions = {},
): ParsedHtml {
  const url = normalizeHttpUrl(pageUrl);
  const { document } = parseHTML(html);
  const doc = document as unknown as QueryDoc;

  const removedTrackers = [...stripTrackers(doc), ...stripUnnecessaryScripts(doc)];

  if (options.aggressiveScriptStrip) {
    doc.querySelectorAll("script, noscript").forEach((n) => n.remove());
  }

  const title = doc.querySelector("title")?.textContent?.trim() ?? "";
  const description =
    doc.querySelector('meta[name="description"]')?.getAttribute("content") ??
    doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const headlines = findHeadlines(document as unknown as Document);
  const ctas = findCtas(document as unknown as Document, url);

  return {
    url,
    title,
    headline: primaryHeadline(headlines, title),
    subheadline: primarySubheadline(headlines, description),
    headlines,
    ctas,
    removedTrackers,
    cleanedHtml: doc.documentElement?.outerHTML ?? html,
    rawHtml: html,
  };
}

/** Fetch + parse. Use only on the server (createServerFn / Node). */
export async function parseHtmlFromUrl(
  pageUrl: string,
  options: ParseHtmlOptions = {},
): Promise<ParsedHtml> {
  const url = normalizeHttpUrl(pageUrl);
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PageCloneAI/1.0; +https://pageclone.ai)",
      Accept: "text/html,application/xhtml+xml",
    },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Falha ao buscar página: ${res.status}`);
  const html = await res.text();
  return parseHtmlDocument(html, url, options);
}

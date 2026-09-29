import type { ExtractedPage } from "@/parser/extractPage";

export type CloneMode = "full" | "slim";

export interface CloneOptions {
  affiliateUrl?: string;
  mode: CloneMode;
  title?: string;
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  logo?: string;
}

export interface CloneContext {
  page: ExtractedPage;
  opts: CloneOptions;
  title: string;
  headline: string;
  subheadline: string;
  description: string;
  ctaText: string;
  /** Same href on every CTA (affiliate if set). */
  ctaHref: string;
  accent: string;
  logo: string;
}

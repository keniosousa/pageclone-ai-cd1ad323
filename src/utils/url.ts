/** Resolve relative URLs against a page origin. */
export function absolutize(base: string, src: string | null | undefined): string {
  if (!src) return "";
  try {
    return new URL(src, base).toString();
  } catch {
    return src;
  }
}

export function normalizeHttpUrl(raw: string): string {
  const u = new URL(raw.trim());
  if (!/^https?:$/.test(u.protocol)) {
    throw new Error("URL deve usar http(s)");
  }
  return u.toString();
}

export function collapseWhitespace(text: string | null | undefined): string {
  return (text || "").replace(/\s+/g, " ").trim();
}

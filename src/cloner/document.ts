function asFullDocument(html: string): string {
  const t = (html || "").trim();
  if (!t) return "<!DOCTYPE html><html><head></head><body></body></html>";
  if (/^<!doctype/i.test(t)) return t;
  if (/^<html[\s>]/i.test(t)) return `<!DOCTYPE html>${t}`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body>${t}</body></html>`;
}

export function canParseDom(): boolean {
  return typeof DOMParser !== "undefined";
}

export function parseCloneDocument(html: string): Document {
  if (!canParseDom()) {
    throw new Error("DOMParser indisponível");
  }
  return new DOMParser().parseFromString(asFullDocument(html), "text/html");
}

export function serializeCloneDocument(doc: Document): string {
  const html = doc.documentElement?.outerHTML ?? "";
  return `<!DOCTYPE html>\n${html}`;
}

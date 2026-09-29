import JSZip from "jszip";
import { isUnnecessaryScriptUrl, stripUnnecessaryScripts } from "@/cleaner/scripts";
import { isTrackerUrl, stripTrackers } from "@/cleaner/trackers";
import { canParseDom, parseCloneDocument, serializeCloneDocument } from "@/cloner/document";
import { absolutize } from "@/utils/url";

export type ZipAsset = { path: string; content: string };

export type PackagedClone = {
  indexHtml: string;
  assets: ZipAsset[];
  projectName: string;
};

const LOCAL_ASSET = /^(css|js)\//;

export async function downloadHtmlFile(html: string, filename = "index.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, filename);
}

/** Pack the cloned page (HTML + extracted CSS + cleaned JS) and download a hosting-ready ZIP. */
export async function downloadZipPackage(html: string, projectName = "pageclone") {
  const packaged = await packageClonedPage(html, projectName);
  const zip = new JSZip();
  zip.file("index.html", packaged.indexHtml);
  for (const asset of packaged.assets) {
    zip.file(asset.path, asset.content);
  }
  zip.file("netlify.toml", NETLIFY_TOML);
  zip.file("_redirects", "/*    /index.html   200\n");
  zip.file("README.md", hostingReadme(packaged.projectName));
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  triggerDownload(blob, `${packaged.projectName}.zip`);
}

/** Split cloned markup into index.html + css/ + js/ files ready for static hosting. */
export async function packageClonedPage(html: string, projectName = "pageclone"): Promise<PackagedClone> {
  const fallbackName = slugify(projectName);
  if (!html.trim() || !canParseDom()) {
    return { indexHtml: html || "<!DOCTYPE html><html><head></head><body></body></html>", assets: [], projectName: fallbackName };
  }

  const doc = parseCloneDocument(html);
  const pageUrl = doc.querySelector("base")?.getAttribute("href") || "";

  stripTrackers(doc);
  stripUnnecessaryScripts(doc);
  removeDirtyExternalScripts(doc);

  if (pageUrl) absolutizeDocumentUrls(doc, pageUrl);

  const assets: ZipAsset[] = [];
  extractInlineStyles(doc, assets);
  extractInlineScripts(doc, assets);
  await localizeRemoteStylesheets(doc, assets, pageUrl);
  await localizeRemoteScripts(doc, assets);

  doc.querySelectorAll("base").forEach((el) => el.remove());

  const title = doc.querySelector("title")?.textContent?.trim() || "";
  const name =
    !projectName || projectName === "pageclone"
      ? slugify(title || projectName || "pageclone")
      : slugify(projectName);

  return { indexHtml: serializeCloneDocument(doc), assets, projectName: name };
}

function removeDirtyExternalScripts(doc: Document): void {
  doc.querySelectorAll("script[src]").forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (isUnnecessaryScriptUrl(src) || isTrackerUrl(src)) el.remove();
  });
}

function absolutizeDocumentUrls(doc: Document, baseUrl: string): void {
  const attrs = ["src", "href", "poster", "data-src", "action"] as const;
  doc.querySelectorAll("img, source, video, audio, iframe, embed, object, link, script, a, area, form").forEach((el) => {
    for (const attr of attrs) {
      if (!el.hasAttribute(attr)) continue;
      const raw = el.getAttribute(attr) || "";
      if (LOCAL_ASSET.test(raw) || shouldLeaveUrl(raw)) continue;
      const resolved = resolveUrl(baseUrl, raw);
      if (resolved) el.setAttribute(attr, resolved);
    }
    if (el.hasAttribute("srcset")) {
      el.setAttribute("srcset", absolutizeSrcset(baseUrl, el.getAttribute("srcset") || ""));
    }
  });
}

function shouldLeaveUrl(raw: string): boolean {
  const t = (raw || "").trim();
  if (!t) return true;
  const lower = t.toLowerCase();
  return (
    lower.startsWith("#") ||
    lower.startsWith("data:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("mailto:") ||
    lower.startsWith("tel:") ||
    lower.startsWith("javascript:")
  );
}

function resolveUrl(baseUrl: string, raw: string): string {
  const t = (raw || "").trim();
  if (!t || shouldLeaveUrl(t)) return t;
  if (t.startsWith("//") && baseUrl) {
    try {
      return `${new URL(baseUrl).protocol}${t}`;
    } catch {
      return t;
    }
  }
  return baseUrl ? absolutize(baseUrl, t) : t;
}

function absolutizeSrcset(baseUrl: string, srcset: string): string {
  return srcset
    .split(",")
    .map((part) => {
      const bits = part.trim().split(/\s+/);
      if (!bits[0] || shouldLeaveUrl(bits[0])) return part.trim();
      bits[0] = resolveUrl(baseUrl, bits[0]);
      return bits.join(" ");
    })
    .filter(Boolean)
    .join(", ");
}

function extractInlineStyles(doc: Document, assets: ZipAsset[]): void {
  let n = 0;
  doc.querySelectorAll("style").forEach((el) => {
    const css = (el.textContent || "").trim();
    if (!css) {
      el.remove();
      return;
    }
    n += 1;
    const path = `css/style-${pad(n)}.css`;
    assets.push({ path, content: css });
    const link = doc.createElement("link");
    link.setAttribute("rel", "stylesheet");
    link.setAttribute("href", path);
    const media = el.getAttribute("media");
    if (media) link.setAttribute("media", media);
    el.replaceWith(link);
  });
}

function extractInlineScripts(doc: Document, assets: ZipAsset[]): void {
  let n = 0;
  doc.querySelectorAll("script").forEach((el) => {
    if (el.getAttribute("src")) return;
    const type = (el.getAttribute("type") || "").toLowerCase();
    if (type && type !== "text/javascript" && type !== "application/javascript" && type !== "module") {
      return;
    }
    const code = (el.textContent || "").trim();
    if (!code) {
      el.remove();
      return;
    }
    n += 1;
    const path = `js/script-${pad(n)}.js`;
    assets.push({ path, content: code });
    el.textContent = "";
    el.setAttribute("src", path);
    el.removeAttribute("integrity");
    el.removeAttribute("crossorigin");
  });
}

async function localizeRemoteStylesheets(doc: Document, assets: ZipAsset[], pageUrl: string): Promise<void> {
  const links = Array.from(doc.querySelectorAll('link[rel~="stylesheet"]'));
  let n = 0;
  for (const link of links) {
    const href = link.getAttribute("href") || "";
    if (!/^https?:\/\//i.test(href)) continue;
    const css = await tryFetchText(href);
    if (css == null) continue;
    n += 1;
    const path = `css/remote-${pad(n)}.css`;
    assets.push({ path, content: rewriteCssUrls(css, href || pageUrl) });
    link.setAttribute("href", path);
    link.removeAttribute("integrity");
    link.removeAttribute("crossorigin");
  }
}

async function localizeRemoteScripts(doc: Document, assets: ZipAsset[]): Promise<void> {
  const scripts = Array.from(doc.querySelectorAll("script[src]"));
  let n = 0;
  for (const el of scripts) {
    const src = el.getAttribute("src") || "";
    if (!/^https?:\/\//i.test(src)) continue;
    if (isUnnecessaryScriptUrl(src) || isTrackerUrl(src)) {
      el.remove();
      continue;
    }
    const code = await tryFetchText(src);
    if (code == null) continue;
    n += 1;
    const path = `js/vendor-${pad(n)}.js`;
    assets.push({ path, content: code });
    el.setAttribute("src", path);
    el.removeAttribute("integrity");
    el.removeAttribute("crossorigin");
  }
}

function rewriteCssUrls(css: string, stylesheetUrl: string): string {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/gi, (full, quote: string, url: string) => {
    const trimmed = (url || "").trim();
    if (!trimmed || shouldLeaveUrl(trimmed)) return full;
    const abs = absolutize(stylesheetUrl, trimmed);
    return `url(${quote}${abs}${quote})`;
  });
}

async function tryFetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(url, { signal: ctrl.signal, mode: "cors" });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function slugify(name: string): string {
  const s = (name || "pageclone")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "pageclone";
}

const NETLIFY_TOML = `[build]
  publish = "."

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
`;

function hostingReadme(projectName: string): string {
  return `# ${projectName}

Gerado por PageClone AI. Pacote estático pronto para hospedagem.

## Conteúdo

- \`index.html\` — página clonada
- \`css/\` — estilos extraídos (inline + remotos quando o CORS permitir)
- \`js/\` — scripts limpos (sem trackers/widgets), quando existirem

Imagens e vídeos continuam apontando para as URLs originais.

## Publicar

1. Extraia este ZIP.
2. Envie a pasta no [Netlify Drop](https://app.netlify.com/drop), Vercel, GitHub Pages ou qualquer host estático.
3. Abra o site — a home é \`index.html\`.
`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

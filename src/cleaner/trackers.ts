export interface RemovedTracker {
  kind: "script-src" | "script-inline" | "iframe" | "pixel" | "link";
  hint: string;
}

const TRACKER_URL =
  /google-analytics|googletagmanager|gtag\/js|googleadservices|doubleclick|googlesyndication|adservice\.google|connect\.facebook\.net|facebook\.com\/tr|fbevents|hotjar|static\.hotjar|clarity\.ms|tiktok\.com\/i18n\/pixel|analytics\.tiktok|linkedin\.com\/px|snap\.licdn|pinimg\.com\/ct|ads-twitter|static\.ads-twitter|scorecardresearch|quantserve|cdn\.segment\.com|api\.segment\.io|mixpanel|cdn\.amplitude|fullstory\.com|mouseflow|crazyegg|mc\.yandex|bat\.bing|sc-static\.net|pixel\.ad|taboola|outbrain|criteo|adsystem|adnxs|advertising\.com/i;

const TRACKER_INLINE =
  /\b(gtag\s*\(|ga\s*\(|fbq\s*\(|_fbq|dataLayer\s*=|hotjar|hj\s*\(|ttq\s*\.|lintrk\s*\(|twq\s*\(|pintrk\s*\(|clarity\s*\(|mixpanel|amplitude|analytics\.load|_paq\s*\.|ym\s*\()/i;

const TRACKER_IFRAME =
  /doubleclick|googlesyndication|facebook\.com\/tr|hotjar|adsystem|adnxs/i;

function hintFrom(src: string, fallback: string): string {
  const trimmed = src.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 160);
}

export function isTrackerUrl(src: string | null | undefined): boolean {
  return !!src && TRACKER_URL.test(src);
}

/** Remove analytics, ads and pixel nodes. Mutates the document. */
export function stripTrackers(document: {
  querySelectorAll: (selector: string) => { forEach: (fn: (n: Element) => void) => void };
}): RemovedTracker[] {
  const removed: RemovedTracker[] = [];

  document.querySelectorAll("script").forEach((el) => {
    const src = el.getAttribute("src") || "";
    const inline = el.textContent || "";
    if (src && isTrackerUrl(src)) {
      removed.push({ kind: "script-src", hint: hintFrom(src, "script") });
      el.remove();
      return;
    }
    if (!src && TRACKER_INLINE.test(inline)) {
      removed.push({ kind: "script-inline", hint: hintFrom(inline, "inline tracker") });
      el.remove();
    }
  });

  document.querySelectorAll("iframe").forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (TRACKER_IFRAME.test(src) || isTrackerUrl(src)) {
      removed.push({ kind: "iframe", hint: hintFrom(src, "iframe") });
      el.remove();
    }
  });

  document.querySelectorAll("img, noscript img").forEach((el) => {
    const src = el.getAttribute("src") || el.getAttribute("srcset") || "";
    if (isTrackerUrl(src) || /1x1|pixel|facebook\.com\/tr/i.test(src)) {
      removed.push({ kind: "pixel", hint: hintFrom(src, "pixel") });
      el.remove();
    }
  });

  document.querySelectorAll("noscript").forEach((el) => {
    const html = el.innerHTML || "";
    if (TRACKER_URL.test(html) || /facebook\.com\/tr|gtm\.js/i.test(html)) {
      removed.push({ kind: "pixel", hint: "noscript tracker" });
      el.remove();
    }
  });

  document.querySelectorAll("link").forEach((el) => {
    const href = el.getAttribute("href") || "";
    const rel = (el.getAttribute("rel") || "").toLowerCase();
    if (isTrackerUrl(href) || (rel.includes("preload") && /script/i.test(el.getAttribute("as") || "") && isTrackerUrl(href))) {
      removed.push({ kind: "link", hint: hintFrom(href, rel) });
      el.remove();
    }
  });

  return removed;
}

import type { RemovedTracker } from "./trackers";

/** Chat widgets, cookie banners and other non-content third-party scripts. */
const WIDGET_URL =
  /intercom|widget\.intercom|js\.driftt|tawk\.to|crisp\.chat|zdassets\.com|zendesk|hs-scripts\.com|js\.hs-scripts|hubspot\.com\/conversations|cookiebot|onetrust|cookielaw\.org|osano\.com|iubenda|tidio\.co|livechatinc|smartsupp|jivochat|chaport|freshchat|helpcrunch|chatwoot/i;

const WIDGET_INLINE =
  /\b(Intercom\s*\(|driftt|Tawk_API|CRISP_WEBSITE_ID|zE\s*\(|hsConversationsSettings|Cookiebot|OneTrust|TidioChatAPI)\b/i;

function hintFrom(src: string, fallback: string): string {
  const trimmed = src.replace(/\s+/g, " ").trim();
  if (!trimmed) return fallback;
  return trimmed.slice(0, 160);
}

export function isUnnecessaryScriptUrl(src: string | null | undefined): boolean {
  return !!src && WIDGET_URL.test(src);
}

/** Mutates the document. Leaves payment, captcha and page-logic scripts in place. */
export function stripUnnecessaryScripts(document: {
  querySelectorAll: (selector: string) => { forEach: (fn: (n: Element) => void) => void };
}): RemovedTracker[] {
  const removed: RemovedTracker[] = [];

  document.querySelectorAll("script").forEach((el) => {
    const src = el.getAttribute("src") || "";
    const inline = el.textContent || "";
    if (src && isUnnecessaryScriptUrl(src)) {
      removed.push({ kind: "script-src", hint: hintFrom(src, "widget script") });
      el.remove();
      return;
    }
    if (!src && WIDGET_INLINE.test(inline)) {
      removed.push({ kind: "script-inline", hint: hintFrom(inline, "widget inline") });
      el.remove();
    }
  });

  document.querySelectorAll("iframe").forEach((el) => {
    const src = el.getAttribute("src") || "";
    if (WIDGET_URL.test(src)) {
      removed.push({ kind: "iframe", hint: hintFrom(src, "widget iframe") });
      el.remove();
    }
  });

  return removed;
}

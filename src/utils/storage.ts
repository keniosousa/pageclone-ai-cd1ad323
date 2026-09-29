import type { ExtractedPage } from "@/parser/extractPage";

const KEY = "pageclone:current";
const HISTORY = "pageclone:history";

export function saveCurrent(page: ExtractedPage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(page));
  const hist = loadHistory();
  hist.unshift({ url: page.url, title: page.title, at: Date.now() });
  localStorage.setItem(HISTORY, JSON.stringify(hist.slice(0, 20)));
}

export function loadCurrent(): ExtractedPage | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as ExtractedPage; } catch { return null; }
}

export function loadHistory(): { url: string; title: string; at: number }[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(HISTORY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

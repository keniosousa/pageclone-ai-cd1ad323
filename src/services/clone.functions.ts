import { createServerFn } from "@tanstack/react-start";
import { extractFromHtml, type ExtractedPage } from "@/parser/extractPage";

export const fetchAndExtract = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input?.url || typeof input.url !== "string") {
      throw new Error("URL inválida");
    }
    const u = new URL(input.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error("URL deve usar http(s)");
    return { url: u.toString() };
  })
  .handler(async ({ data }): Promise<ExtractedPage> => {
    const res = await fetch(data.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; PageCloneAI/1.0; +https://pageclone.ai)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Falha ao buscar página: ${res.status}`);
    const html = await res.text();
    return extractFromHtml(html, data.url);
  });

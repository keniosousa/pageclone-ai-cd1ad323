import { createServerFn } from "@tanstack/react-start";
import { extractFromHtml, type ExtractedPage } from "@/parser/extractPage";
import { parseHtmlFromUrl } from "@/parser/htmlParser";
import { normalizeHttpUrl } from "@/utils/url";

export const fetchAndExtract = createServerFn({ method: "POST" })
  .inputValidator((input: { url: string }) => {
    if (!input?.url || typeof input.url !== "string") {
      throw new Error("URL inválida");
    }
    return { url: normalizeHttpUrl(input.url) };
  })
  .handler(async ({ data }): Promise<ExtractedPage> => {
    const parsed = await parseHtmlFromUrl(data.url);
    return extractFromHtml(parsed.rawHtml, parsed.url, parsed);
  });

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { fetchAndExtract } from "@/services/clone.functions";
import { saveCurrent } from "@/utils/storage";
import { Loader2, Globe, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/clone")({
  head: () => ({
    meta: [
      { title: "Clonar página — PageClone AI" },
      { name: "description", content: "Cole a URL da página de vendas para clonar." },
    ],
  }),
  component: ClonePage,
});

function ClonePage() {
  const fetchFn = useServerFn(fetchAndExtract);
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const page = await fetchFn({ data: { url } });
      saveCurrent(page);
      navigate({ to: "/editor" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-center">
            Cole a URL da página
          </h1>
          <p className="mt-3 text-center text-muted-foreground">
            Vamos analisar o HTML e extrair tudo: headline, CTAs, imagens, depoimentos e mais.
          </p>

          <form onSubmit={onSubmit} className="mt-10 space-y-4">
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/pagina-de-vendas"
                className="w-full rounded-md border border-input bg-background pl-11 pr-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-brand"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand py-3 font-medium text-brand-foreground transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? "Analisando…" : "Analisar página"}
            </button>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" /> {error}
              </div>
            )}
          </form>

          <p className="mt-8 text-xs text-center text-muted-foreground">
            Dica: páginas com muito JavaScript dinâmico podem ter conteúdo limitado.
          </p>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

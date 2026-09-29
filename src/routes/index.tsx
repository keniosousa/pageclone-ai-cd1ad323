import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import {
  Zap, Scissors, Edit3, Download, Smartphone, Link2, ArrowRight, Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PageClone AI — Clone páginas de vendas em segundos" },
      { name: "description", content: "Clone, otimize e exporte qualquer página de vendas com troca de link de afiliado em 1 clique." },
      { property: "og:title", content: "PageClone AI" },
      { property: "og:description", content: "Clonador inteligente de páginas de vendas para afiliados." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50" aria-hidden />
          <div className="container relative mx-auto px-4 py-24 md:py-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Zap className="h-3 w-3 text-brand" /> MVP em desenvolvimento
            </div>
            <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
              Clone páginas de vendas.<br />
              <span className="text-brand">Troque o link de afiliado em 1 clique.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Cole a URL, escolha entre versão <strong>FULL</strong> ou <strong>SLIM</strong>,
              edite no editor visual e exporte HTML pronto para Netlify.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/clone" className="inline-flex items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-brand-foreground transition hover:opacity-90">
                Testar grátis <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="#how" className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 font-medium hover:bg-accent">
                Como funciona
              </a>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-t border-border/60 py-24">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Tudo que afiliado profissional precisa</h2>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Zap, t: "FULL Clone", d: "Replica toda a estrutura visual com responsividade melhorada." },
                { icon: Scissors, t: "SLIM Clone", d: "Versão otimizada — só o que converte. Rápida e limpa." },
                { icon: Link2, t: "CTAs em 1 clique", d: "Substitua todos os links de afiliado de uma só vez." },
                { icon: Edit3, t: "Editor visual", d: "Edite texto, imagens, cores e logo direto no navegador." },
                { icon: Download, t: "Export HTML/ZIP", d: "Baixe HTML limpo pronto para Netlify ou Vercel." },
                { icon: Smartphone, t: "100% responsivo", d: "Preview mobile, tablet e desktop com 1 clique." },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-border bg-card p-6 transition hover:shadow-lg">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{f.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW */}
        <section id="how" className="border-t border-border/60 py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Como funciona</h2>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                ["Cole a URL", "Você cola o link da página de vendas que quer clonar."],
                ["Escolha FULL ou SLIM", "FULL replica tudo. SLIM mantém só as partes de maior conversão."],
                ["Edite e exporte", "Troque os CTAs, edite texto e baixe o HTML pronto."],
              ].map(([t, d], i) => (
                <li key={t} className="rounded-xl border border-border bg-card p-6">
                  <div className="text-3xl font-bold text-brand">0{i + 1}</div>
                  <h3 className="mt-2 font-semibold">{t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="border-t border-border/60 py-24">
          <div className="container mx-auto max-w-3xl px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center tracking-tight">Perguntas frequentes</h2>
            <div className="mt-10 space-y-4">
              {[
                ["Funciona com qualquer página?", "Sim, qualquer página pública HTTP/HTTPS pode ser analisada."],
                ["Precisa de backend?", "Não. Tudo roda no frontend + um proxy serverless para buscar a página."],
                ["Posso usar como afiliado?", "Sim, é o caso de uso principal. Você troca todos os CTAs por seu link."],
                ["Onde fica salvo?", "Localmente no seu navegador. Você pode exportar como HTML ou ZIP a qualquer momento."],
              ].map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-border bg-card p-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="cursor-pointer font-medium flex items-center justify-between">
                    {q}
                    <Check className="h-4 w-4 text-brand opacity-0 group-open:opacity-100 transition" />
                  </summary>
                  <p className="mt-3 text-sm text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link to="/clone" className="inline-flex items-center gap-2 rounded-md bg-brand px-6 py-3 font-medium text-brand-foreground hover:opacity-90">
                Começar agora <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { loadCurrent } from "@/utils/storage";
import { buildHtml } from "@/editor/buildClone";
import type { ExtractedPage } from "@/parser/extractPage";
import { downloadHtmlFile, downloadZipPackage } from "@/export/downloadZip";
import {
  Smartphone, Tablet, Monitor, Download, FileArchive, Zap, Scissors, Link2,
} from "lucide-react";

export const Route = createFileRoute("/editor")({
  head: () => ({
    meta: [{ title: "Editor — PageClone AI" }],
  }),
  component: EditorPage,
});

type Device = "mobile" | "tablet" | "desktop";
type Mode = "full" | "slim";

function EditorPage() {
  const [page, setPage] = useState<ExtractedPage | null>(null);
  const [mode, setMode] = useState<Mode>("full");
  const [device, setDevice] = useState<Device>("desktop");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [logo, setLogo] = useState("");

  useEffect(() => {
    const p = loadCurrent();
    if (p) {
      setPage(p);
      setHeadline(p.headline);
      setSubheadline(p.subheadline);
      setCtaText(p.ctas[0]?.text ?? "Quero garantir agora");
    }
  }, []);

  const html = useMemo(() => {
    if (!page) return "";
    return buildHtml(page, { mode, affiliateUrl, headline, subheadline, ctaText, logo });
  }, [page, mode, affiliateUrl, headline, subheadline, ctaText, logo]);

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <h1 className="text-2xl font-bold">Nenhuma página clonada ainda</h1>
            <p className="mt-2 text-muted-foreground">Cole uma URL para começar.</p>
            <Link to="/clone" className="mt-6 inline-flex rounded-md bg-brand px-5 py-2.5 font-medium text-brand-foreground hover:opacity-90">
              Ir para clonador
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const deviceWidth = { mobile: 390, tablet: 768, desktop: 1200 }[device];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="font-semibold truncate max-w-md" title={page.url}>
              {page.title || "Página clonada"}
            </h1>
            <p className="text-xs text-muted-foreground truncate max-w-md">{page.url}</p>
          </div>
          <div className="flex items-center gap-2">
            <ModeBtn active={mode === "full"} onClick={() => setMode("full")} icon={Zap} label="FULL" />
            <ModeBtn active={mode === "slim"} onClick={() => setMode("slim")} icon={Scissors} label="SLIM" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Sidebar */}
          <aside className="space-y-4">
            <Card title="Link de afiliado">
              <input
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://hotmart.com/seu-link"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => {/* applied automatically via state */}}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
              >
                <Link2 className="h-4 w-4" /> Substituir todos CTAs
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                {page.ctas.length} CTAs detectados serão substituídos.
              </p>
            </Card>

            <Card title="Conteúdo">
              <Field label="Headline" value={headline} onChange={setHeadline} />
              <Field label="Subheadline" value={subheadline} onChange={setSubheadline} />
              <Field label="Texto do CTA" value={ctaText} onChange={setCtaText} />
              <Field label="URL do Logo" value={logo} onChange={setLogo} placeholder="https://…/logo.png" />
            </Card>

            <Card title="Exportar">
              <button onClick={() => downloadHtmlFile(html)} className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
                <Download className="h-4 w-4" /> Baixar HTML
              </button>
              <button onClick={() => downloadZipPackage(html)} className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
                <FileArchive className="h-4 w-4" /> Baixar ZIP (Netlify)
              </button>
            </Card>

            <Card title="Detectado">
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>Imagens: {page.images.length}</li>
                <li>Vídeos: {page.videos.length}</li>
                <li>CTAs: {page.ctas.length}</li>
                <li>Benefícios: {page.benefits.length}</li>
                <li>Depoimentos: {page.testimonials.length}</li>
              </ul>
            </Card>
          </aside>

          {/* Preview */}
          <section>
            <div className="flex items-center justify-center gap-1 mb-3">
              <DeviceBtn active={device === "mobile"} onClick={() => setDevice("mobile")} icon={Smartphone} />
              <DeviceBtn active={device === "tablet"} onClick={() => setDevice("tablet")} icon={Tablet} />
              <DeviceBtn active={device === "desktop"} onClick={() => setDevice("desktop")} icon={Monitor} />
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4 flex justify-center overflow-auto">
              <iframe
                title="Preview"
                srcDoc={html}
                style={{ width: deviceWidth, height: 720, border: 0, background: "#fff", borderRadius: 8 }}
              />
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <label className="block mb-3 last:mb-0">
      <span className="block text-xs text-muted-foreground mb-1">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
      />
    </label>
  );
}

function ModeBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Zap; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        active ? "bg-brand text-brand-foreground" : "border border-border hover:bg-accent"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function DeviceBtn({ active, onClick, icon: Icon }: { active: boolean; onClick: () => void; icon: typeof Smartphone }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md p-2 transition ${active ? "bg-brand text-brand-foreground" : "hover:bg-accent"}`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

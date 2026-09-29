import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

const DEVICES: { id: Device; label: string; width: number; icon: typeof Smartphone }[] = [
  { id: "mobile", label: "Mobile", width: 390, icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, icon: Tablet },
  { id: "desktop", label: "Desktop", width: 1280, icon: Monitor },
];

const PREVIEW_HEIGHT = 720;

function EditorPage() {
  const [page, setPage] = useState<ExtractedPage | null>(null);
  const [mode, setMode] = useState<Mode>("full");
  const [device, setDevice] = useState<Device>("desktop");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [logo, setLogo] = useState("");
  const [exporting, setExporting] = useState(false);
  const [liveFlash, setLiveFlash] = useState(false);

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

  const htmlRef = useRef(html);
  htmlRef.current = html;

  useEffect(() => {
    if (!page) return;
    setLiveFlash(true);
    const t = window.setTimeout(() => setLiveFlash(false), 450);
    return () => window.clearTimeout(t);
  }, [html, page]);

  const onDownloadHtml = useCallback(() => {
    downloadHtmlFile(htmlRef.current);
  }, []);

  const onDownloadZip = useCallback(async () => {
    setExporting(true);
    try {
      await downloadZipPackage(htmlRef.current);
    } finally {
      setExporting(false);
    }
  }, []);

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

  const deviceMeta = DEVICES.find((d) => d.id === device) ?? DEVICES[2];

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-6">
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

        <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-4">
            <Card title="Link de afiliado">
              <input
                value={affiliateUrl}
                onChange={(e) => setAffiliateUrl(e.target.value)}
                placeholder="https://hotmart.com/seu-link"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
              />
              <button
                type="button"
                onClick={() => setAffiliateUrl((v) => v.trim())}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md bg-brand px-3 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
              >
                <Link2 className="h-4 w-4" /> Substituir todos CTAs
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                {page.ctas.length} CTAs detectados. O preview e o ZIP usam este link na hora.
              </p>
            </Card>

            <Card title="Conteúdo">
              <Field label="Headline" value={headline} onChange={setHeadline} />
              <Field label="Subheadline" value={subheadline} onChange={setSubheadline} />
              <Field label="Texto do CTA" value={ctaText} onChange={setCtaText} />
              <Field label="URL do Logo" value={logo} onChange={setLogo} placeholder="https://…/logo.png" />
              <p className="text-xs text-muted-foreground">Cada campo atualiza o preview ao digitar.</p>
            </Card>

            <Card title="Exportar">
              <button
                type="button"
                onClick={onDownloadHtml}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
              >
                <Download className="h-4 w-4" /> Baixar HTML
              </button>
              <button
                type="button"
                onClick={() => void onDownloadZip()}
                disabled={exporting || !html}
                className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:bg-accent disabled:opacity-60"
              >
                <FileArchive className="h-4 w-4" /> {exporting ? "Empacotando…" : "Baixar ZIP (Netlify)"}
              </button>
              <p className="mt-2 text-xs text-muted-foreground">
                O arquivo é gerado a partir do preview atual ({mode.toUpperCase()}, {deviceMeta.label.toLowerCase()}).
              </p>
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

          <section className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div
                role="radiogroup"
                aria-label="Visualização do preview"
                className="inline-flex rounded-lg border border-border bg-card p-1"
              >
                {DEVICES.map((item) => (
                  <DeviceBtn
                    key={item.id}
                    active={device === item.id}
                    onClick={() => setDevice(item.id)}
                    icon={item.icon}
                    label={item.label}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`inline-flex h-2 w-2 rounded-full ${liveFlash ? "bg-brand" : "bg-emerald-500"}`}
                  aria-hidden
                />
                <span>Preview ao vivo · {deviceMeta.width}px</span>
              </div>
            </div>
            <PreviewFrame html={html} width={deviceMeta.width} device={device} />
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PreviewFrame({ html, width, device }: { html: string; width: number; device: Device }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [available, setAvailable] = useState(width);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setAvailable(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    iframe.srcdoc = html;
  }, [html]);

  const scale = Math.min(1, available > 0 ? available / width : 1);
  const radius = device === "mobile" ? 24 : device === "tablet" ? 16 : 8;

  return (
    <div
      ref={hostRef}
      className="rounded-xl border border-border bg-muted/30 p-4"
    >
      <div className="flex justify-center">
        <div
          style={{
            width: width * scale,
            height: PREVIEW_HEIGHT * scale,
            transition: "width 320ms ease, height 320ms ease",
          }}
        >
          <div
            className="overflow-hidden bg-white shadow-lg"
            style={{
              width,
              height: PREVIEW_HEIGHT,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              transition: "width 320ms ease, transform 320ms ease, border-radius 320ms ease",
              borderRadius: radius,
            }}
          >
            <iframe
              ref={iframeRef}
              title="Preview da página clonada"
              srcDoc={html}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      </div>
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
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
        active ? "bg-brand text-brand-foreground" : "border border-border hover:bg-accent"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function DeviceBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Smartphone;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        active ? "bg-brand text-brand-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}

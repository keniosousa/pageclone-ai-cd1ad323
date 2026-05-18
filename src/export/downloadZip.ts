import JSZip from "jszip";

export async function downloadHtmlFile(html: string, filename = "index.html") {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  triggerDownload(blob, filename);
}

export async function downloadZipPackage(html: string, projectName = "pageclone") {
  const zip = new JSZip();
  zip.file("index.html", html);
  zip.file(
    "netlify.toml",
    `[build]\n  publish = "."\n\n[[redirects]]\n  from = "/*"\n  to = "/index.html"\n  status = 200\n`,
  );
  zip.file(
    "README.md",
    `# ${projectName}\n\nGerado por PageClone AI.\n\n## Deploy no Netlify\n\n1. Faça upload deste ZIP em https://app.netlify.com/drop\n2. Pronto!\n`,
  );
  const blob = await zip.generateAsync({ type: "blob" });
  triggerDownload(blob, `${projectName}.zip`);
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

import { useState } from "react";
import { useModal } from "@/hooks/use-modal";

export function useExport(title: string, content: string) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const { showAlert } = useModal();

  const handleExportTXT = () => {
    const plainText = content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
    const textToExport = `JUDUL: ${title || 'Tanpa Judul'}\n\n${plainText}`;
    const blob = new Blob([textToExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Catatan_Nexa"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportDOC = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Catatan Nexa</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + `<h1>${title || "Tanpa Judul"}</h1>` + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Catatan_Nexa"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      showAlert("Error Ekspor", "Gagal memuat sistem pembuatan PDF.");
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>${title || "Catatan_Nexa"}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 32px; font-weight: bold; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; margin-bottom: 24px; }
            p { margin-bottom: 1em; }
            ul { list-style-type: disc; margin-left: 24px; margin-bottom: 1em; }
            ol { list-style-type: decimal; margin-left: 24px; margin-bottom: 1em; }
          </style>
        </head>
        <body>
          <h1>${title || 'Tanpa Judul'}</h1>
          <div>${content}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  return {
    showExportMenu, setShowExportMenu,
    handleExportTXT, handleExportDOC, handleExportPDF
  };
}
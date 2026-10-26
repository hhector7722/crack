"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Loader2, RefreshCw } from "lucide-react";
import { indexStoredPdf } from "@/lib/pdf-index-client";

type PdfProxy = Awaited<ReturnType<typeof import("pdfjs-dist/legacy/build/pdf.mjs")["getDocument"]>["promise"]>;

export function PdfDocumentViewer({
  url,
  itemId,
  title,
}: {
  url: string;
  itemId: string;
  title: string;
}) {
  const pdfRef = useRef<PdfProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const [indexing, setIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: ReturnType<typeof import("pdfjs-dist/legacy/build/pdf.mjs")["getDocument"]> | null = null;
    pdfRef.current = null;
    setPageCount(0);
    setPageNumber(1);
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url
        ).toString();
        if (cancelled) return;
        loadingTask = pdfjs.getDocument({
          url,
          withCredentials: false,
          isEvalSupported: false,
          useSystemFonts: true,
        });
        const document = await loadingTask.promise;
        if (cancelled) {
          await document.destroy();
          return;
        }
        pdfRef.current = document;
        setPageCount(document.numPages);
      } catch (cause) {
        if (!cancelled) {
          console.warn("[pdf:viewer]", cause instanceof Error ? cause.name : "unknown");
          setError("No se ha podido visualizar el PDF aquí. Ábrelo en otra pestaña o descarga el original.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfRef.current = null;
      void loadingTask?.destroy().catch(() => {});
    };
  }, [url]);

  useEffect(() => {
    const target = scrollRef.current;
    if (!target) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.floor(entries[0]?.contentRect.width ?? 0);
      setWidth((previous) => Math.abs(previous - next) > 3 ? next : previous);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [pageCount]);

  useEffect(() => {
    const document = pdfRef.current;
    const canvas = canvasRef.current;
    if (!document || !canvas || !pageCount || !width || pageNumber > pageCount) return;

    let cancelled = false;
    let renderTask: ReturnType<Awaited<ReturnType<PdfProxy["getPage"]>>["render"]> | null = null;
    setRendering(true);
    void (async () => {
      try {
        const page = await document.getPage(pageNumber);
        if (cancelled) return;

        const base = page.getViewport({ scale: 1 });
        const available = Math.min(Math.max(width - 16, 100), 1500);
        const cssScale = available / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const scaled = page.getViewport({ scale: cssScale * dpr });

        canvas.width = Math.round(scaled.width);
        canvas.height = Math.round(scaled.height);
        canvas.style.width = Math.round(scaled.width / dpr) + "px";
        canvas.style.height = Math.round(scaled.height / dpr) + "px";
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) throw new Error("Canvas no disponible");
        renderTask = page.render({ canvasContext: ctx, viewport: scaled });
        await renderTask.promise;
        page.cleanup();
      } catch (cause) {
        if (cancelled || (cause instanceof Error && cause.name === "RenderingCancelledException")) return;
        console.warn("[pdf:render]", cause instanceof Error ? cause.name : "unknown");
        setError("No se ha podido mostrar esta página.");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [pageCount, pageNumber, width]);

  const navigate = useCallback((next: number) => {
    setPageNumber((current) => Math.max(1, Math.min(pageCount, next || current)));
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pageCount]);

  async function downloadOriginal() {
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Descarga fallida");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = (title || "documento").replace(/\.pdf$/i, "") + ".pdf";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    } catch {
      setError("No se pudo descargar el PDF. Prueba «Abrir original».");
    }
  }

  async function indexPages() {
    if (indexing) return;
    setIndexing(true);
    setIndexMessage("Extrayendo texto de todas las páginas…");
    try {
      const result = await indexStoredPdf(itemId);
      setIndexMessage(
        `Páginas del PDF: ${result.total_pages}. Con texto: ${result.indexed_pages + result.ocr_pages}.`
      );
    } catch (cause) {
      setIndexMessage(cause instanceof Error ? cause.message : "No se pudo indexar el PDF.");
    } finally {
      setIndexing(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2" data-testid="pdf-full-document-viewer">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Página anterior" disabled={pageNumber <= 1 || !pageCount}
            onClick={() => navigate(pageNumber - 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 disabled:opacity-30">
            <ChevronLeft className="h-4 w-4"/>
          </button>
          <span aria-live="polite" className="min-w-20 text-center text-xs font-medium text-zinc-200">
            {pageCount ? `Página ${pageNumber} de ${pageCount}` : "Cargando PDF…"}
          </span>
          <button type="button" aria-label="Página siguiente" disabled={pageNumber >= pageCount || !pageCount}
            onClick={() => navigate(pageNumber + 1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 disabled:opacity-30">
            <ChevronRight className="h-4 w-4"/>
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          <a href={url} target="_blank" rel="noopener noreferrer"
            className="flex min-h-9 items-center gap-1 rounded-lg bg-zinc-900 px-2 text-xs text-zinc-200">
            <ExternalLink className="h-4 w-4"/> Abrir original
          </a>
          <button type="button" onClick={() => void downloadOriginal()}
            className="flex min-h-9 items-center gap-1 rounded-lg bg-zinc-900 px-2 text-xs text-zinc-200">
            <Download className="h-4 w-4"/> Descargar
          </button>
        </div>
      </div>
      {error && <p role="alert" className="shrink-0 text-xs text-amber-300">{error}</p>}
      <div ref={scrollRef} className="relative min-h-0 flex-1 overflow-auto overscroll-contain rounded-lg bg-zinc-950 touch-pan-y">
        {loading ? (
          <p className="flex h-full items-center justify-center gap-2 text-xs text-zinc-300">
            <Loader2 className="h-4 w-4 animate-spin"/> Abriendo el PDF original…
          </p>
        ) : pageCount ? (
          <div className="flex min-h-full justify-center px-2 py-2">
            <canvas ref={canvasRef} aria-label={`Página ${pageNumber} de ${pageCount} del PDF`}
              className={rendering ? "h-auto max-w-full opacity-60" : "h-auto max-w-full"}/>
          </div>
        ) : (
          <p className="p-4 text-center text-xs text-zinc-300">
            No se pudo cargar la vista previa. El archivo original sigue disponible.
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 text-xs text-zinc-400">
        <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5"/> El PDF original no se modifica</span>
        <button type="button" disabled={indexing} onClick={() => void indexPages()}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-zinc-200 disabled:opacity-50">
          {indexing ? <Loader2 className="h-4 w-4 animate-spin"/> : <RefreshCw className="h-4 w-4"/>}
          {indexing ? "Leyendo…" : "Leer todas las páginas"}
        </button>
      </div>
      {indexMessage && <p role="status" className="shrink-0 text-xs text-zinc-300">{indexMessage}</p>}
    </div>
  );
}

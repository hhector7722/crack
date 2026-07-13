"use client";

import { useEffect, useState } from "react";
import { X, Share, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "drop-install-hint-dismissed";

function isStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    nav.standalone === true
  );
}

export function DropInstallHint() {
  const [visible, setVisible] = useState(false);
  const [insideCrackApp, setInsideCrackApp] = useState(false);
  const [dropUrl, setDropUrl] = useState("");

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    const standalone = isStandaloneMode();
    setInsideCrackApp(standalone);
    setDropUrl(`${window.location.origin}/drop/`);
    setVisible(true);
  }, []);

  if (!visible) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setVisible(false);
  }

  async function copyUrl() {
    if (!dropUrl) return;
    try {
      await navigator.clipboard.writeText(dropUrl);
    } catch {
      /* clipboard puede fallar en contextos restringidos */
    }
  }

  return (
    <div
      className={cn(
        "shrink-0 border-b border-violet-500/30 bg-violet-950/40 px-4 py-3",
        insideCrackApp ? "border-amber-500/40 bg-amber-950/30" : ""
      )}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed text-zinc-300">
          {insideCrackApp ? (
            <>
              <p className="font-medium text-amber-200">
                Estás dentro de la app Crack
              </p>
              <p className="text-xs text-zinc-400">
                iOS no permite añadir Drop al inicio desde aquí. Abre{" "}
                <strong className="text-zinc-200">Safari</strong>, pega la URL de
                Drop, inicia sesión y entonces usa Compartir.
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-violet-200">
                Icono Drop en la pantalla de inicio
              </p>
              <p className="text-xs text-zinc-400">
                En Safari: pulsa <Share className="mx-0.5 inline h-3.5 w-3.5" />{" "}
                Compartir → <strong className="text-zinc-200">Añadir a pantalla de inicio</strong>.
                Debe aparecer el nombre <strong className="text-zinc-200">Drop</strong> con el rayo.
              </p>
            </>
          )}

          {dropUrl ? (
            <button
              type="button"
              onClick={() => void copyUrl()}
              className="action-ghost min-h-10 w-full justify-start gap-2 px-3 text-left text-xs text-zinc-400"
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              <span className="truncate">{dropUrl}</span>
            </button>
          ) : null}
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="action-ghost min-h-10 w-10 shrink-0 px-0"
          aria-label="Cerrar aviso"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

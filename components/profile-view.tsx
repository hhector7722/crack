"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { signOut } from "@/app/login/actions";
import {
  generateShareTokenAction,
  getShareTokenStatus,
  revokeShareTokenAction,
} from "@/app/(app)/profile/actions";

function getSiteUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://tu-dominio.vercel.app";
}

export function ProfileView() {
  const [hasToken, setHasToken] = useState(false);
  const [lastUsedAt, setLastUsedAt] = useState<string | null>(null);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"token" | "url" | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await getShareTokenStatus();
      setHasToken(status.hasToken);
      setLastUsedAt(status.lastUsedAt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setPlainToken(null);
    try {
      const { token } = await generateShareTokenAction();
      setPlainToken(token);
      setHasToken(true);
      setLastUsedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generando token");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke() {
    setBusy(true);
    setError(null);
    try {
      await revokeShareTokenAction();
      setHasToken(false);
      setPlainToken(null);
      setLastUsedAt(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error revocando token");
    } finally {
      setBusy(false);
    }
  }

  async function copyText(value: string, kind: "token" | "url") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  const apiUrl = `${getSiteUrl()}/api/drop`;

  return (
    <div className="content-list">
      <section className="py-4">
        <h2 className="text-sm font-semibold text-zinc-100">
          Enviar a Drop (Atajos iOS)
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Genera un token y configura un Atajo en iPhone para enviar texto
          temporal a Drop. Vive 48h y no se guarda en items.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-zinc-500">Cargando…</p>
        ) : (
          <div className="mt-4 space-y-3">
            {hasToken && !plainToken && (
              <p className="text-sm text-emerald-400/90">
                Token activo
                {lastUsedAt
                  ? ` · último uso ${new Date(lastUsedAt).toLocaleString("es-ES")}`
                  : ""}
              </p>
            )}

            {plainToken && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-amber-300">
                  Copia el token ahora. No se volverá a mostrar.
                </p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-900 px-3 py-2 text-xs text-zinc-200">
                    {plainToken}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyText(plainToken, "token")}
                    className="action-ghost min-h-12 w-12 shrink-0 px-0"
                    aria-label="Copiar token"
                  >
                    {copied === "token" ? (
                      <Check className="h-5 w-5 text-emerald-400" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleGenerate()}
                className="action-ghost min-h-12 gap-2 px-4"
              >
                <RefreshCw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} />
                {hasToken ? "Regenerar token" : "Generar token"}
              </button>

              {hasToken && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRevoke()}
                  className="action-accent min-h-12 gap-2 px-4"
                >
                  <Trash2 className="h-4 w-4" />
                  Revocar
                </button>
              )}
            </div>

            <div className="pt-2">
              <p className="text-xs text-zinc-500">URL de la API</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                  {apiUrl}
                </code>
                <button
                  type="button"
                  onClick={() => void copyText(apiUrl, "url")}
                  className="action-ghost min-h-10 w-10 shrink-0 px-0"
                  aria-label="Copiar URL API"
                >
                  {copied === "url" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <details className="pt-2 text-sm text-zinc-400">
              <summary className="cursor-pointer font-medium text-zinc-300">
                Atajo iPhone (POST con JSON)
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-emerald-300/90">
                Compartir → Obtener texto de entrada → enviar a Drop.
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-xs leading-relaxed">
                <li>Activa Mostrar en la hoja para compartir.</li>
                <li>Configura la entrada para recibir Texto y URLs.</li>
                <li>Obtener texto de entrada.</li>
                <li>Diccionario → content: variable del texto.</li>
                <li>
                  Obtener contenido de URL →{" "}
                  <span className="text-zinc-300">
                    POST {apiUrl}
                  </span>
                </li>
                <li>Cabecera Authorization: Bearer {plainToken ?? "TU_TOKEN"}.</li>
                <li>Cabecera Content-Type: application/json.</li>
                <li>Cuerpo de solicitud: JSON → diccionario.</li>
                <li>Si ok es true, mostrar confirmación: Drop enviado.</li>
              </ol>
              <p className="mt-3 text-xs text-zinc-500">
                No uses GET ni query params. Guía completa: docs/ios-shortcuts.md
              </p>
            </details>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      </section>

      <form action={signOut}>
        <button
          type="submit"
          className="content-row w-full text-left text-sm font-semibold text-red-400 active:opacity-70"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

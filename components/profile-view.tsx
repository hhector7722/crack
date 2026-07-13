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

type CopiedKind = "token" | "shareLinkUrl" | "dropUrl" | "dropPageUrl";

export function ProfileView() {
  const [hasToken, setHasToken] = useState(false);
  const [lastUsedAt, setLastUsedAt] = useState<string | null>(null);
  const [plainToken, setPlainToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopiedKind | null>(null);

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

  async function copyText(value: string, kind: CopiedKind) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles");
    }
  }

  const siteUrl = getSiteUrl();
  const shareLinkApiUrl = `${siteUrl}/api/share-link`;
  const dropApiUrl = `${siteUrl}/api/drop`;
  const dropPageUrl = `${siteUrl}/drop/`;

  return (
    <div className="content-list">
      <section className="py-4">
        <h2 className="text-sm font-semibold text-zinc-100">Atajos iOS</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Un solo token sirve para dos atajos distintos: guardar enlaces en la
          app de forma permanente, o enviar contenido temporal al chat de Drop
          (48 h). Guía escrita para <strong className="text-zinc-300">iOS 26.5</strong>.
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

            <div className="space-y-3 pt-2">
              <div>
                <p className="text-xs text-zinc-500">Guardar enlace (permanente)</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                    {shareLinkApiUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyText(shareLinkApiUrl, "shareLinkUrl")}
                    className="action-ghost min-h-10 w-10 shrink-0 px-0"
                    aria-label="Copiar URL guardar enlace"
                  >
                    {copied === "shareLinkUrl" ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Enviar a Drop (48 h)</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                    {dropApiUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyText(dropApiUrl, "dropUrl")}
                    className="action-ghost min-h-10 w-10 shrink-0 px-0"
                    aria-label="Copiar URL Drop"
                  >
                    {copied === "dropUrl" ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <details className="pt-2 text-sm text-zinc-400">
              <summary className="cursor-pointer font-medium text-zinc-300">
                Icono Drop en pantalla de inicio
              </summary>
              <ol className="mt-3 list-decimal space-y-2 pl-4 text-xs leading-relaxed text-zinc-400">
                <li>
                  Abre <strong className="text-zinc-300">Safari</strong> (no la app
                  Crack del inicio).
                </li>
                <li>
                  Visita la URL de Drop, inicia sesión si hace falta.
                </li>
                <li>
                  Compartir → <strong className="text-zinc-300">Añadir a pantalla de inicio</strong>.
                  Debe salir el nombre <strong className="text-zinc-300">Drop</strong>.
                </li>
              </ol>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate text-xs text-zinc-400">
                  {dropPageUrl}
                </code>
                <button
                  type="button"
                  onClick={() => void copyText(dropPageUrl, "dropPageUrl")}
                  className="action-ghost min-h-10 w-10 shrink-0 px-0"
                  aria-label="Copiar URL página Drop"
                >
                  {copied === "dropPageUrl" ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Si ya tienes Crack en el inicio y Safari no muestra la opción,
                copia la URL arriba y ábrela en Safari en una pestaña nueva.
              </p>
            </details>

            <details className="pt-2 text-sm text-zinc-400">
              <summary className="cursor-pointer font-medium text-zinc-300">
                Atajo 1 — Guardar enlace en Crack
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                Guía completa en docs/atajos-ios-crack.pdf (iOS 26.5, 58 pasos).
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Orden de bloques: entrada con Texto y Direcciones URL, Obtener
                texto de la entrada del atajo, Diccionario, Obtener contenido de
                URL, Obtener diccionario de la entrada, Si.
              </p>
            </details>

            <details className="pt-2 text-sm text-zinc-400">
              <summary className="cursor-pointer font-medium text-zinc-300">
                Atajo 2 — Enviar a Drop
              </summary>
              <p className="mt-3 text-xs leading-relaxed text-zinc-400">
                Igual que el Atajo 1. Cambia el nombre, el Diccionario, la URL y
                el mensaje de notificación. Ver PDF.
              </p>
            </details>

            <p className="pt-2 text-xs text-zinc-500">
              Abre docs/atajos-ios-crack.pdf en el iPhone.
            </p>
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

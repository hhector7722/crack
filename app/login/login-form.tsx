"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient, getSupabaseConfigError } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/env";
import { validateOwnerEmail } from "./actions";

const COOLDOWN_KEY = "crack-magic-link-cooldown";
const PENDING_EMAIL_KEY = "crack-pending-email";
const COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 8;

function getCooldownRemaining(): number {
  if (typeof window === "undefined") return 0;
  const until = Number(localStorage.getItem(COOLDOWN_KEY) ?? 0);
  return Math.max(0, Math.ceil((until - Date.now()) / 1000));
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authErrorParam = searchParams.get("error");
  const configError = getSupabaseConfigError();

  const pendingOnMount =
    typeof window !== "undefined" ? sessionStorage.getItem(PENDING_EMAIL_KEY) : null;

  const [email, setEmail] = useState(pendingOnMount ?? "");
  const [ownerEmail, setOwnerEmail] = useState<string | null>(pendingOnMount);
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(!!pendingOnMount);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(
    pendingOnMount ? "Introduce el código que recibiste por email." : null
  );
  const [error, setError] = useState<string | null>(() => {
    if (configError) return configError;
    if (authErrorParam) {
      const decoded = decodeURIComponent(authErrorParam);
      return decoded === "auth"
        ? "Enlace inválido o expirado. Introduce el código del email abajo."
        : mapAuthError(decoded);
    }
    return null;
  });
  const [cooldown, setCooldown] = useState(getCooldownRemaining);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(getCooldownRemaining());
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();

    const configErr = getSupabaseConfigError();
    if (configErr) {
      setError(configErr);
      return;
    }

    const remaining = getCooldownRemaining();
    if (remaining > 0) {
      setError(`Espera ${remaining}s antes de pedir otro código.`);
      setCooldown(remaining);
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const validation = await validateOwnerEmail(email);
      if (validation.error) {
        setError(validation.error);
        return;
      }

      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/confirm`;

      const { error: authError } = await supabase.auth.signInWithOtp({
        email: validation.email!,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (authError) {
        setError(mapAuthError(authError.message));
      } else {
        setOwnerEmail(validation.email!);
        sessionStorage.setItem(PENDING_EMAIL_KEY, validation.email!);
        setShowOtp(true);
        localStorage.setItem(
          COOLDOWN_KEY,
          String(Date.now() + COOLDOWN_SECONDS * 1000)
        );
        setCooldown(COOLDOWN_SECONDS);
        setMessage(
          "Revisa tu email e introduce el código abajo (8 dígitos)."
        );
      }
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!ownerEmail || otp.length < 6) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.verifyOtp({
        email: ownerEmail,
        token: otp.trim(),
        type: "email",
      });

      if (authError) {
        setError(mapAuthError(authError.message));
      } else {
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
        router.replace("/");
        router.refresh();
      }
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Error"));
    } finally {
      setLoading(false);
    }
  }

  const disabled = loading || cooldown > 0 || !!configError;

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-[430px]">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">
            Crack
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Asistente personal de bolsillo
          </p>
        </div>

        <form onSubmit={handleSendLink} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-zinc-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="tu@email.com"
              className="input-float"
            />
          </div>

          <button
            type="submit"
            disabled={disabled}
            className="h-12 w-full rounded-xl bg-zinc-100 font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {loading && !showOtp
              ? "Enviando..."
              : cooldown > 0
                ? `Espera ${cooldown}s`
                : "Enviar código"}
          </button>
        </form>

        {showOtp && (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4 border-t border-zinc-800 pt-6">
            <p className="text-sm text-zinc-400">
              Código enviado a{" "}
              <span className="text-zinc-200">{ownerEmail}</span>
            </p>

            <div>
              <label
                htmlFor="otp"
                className="mb-2 block text-sm font-medium text-zinc-300"
              >
                Código del email
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))
                }
                required
                maxLength={OTP_LENGTH}
                placeholder="23796463"
                className="input-otp"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="h-12 w-full rounded-xl bg-emerald-500 font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Entrar con código"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-300">{error}</p>
        )}

        {message && (
          <p className="mt-4 text-sm text-emerald-300">{message}</p>
        )}
      </div>
    </div>
  );
}

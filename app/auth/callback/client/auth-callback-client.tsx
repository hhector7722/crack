"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/env";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const [error, setError] = useState<string | null>(
    code ? null : "Enlace inválido."
  );

  useEffect(() => {
    if (!code) return;

    async function exchange() {
      try {
        const supabase = createClient();
        const { error: authError } =
          await supabase.auth.exchangeCodeForSession(code!);

        if (authError) {
          setError(mapAuthError(authError.message));
          return;
        }

        router.replace(next);
      } catch (err) {
        setError(
          mapAuthError(err instanceof Error ? err.message : "Error de auth")
        );
      }
    }

    void exchange();
  }, [code, next, router]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-950 px-6 text-center">
        <p className="mb-4 text-sm text-red-300">{error}</p>
        <p className="mb-6 text-sm text-zinc-400">
          Usa el código de 6 dígitos del email en la pantalla de login.
        </p>
        <a
          href="/login"
          className="rounded-xl bg-zinc-100 px-6 py-3 text-sm font-semibold text-zinc-950"
        >
          Volver al login
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
    </div>
  );
}

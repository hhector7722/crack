"use client";

import { useState } from "react";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const result = await sendMagicLink(email);

    if (result.error) {
      setError(result.error);
    } else {
      setMessage("Revisa tu email. Te hemos enviado un enlace mágico.");
    }

    setLoading(false);
  }

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

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-zinc-100 font-semibold text-zinc-950 transition-colors hover:bg-white disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar enlace mágico"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {message && (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}

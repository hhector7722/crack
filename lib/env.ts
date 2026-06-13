function trimEnv(value: string | undefined): string {
  return value?.trim() ?? "";
}

export function getSupabasePublicConfig() {
  const url = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = trimEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    return {
      ok: false as const,
      error:
        "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Configúralas en .env.local (local) o en Vercel → Settings → Environment Variables (producción).",
    };
  }

  if (!url.startsWith("https://") || !url.includes(".supabase.co")) {
    return {
      ok: false as const,
      error: `NEXT_PUBLIC_SUPABASE_URL inválida: "${url}". Debe ser https://TU-REF.supabase.co`,
    };
  }

  return { ok: true as const, url, anonKey };
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return "Límite de emails alcanzado. Supabase permite pocos magic links por hora en el plan gratuito. Espera 30–60 min o configura SMTP propio en Supabase → Project Settings → Authentication → SMTP.";
  }

  if (lower.includes("fetch failed") || lower.includes("network")) {
    return "No se pudo conectar con Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en Vercel, que el proyecto no esté pausado, y vuelve a desplegar.";
  }

  if (lower.includes("pkce") || lower.includes("code verifier")) {
    return "El enlace no pudo verificarse. Introduce el código de 6 dígitos del email en la pantalla de login.";
  }

  if (lower.includes("redirect") || lower.includes("redirect_uri")) {
    return "URL de redirección no permitida. Añade https://TU-DOMINIO/auth/callback en Supabase → Authentication → URL Configuration.";
  }

  return message;
}

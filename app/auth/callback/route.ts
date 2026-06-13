import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/env";

function getSiteOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  const siteOrigin = getSiteOrigin(request);
  const config = getSupabasePublicConfig();

  if (!config.ok) {
    return NextResponse.redirect(
      `${siteOrigin}/login?error=${encodeURIComponent(config.error)}`
    );
  }

  const redirectPath = next.startsWith("/") ? next : "/";
  const redirectUrl = `${siteOrigin}${redirectPath}`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(
          ({
            name,
            value,
            options,
          }: {
            name: string;
            value: string;
            options: CookieOptions;
          }) => {
            response.cookies.set(name, value, options);
          }
        );
      },
    },
  });

  // token_hash: funciona sin PKCE (ideal iPhone / Mail)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (error) {
      console.error("[auth/callback] verifyOtp", error.message);
      return NextResponse.redirect(
        `${siteOrigin}/login?error=${encodeURIComponent(error.message)}`
      );
    }

    return response;
  }

  // code: requiere PKCE en el mismo navegador
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback] exchangeCode", error.message);
      // Fallback: intentar en el cliente (mismo browser con cookies PKCE)
      const clientUrl = new URL("/auth/callback/client", siteOrigin);
      clientUrl.searchParams.set("code", code);
      clientUrl.searchParams.set("next", redirectPath);
      return NextResponse.redirect(clientUrl.toString());
    }

    return response;
  }

  return NextResponse.redirect(`${siteOrigin}/login?error=auth`);
}

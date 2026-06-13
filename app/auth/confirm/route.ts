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

function createAuthResponse(
  request: NextRequest,
  config: { url: string; anonKey: string },
  redirectPath: string
) {
  const siteOrigin = getSiteOrigin(request);
  const redirectUrl = `${siteOrigin}${redirectPath.startsWith("/") ? redirectPath : "/"}`;
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

  return { supabase, response, siteOrigin };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
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

  if (!tokenHash || !type) {
    return NextResponse.redirect(`${siteOrigin}/login?error=auth`);
  }

  const { supabase, response, siteOrigin: origin } = createAuthResponse(
    request,
    config,
    next
  );

  const { error } = await supabase.auth.verifyOtp({
    type,
    token_hash: tokenHash,
  });

  if (error) {
    console.error("[auth/confirm]", error.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return response;
}

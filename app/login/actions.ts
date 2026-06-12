"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerEmail, isOwnerEmail } from "@/lib/auth";

export async function sendMagicLink(email: string) {
  if (!isOwnerEmail(email)) {
    return { error: "Acceso denegado. Este email no está autorizado." };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: getOwnerEmail(),
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getOwnerEmailPublic(): Promise<string | null> {
  try {
    return getOwnerEmail();
  } catch {
    return null;
  }
}

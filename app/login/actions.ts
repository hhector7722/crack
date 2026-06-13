"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnerEmail, isOwnerEmail } from "@/lib/auth";

export async function validateOwnerEmail(email: string) {
  if (!isOwnerEmail(email)) {
    return { error: "Acceso denegado. Este email no está autorizado." };
  }

  return { email: getOwnerEmail() };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

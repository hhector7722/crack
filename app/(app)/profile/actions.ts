"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareToken, hashShareToken } from "@/lib/share-token";

export async function getShareTokenStatus(): Promise<{
  hasToken: boolean;
  lastUsedAt: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { data, error } = await supabase
    .from("share_tokens")
    .select("last_used_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return {
    hasToken: !!data,
    lastUsedAt: data?.last_used_at ?? null,
  };
}

export async function generateShareTokenAction(): Promise<{ token: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);

  const { error: deleteError } = await supabase
    .from("share_tokens")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  const { error: insertError } = await supabase.from("share_tokens").insert({
    user_id: user.id,
    token_hash: tokenHash,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return { token };
}

export async function revokeShareTokenAction(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No autenticado");
  }

  const { error } = await supabase
    .from("share_tokens")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}

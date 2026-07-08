import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DropClient, type Drop } from "./drop-client";

export default async function DropPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/drop");
  }

  const { data, error } = await supabase
    .from("drops")
    .select("id, content, file_url, user_id, created_at, expires_at")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DropClient
      initialDrops={(data ?? []) as Drop[]}
      userId={user.id}
    />
  );
}

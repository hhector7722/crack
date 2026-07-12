import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DropPage, type Drop } from "@/components/drop/DropPage";

export default async function DropWidgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/drop/widget");
  }

  const { data, error } = await supabase
    .from("drops")
    .select("id, content, user_id, created_at, expires_at, attachments:drop_attachments(*)")
    .eq("user_id", user.id)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <DropPage
      initialDrops={(data ?? []) as Drop[]}
      userId={user.id}
      showHeader={false}
    />
  );
}

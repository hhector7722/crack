import { redirect } from "next/navigation";
import { saveSharedLink } from "@/lib/share-link-save";
import { createClient } from "@/lib/supabase/server";

interface SharePageProps {
  searchParams: Promise<{
    url?: string;
    text?: string;
    title?: string;
  }>;
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const query = new URLSearchParams();
  if (params.url) query.set("url", params.url);
  if (params.text) query.set("text", params.text);
  if (params.title) query.set("title", params.title);

  const returnPath = query.toString() ? `/share?${query.toString()}` : "/share";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }

  try {
    await saveSharedLink(supabase, user.id, params);
  } catch {
    redirect("/notes");
  }

  redirect("/notes");
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getQueryEmbedding } from "@/lib/embedding";
import type { SearchResultItem, SearchSource } from "@/lib/types";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const semantic = searchParams.get("semantic") === "true";

  if (!q || q.length === 0) {
    return NextResponse.json({ error: "q requerido" }, { status: 400 });
  }

  if (q.length > 200) {
    return NextResponse.json({ error: "Consulta demasiado larga" }, { status: 400 });
  }

  try {
    let embedding: number[] | null = null;
    let searchSource: SearchSource = "fts";

    if (semantic) {
      try {
        embedding = await getQueryEmbedding(q);
        searchSource = "hybrid";
      } catch {
        embedding = null;
        searchSource = "fts";
      }
    }

    type SearchRow = {
      id: string;
      type: string;
      title: string | null;
      content: string | null;
      file_url: string | null;
      metadata: Record<string, unknown>;
      pinned: boolean;
      created_at: string;
      user_id: string;
      score: number;
      search_source: string;
    };

    let results: SearchRow[] = [];

    if (embedding) {
      const { data, error } = await supabase.rpc("search_items_v1", {
        p_user_id: user.id,
        p_query: q,
        p_embedding: embedding,
        p_limit: 25,
        p_rrf_k: 60,
      });
      if (error) throw error;
      results = (data ?? []) as SearchRow[];
    } else {
      const { data, error } = await supabase.rpc("search_items_v1", {
        p_user_id: user.id,
        p_query: q,
        p_limit: 25,
        p_rrf_k: 60,
      });
      if (error) throw error;
      results = (data ?? []) as SearchRow[];
    }

    const items: SearchResultItem[] = results.map((r) => ({
      id: r.id,
      type: r.type as SearchResultItem["type"],
      title: r.title,
      content: r.content,
      file_url: r.file_url,
      metadata: r.metadata as SearchResultItem["metadata"],
      pinned: r.pinned,
      created_at: r.created_at,
      user_id: r.user_id,
      score: r.score,
      search_source: (r.search_source as SearchResultItem["search_source"]) || searchSource,
    }));

    return NextResponse.json({
      results: items,
      search_source: searchSource,
      query: q,
    });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json(
      { error: "Error en la búsqueda" },
      { status: 500 }
    );
  }
}

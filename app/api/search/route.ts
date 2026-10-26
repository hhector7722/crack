import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { embeddingsConfigured, getQueryEmbedding } from "@/lib/embedding";
import type { SearchResultItem, SearchSource } from "@/lib/types";

type SearchRow = {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  file_url: string | null;
  metadata: SearchResultItem["metadata"];
  pinned: boolean;
  created_at: string;
  user_id: string;
  score?: number;
  search_source?: string;
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const semantic = searchParams.get("semantic") === "true";
  if (!q) return NextResponse.json({ error: "q requerido" }, { status: 400 });
  if (q.length > 200) return NextResponse.json({ error: "Consulta demasiado larga" }, { status: 400 });

  try {
    let embedding: number[] | null = null;
    let searchSource: SearchSource = "fts";
    if (semantic && embeddingsConfigured()) {
      try {
        embedding = await getQueryEmbedding(q);
        searchSource = "hybrid";
      } catch {
        searchSource = "fts";
      }
    }

    // FTS encuentra palabras completas, pero no siempre prefijos ("crimi").
    // La coincidencia por título es literal y parcial; incluye títulos editados.
    const escaped = q.replace(/[\\%_]/g, "\\$&");
    const [titleMatches, fullText] = await Promise.all([
      supabase
        .from("items")
        .select("id,type,title,content,file_url,metadata,pinned,created_at,user_id")
        .eq("user_id", user.id)
        .ilike("title", "%" + escaped + "%")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase.rpc("search_knowledge_v1", {
        p_query: q,
        p_embedding: embedding,
        p_limit: 100,
      }),
    ]);

    if (titleMatches.error) throw titleMatches.error;
    if (fullText.error) throw fullText.error;

    const results: SearchResultItem[] = [];
    const seen = new Set<string>();
    function add(row: SearchRow, score: number, source: SearchSource) {
      if (row.metadata?.extra === true || seen.has(row.id) || results.length >= 25) return;
      seen.add(row.id);
      results.push({
        id: row.id,
        type: row.type as SearchResultItem["type"],
        title: row.title,
        content: row.content,
        file_url: row.file_url,
        metadata: row.metadata ?? {},
        pinned: row.pinned,
        pinned_order: null,
        created_at: row.created_at,
        last_opened_at: null,
        user_id: row.user_id,
        score,
        search_source: source,
      });
    }

    for (const row of (titleMatches.data ?? []) as SearchRow[]) {
      add(row, 2, "fts");
    }
    for (const row of (fullText.data ?? []) as SearchRow[]) {
      add(row, row.score ?? 0, (row.search_source as SearchSource) || searchSource);
    }

    return NextResponse.json({
      results,
      search_source: searchSource,
      query: q,
    });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ error: "Error en la búsqueda" }, { status: 500 });
  }
}

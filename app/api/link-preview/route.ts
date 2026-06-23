import { NextResponse } from "next/server";
import { fetchLinkPreview } from "@/lib/link-preview";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  const preview = await fetchLinkPreview(url);

  return NextResponse.json(preview);
}

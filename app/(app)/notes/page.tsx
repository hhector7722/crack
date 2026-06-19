"use client";

import { NoteList } from "@/components/note-list";
import { useRefreshKey } from "../layout";

export default function NotesPage() {
  const refreshKey = useRefreshKey();

  return <NoteList refreshKey={refreshKey} />;
}

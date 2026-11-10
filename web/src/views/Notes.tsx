import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Plus, Trash2 } from "lucide-react";
import { api, type Note } from "@/lib/api";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Empty, PageHeader } from "./Header";

const ago = (t: number) =>
  new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function Notes() {
  const { notes, loadNotes } = useStore();
  const [sel, setSel] = useState<string | null>(null);
  const [draft, setDraft] = useState<Note | null>(null);
  const timer = useRef<number>(0);

  useEffect(() => {
    loadNotes().then(() => {
      const id = sessionStorage.getItem("mb_note");
      if (id) {
        sessionStorage.removeItem("mb_note");
        setSel(id);
      }
    });
  }, [loadNotes]);
  useEffect(() => {
    setDraft(notes.find((n) => n.id === sel) ?? null);
  }, [sel, notes]);

  const create = async () => {
    const { id } = await api.saveNote({ title: "", body: "" });
    await loadNotes();
    setSel(id);
  };
  const edit = (patch: Partial<Note>) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      await api.saveNote(next);
      loadNotes();
    }, 700);
  };

  return (
    <>
      <PageHeader
        title="Notes"
        subtitle="Plain-text notes that sync everywhere and show up in search."
        icon={<FileText className="size-5 text-muted" />}
        actions={
          <Button variant="outline" size="sm" onClick={create}>
            <Plus />
            New note
          </Button>
        }
      />
      {notes.length === 0 && !draft ? (
        <Empty
          title="No notes yet"
          body="Jot something down. Notes are searchable alongside your bookmarks."
        >
          {
            <Button variant="accent" onClick={create}>
              <Plus />
              Write a note
            </Button>
          }
        </Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-[280px_1fr]">
          <div className={cn("space-y-1.5", draft && "hidden md:block")}>
            {notes.map((n) => (
              <button
                key={n.id}
                onClick={() => setSel(n.id)}
                className={cn(
                  "block w-full rounded-xl border border-line bg-surface p-3 text-left transition-colors hover:border-line-strong",
                  sel === n.id && "border-accent/50 bg-elevated",
                )}
              >
                <p className="truncate text-sm font-medium">
                  {n.title || "Untitled"}
                </p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                  {n.body || "Empty note"}
                </p>
                <p className="mt-1.5 text-[11px] text-subtle">
                  {ago(n.updated_at)}
                </p>
              </button>
            ))}
          </div>
          {draft ? (
            <div className="rounded-2xl border border-line bg-surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Back"
                  onClick={() => setSel(null)}
                >
                  <ArrowLeft />
                </Button>
                <input
                  value={draft.title}
                  onChange={(e) => edit({ title: e.target.value })}
                  placeholder="Title"
                  className="min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-subtle"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Delete note"
                  onClick={async () => {
                    await api.deleteNote(draft.id);
                    setSel(null);
                    loadNotes();
                  }}
                >
                  <Trash2 />
                </Button>
              </div>
              <textarea
                value={draft.body}
                onChange={(e) => edit({ body: e.target.value })}
                placeholder="Start writing…"
                className="min-h-[50vh] w-full resize-none bg-transparent font-mono text-[13.5px] leading-relaxed outline-none placeholder:text-subtle"
              />
            </div>
          ) : (
            <div className="hidden place-items-center rounded-2xl border border-dashed border-line-strong text-sm text-subtle md:grid">
              Select a note
            </div>
          )}
        </div>
      )}
    </>
  );
}

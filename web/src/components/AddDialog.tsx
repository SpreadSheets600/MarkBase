import { useEffect, useState } from "react";
import { Link2, Loader2, Plus, Type } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { hue } from "./FolderIcon";

const DEFAULT = "Bookmarks bar";

export function AddDialog({
  open,
  onOpenChange,
  folder = "",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  folder?: string;
}) {
  const { add, folders } = useStore();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [col, setCol] = useState(folder || DEFAULT);
  const [creating, setCreating] = useState(false);
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = /^https?:\/\/\S+\.\S+/.test(url.trim());
  const names = [
    DEFAULT,
    ...folders.map((f) => f.name).filter((n) => n !== DEFAULT),
  ];

  useEffect(() => {
    if (open) {
      setCol(folder || DEFAULT);
      setCreating(false);
      setCustom("");
    }
  }, [open, folder]);

  useEffect(() => {
    if (!open || url) return;
    navigator.clipboard
      ?.readText()
      .then((t) => {
        if (/^https?:\/\/\S+$/.test(t.trim())) setUrl(t.trim());
      })
      .catch(() => {});
  }, [open]);

  const chip = (on: boolean) =>
    cn(
      "inline-flex h-9 shrink-0 items-center gap-2 rounded-[11px] border px-3 text-[13px] transition-colors",
      on
        ? "border-accent/60 bg-accent/15 text-fg"
        : "border-line text-muted hover:text-fg",
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="New bookmark"
        description="Saved to your library and synced everywhere."
      >
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await add(
                url.trim(),
                title.trim(),
                creating && custom.trim() ? custom.trim() : col,
              );
              setUrl("");
              setTitle("");
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              autoFocus
              className="pl-9"
              placeholder="Paste a link"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="URL"
            />
          </div>
          <div className="relative">
            <Type className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
            <Input
              className="pl-9"
              placeholder="Title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Title"
            />
          </div>

          <p className="pt-2 text-[11px] font-medium uppercase tracking-widest text-subtle">
            Collection
          </p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {names.map((n) => (
              <button
                type="button"
                key={n}
                onClick={() => {
                  setCol(n);
                  setCreating(false);
                }}
                className={chip(!creating && col === n)}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ background: `hsl(${hue(n)} 80% 62%)` }}
                />
                {n.split(" / ").pop()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCreating(true)}
              className={chip(creating)}
            >
              <Plus className="size-3.5" />
              New
            </button>
          </div>
          {creating && (
            <Input
              autoFocus
              placeholder="Collection name"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              aria-label="New collection"
            />
          )}

          <Button
            type="submit"
            variant="accent"
            className="mt-2 h-11 w-full text-[14px]"
            disabled={!valid || busy}
          >
            {busy ? <Loader2 className="animate-spin" /> : null}
            {busy ? "Saving…" : "Save bookmark"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

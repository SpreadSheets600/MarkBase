import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FolderInput, Plus, Trash2, X } from "lucide-react";
import { useSelection } from "@/lib/select";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FolderIcon } from "./FolderIcon";

export function SelectionBar() {
  const sel = useSelection();
  const { move, trash, folders } = useStore();
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const n = sel.ids.size;
  const ids = [...sel.ids];
  const shown = folders.filter((f) =>
    f.name.toLowerCase().includes(q.trim().toLowerCase()),
  );
  const exact = folders.some(
    (f) => f.name.toLowerCase() === q.trim().toLowerCase(),
  );
  const go = (name: string) => {
    setPicking(false);
    setQ("");
    sel.clear();
    move(ids, name);
  };

  return (
    <>
      <AnimatePresence>
        {n > 0 && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="fixed inset-x-0 bottom-5 z-30 flex justify-center px-4"
          >
            <div
              role="toolbar"
              aria-label="Selection actions"
              className="flex items-center gap-1.5 rounded-2xl border border-line-strong bg-elevated/95 p-1.5 pl-4 shadow-2xl shadow-black/60 backdrop-blur-xl"
            >
              <span className="mr-2 text-sm">
                <b className="font-semibold">{n}</b>{" "}
                <span className="text-muted">selected</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPicking(true)}
              >
                <FolderInput />
                Move to…
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:text-red-300"
                onClick={() => {
                  const list = ids;
                  sel.clear();
                  trash(list);
                }}
              >
                <Trash2 />
                Trash
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="Clear selection"
                onClick={sel.clear}
              >
                <X />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={picking} onOpenChange={setPicking}>
        <DialogContent
          title={`Move ${n} bookmark${n === 1 ? "" : "s"}`}
          description="Pick a collection, or type a name to create a new one."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) go(shown[0]?.name ?? q.trim());
            }}
          >
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search or create a collection"
              aria-label="Collection"
            />
          </form>
          <div className="mt-3 max-h-64 space-y-0.5 overflow-y-auto">
            {shown.map((f) => (
              <button
                key={f.name}
                onClick={() => go(f.name)}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-muted transition-colors hover:bg-white/[0.06] hover:text-fg"
              >
                <FolderIcon name={f.name} className="h-4 w-5 shrink-0" />
                <span className="truncate">{f.short}</span>
                <span className="ml-auto font-mono text-xs text-subtle">
                  {f.count}
                </span>
              </button>
            ))}
            {q.trim() && !exact && (
              <button
                onClick={() => go(q.trim())}
                className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-fg transition-colors hover:bg-white/[0.06]"
              >
                <Plus className="size-4 text-accent-soft" />
                Create “{q.trim()}”
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

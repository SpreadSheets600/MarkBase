import { Folder } from "lucide-react";
import { useDropTarget } from "@/lib/select";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { FolderIcon } from "@/components/FolderIcon";
import { BlurFade } from "@/components/magic/blur-fade";
import { Empty, PageHeader } from "./Header";
import type { Route } from "@/lib/route";

function Tile({ f, go }: { f: { name: string; short: string; count: number }; go: (r: Route) => void }) {
  const { move } = useStore();
  const drop = useDropTarget((ids) => move(ids, f.name));
  return (
    <button {...drop.props} onClick={() => go({ k: "folder", name: f.name })}
      className={cn("group block w-full rounded-2xl p-1 text-left transition-colors", drop.over && "bg-accent/15 ring-2 ring-accent")}>
      <FolderIcon name={f.name} className="w-full drop-shadow-[0_14px_20px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-1" />
      <div className="mt-2 flex items-baseline justify-between gap-2 px-1">
        <span className="truncate text-sm font-medium">{f.short}</span>
        <span className="font-mono text-xs text-subtle">{f.count}</span>
      </div>
    </button>
  );
}

export function Collections({ go, onAdd }: { go: (r: Route) => void; onAdd: () => void }) {
  const { folders } = useStore();
  return (
    <>
      <PageHeader title="Collections" subtitle={`${folders.length} collection${folders.length === 1 ? "" : "s"}`} icon={<Folder className="size-5 text-muted" />} onAdd={onAdd} />
      {folders.length === 0 ? <Empty title="No collections yet" body="Folders from your browser bookmarks show up here after the first sync." /> : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {folders.map((f, i) => (
            <BlurFade key={f.name} delay={Math.min(i, 16) * 0.025}>
              <Tile f={f} go={go} />
            </BlurFade>
          ))}
        </div>
      )}
    </>
  );
}

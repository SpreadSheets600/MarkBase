import { useState } from "react";
import * as M from "@radix-ui/react-dropdown-menu";
import {
  Check as Check_,
  Copy,
  ExternalLink,
  FolderInput,
  Link2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { folderShort, type Bookmark } from "@/lib/api";
import { faviconOf, hostOf, cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { startDrag, useSelection } from "@/lib/select";
import { hue } from "./FolderIcon";

export function Thumb({ b, className }: { b: Bookmark; className?: string }) {
  const [bad, setBad] = useState(false);
  const host = hostOf(b.url);
  const h = hue(host);
  return (
    <div className={cn("relative overflow-hidden bg-bg", className)}>
      {b.image && !bad ? (
        <img
          src={b.image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBad(true)}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          className="grid size-full place-items-center"
          style={{
            background: `radial-gradient(120% 120% at 20% 0%, hsl(${h} 60% 40% / .35), transparent 60%), #0c0c10`,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <img src={faviconOf(b.url)} alt="" className="size-8 rounded-md" />
            <span className="max-w-[80%] truncate font-mono text-[11px] text-white/50">
              {host}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

const item =
  "flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-muted outline-none data-[highlighted]:bg-white/[0.07] data-[highlighted]:text-fg";

export function CardMenu({ b }: { b: Bookmark }) {
  const { folders, trash, move } = useStore();
  return (
    <M.Root>
      <M.Trigger
        aria-label="Bookmark actions"
        className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-bg text-muted transition-colors hover:border-line-strong hover:text-fg data-[state=open]:text-fg"
      >
        <MoreHorizontal className="size-4" />
      </M.Trigger>
      <M.Portal>
        <M.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[200px] rounded-xl border border-line-strong bg-surface p-1.5 shadow-2xl shadow-black/60"
        >
          <M.Item
            className={item}
            onSelect={() => window.open(b.url, "_blank", "noopener")}
          >
            <ExternalLink className="size-4" />
            Open in new tab
          </M.Item>
          <M.Item
            className={item}
            onSelect={() => {
              navigator.clipboard?.writeText(b.url);
              toast.success("Link copied");
            }}
          >
            <Copy className="size-4" />
            Copy link
          </M.Item>
          <M.Sub>
            <M.SubTrigger className={item}>
              <FolderInput className="size-4" />
              Move to collection
            </M.SubTrigger>
            <M.Portal>
              <M.SubContent
                sideOffset={8}
                className="z-50 max-h-72 min-w-[180px] overflow-y-auto rounded-xl border border-line-strong bg-surface p-1.5 shadow-2xl shadow-black/60"
              >
                {folders.map((f) => (
                  <M.Item
                    key={f.name}
                    className={cn(
                      item,
                      f.name === b.folder_path && "opacity-40",
                    )}
                    onSelect={() => move([b.id], f.name)}
                  >
                    {f.short}
                  </M.Item>
                ))}
              </M.SubContent>
            </M.Portal>
          </M.Sub>
          <M.Separator className="my-1 h-px bg-line" />
          <M.Item
            className={cn(item, "data-[highlighted]:text-red-300")}
            onSelect={() => trash([b.id])}
          >
            <Trash2 className="size-4" />
            Move to trash
          </M.Item>
        </M.Content>
      </M.Portal>
    </M.Root>
  );
}

function Check({
  on,
  show,
  onClick,
}: {
  on: boolean;
  show: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={on ? "Deselect bookmark" : "Select bookmark"}
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "absolute left-2 top-2 z-10 grid size-6 place-items-center rounded-md border backdrop-blur transition-all",
        on
          ? "border-accent bg-accent text-white"
          : "border-white/25 bg-black/50 text-transparent hover:border-white/60",
        show || on
          ? "opacity-100"
          : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Check_ className="size-3.5" strokeWidth={3} />
    </button>
  );
}

export function BookmarkCard({ b, order }: { b: Bookmark; order: string[] }) {
  const host = hostOf(b.url);
  const sel = useSelection();
  const picked = sel.ids.has(b.id);
  const activate = (e: React.MouseEvent) => {
    if (sel.on) {
      e.preventDefault();
      sel.toggle(b.id, order, e.shiftKey);
    }
  };
  return (
    <article
      draggable
      onDragStart={(e) => startDrag(e, sel.dragIds(b.id), b.title || host)}
      className={cn(
        "group rounded-2xl border bg-surface p-2 transition-colors",
        picked
          ? "border-accent ring-2 ring-accent/40"
          : "border-line hover:border-line-strong",
      )}
    >
      <div className="relative">
        <Check
          on={picked}
          show={sel.on}
          onClick={(e) => {
            e.preventDefault();
            sel.toggle(b.id, order, e.shiftKey);
          }}
        />
        <a
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          onClick={activate}
          className="block"
        >
          <Thumb
            b={b}
            className="aspect-[16/10] rounded-xl border border-line"
          />
        </a>
      </div>
      <div className="flex items-center gap-2 px-1.5 pb-0.5 pt-2.5">
        <a
          href={b.url}
          target="_blank"
          rel="noopener noreferrer"
          draggable={false}
          onClick={activate}
          className="flex min-w-0 flex-1 items-center gap-1.5"
          title={b.title}
        >
          <span className="truncate text-[14px] font-medium">
            {b.title || host}
          </span>
          <Link2 className="size-3.5 shrink-0 text-subtle" />
        </a>
        <CardMenu b={b} />
      </div>
      {b.folder_path && (
        <p className="px-1.5 pb-1 text-[11px] text-subtle">
          {folderShort(b.folder_path)}
        </p>
      )}
    </article>
  );
}

export function BookmarkRow({ b, order }: { b: Bookmark; order: string[] }) {
  const host = hostOf(b.url);
  const sel = useSelection();
  const picked = sel.ids.has(b.id);
  const activate = (e: React.MouseEvent) => {
    if (sel.on) {
      e.preventDefault();
      sel.toggle(b.id, order, e.shiftKey);
    }
  };
  return (
    <div
      draggable
      onDragStart={(e) => startDrag(e, sel.dragIds(b.id), b.title || host)}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-white/[0.03]",
        picked && "bg-accent/10",
      )}
    >
      {sel.on && (
        <button
          type="button"
          aria-label={picked ? "Deselect bookmark" : "Select bookmark"}
          aria-pressed={picked}
          onClick={(e) => sel.toggle(b.id, order, e.shiftKey)}
          className={cn(
            "grid size-5 shrink-0 place-items-center rounded-md border",
            picked
              ? "border-accent bg-accent text-white"
              : "border-line-strong text-transparent",
          )}
        >
          <Check_ className="size-3" strokeWidth={3} />
        </button>
      )}
      <img
        src={faviconOf(b.url)}
        alt=""
        className="size-5 rounded"
        draggable={false}
      />
      <a
        href={b.url}
        target="_blank"
        rel="noopener noreferrer"
        draggable={false}
        onClick={activate}
        className="min-w-0 flex-1"
      >
        <p className="truncate text-sm">{b.title || host}</p>
        {b.description && (
          <p className="truncate text-xs text-subtle">{b.description}</p>
        )}
      </a>
      <span className="hidden truncate font-mono text-xs text-subtle sm:block sm:max-w-[180px]">
        {host}
      </span>
      {b.folder_path && (
        <span className="hidden rounded-full border border-line px-2 py-0.5 text-[11px] text-muted md:block">
          {folderShort(b.folder_path)}
        </span>
      )}
      <CardMenu b={b} />
    </div>
  );
}

import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { FileText, FolderClosed, Globe, Plus, Search, Settings, Trash2 } from "lucide-react";
import { api, folderShort, type Bookmark, type Note, type Page } from "@/lib/api";
import { hostOf, faviconOf } from "@/lib/utils";
import { useStore } from "@/lib/store";
import type { Route } from "@/lib/route";

const head = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-subtle";
const item = "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-fg";

/** ⌘K: instant local matches + full-text matches from page content on the server. */
export function Palette({ open, onOpenChange, go, onAdd }: { open: boolean; onOpenChange: (o: boolean) => void; go: (r: Route) => void; onAdd: () => void }) {
  const { bookmarks, folders } = useStore();
  const [q, setQ] = useState("");
  const [remote, setRemote] = useState<{ bookmarks: Bookmark[]; notes: Note[]; pages: Page[] }>({ bookmarks: [], notes: [], pages: [] });
  const done = (fn: () => void) => { onOpenChange(false); setQ(""); fn(); };

  useEffect(() => {
    if (q.trim().length < 2) { setRemote({ bookmarks: [], notes: [], pages: [] }); return; }
    const t = setTimeout(() => api.search(q.trim()).then(setRemote).catch(() => {}), 220);
    return () => clearTimeout(t);
  }, [q]);

  const needle = q.trim().toLowerCase();
  const local = (bookmarks ?? []).filter((b) => !needle || `${b.title} ${b.url} ${b.folder_path}`.toLowerCase().includes(needle)).slice(0, needle ? 8 : 5);
  const localIds = new Set(local.map((b) => b.id));
  const inContent = remote.bookmarks.filter((b) => !localIds.has(b.id)).slice(0, 8);
  const open_ = (url: string) => done(() => window.open(url, "_blank", "noopener"));

  return (
    <Command.Dialog open={open} onOpenChange={onOpenChange} shouldFilter={false} label="Search" loop
      overlayClassName="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      contentClassName="fixed left-1/2 top-[14%] z-50 w-[calc(100vw-2rem)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl shadow-black/60">
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-4 text-subtle" />
        <Command.Input value={q} onValueChange={setQ} placeholder="Search titles, links and page contents…" className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-subtle" />
      </div>
      <Command.List className="max-h-[420px] overflow-y-auto p-2">
        <Command.Empty className="py-10 text-center text-sm text-subtle">Nothing found.</Command.Empty>
        {!needle && (
          <Command.Group heading="Go to" className={head}>
            <Command.Item className={item} onSelect={() => done(onAdd)}><Plus className="size-4" />New bookmark</Command.Item>
            <Command.Item className={item} onSelect={() => done(() => go({ k: "collections" }))}><FolderClosed className="size-4" />Collections</Command.Item>
            <Command.Item className={item} onSelect={() => done(() => go({ k: "notes" }))}><FileText className="size-4" />Notes</Command.Item>
            <Command.Item className={item} onSelect={() => done(() => go({ k: "trash" }))}><Trash2 className="size-4" />Trash</Command.Item>
            <Command.Item className={item} onSelect={() => done(() => go({ k: "settings" }))}><Settings className="size-4" />Settings</Command.Item>
          </Command.Group>
        )}
        {needle && folders.filter((f) => f.name.toLowerCase().includes(needle)).length > 0 && (
          <Command.Group heading="Collections" className={head}>
            {folders.filter((f) => f.name.toLowerCase().includes(needle)).map((f) => (
              <Command.Item key={f.name} value={"f" + f.name} className={item} onSelect={() => done(() => go({ k: "folder", name: f.name }))}><FolderClosed className="size-4" />{f.short}<span className="ml-auto font-mono text-xs text-subtle">{f.count}</span></Command.Item>
            ))}
          </Command.Group>
        )}
        {local.length > 0 && (
          <Command.Group heading={needle ? "Bookmarks" : "Recent"} className={head}>
            {local.map((b) => (
              <Command.Item key={b.id} value={b.id} className={item} onSelect={() => open_(b.url)}>
                <img src={faviconOf(b.url)} alt="" className="size-4 rounded-sm" /><span className="truncate">{b.title || b.url}</span>
                <span className="ml-auto hidden shrink-0 font-mono text-xs text-subtle sm:block">{hostOf(b.url)}</span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {inContent.length > 0 && (
          <Command.Group heading="Found in page content" className={head}>
            {inContent.map((b) => (
              <Command.Item key={b.id} value={"c" + b.id} className={item} onSelect={() => open_(b.url)}>
                <img src={faviconOf(b.url)} alt="" className="size-4 shrink-0 rounded-sm" />
                <span className="min-w-0"><span className="block truncate text-fg">{b.title || b.url}</span><span className="block truncate text-xs text-subtle">{b.snippet}</span></span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {remote.notes.length > 0 && (
          <Command.Group heading="Notes" className={head}>
            {remote.notes.map((n) => (
              <Command.Item key={n.id} value={"n" + n.id} className={item} onSelect={() => done(() => { sessionStorage.setItem("mb_note", n.id); go({ k: "notes" }); })}>
                <FileText className="size-4 shrink-0" /><span className="min-w-0"><span className="block truncate text-fg">{n.title || "Untitled"}</span><span className="block truncate text-xs text-subtle">{n.snippet}</span></span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
        {remote.pages.length > 0 && (
          <Command.Group heading="Visited pages" className={head}>
            {remote.pages.map((p) => (
              <Command.Item key={p.url} value={"p" + p.url} className={item} onSelect={() => open_(p.url)}>
                <Globe className="size-4 shrink-0" /><span className="min-w-0"><span className="block truncate text-fg">{p.title || p.url}</span><span className="block truncate text-xs text-subtle">{p.snippet || folderShort(hostOf(p.url))}</span></span>
              </Command.Item>
            ))}
          </Command.Group>
        )}
      </Command.List>
    </Command.Dialog>
  );
}

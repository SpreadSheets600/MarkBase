import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Bookmark,
  ChevronsUpDown,
  FileText,
  Folder,
  History,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  Upload,
} from "lucide-react";
import { useRoute, href, type Route } from "@/lib/route";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { FolderIcon } from "@/components/FolderIcon";
import { Palette } from "@/components/Palette";
import { SelectionBar } from "@/components/SelectionBar";
import { SelectionProvider, useDropTarget } from "@/lib/select";
import { AddDialog } from "@/components/AddDialog";
import { Bookmarks } from "./Bookmarks";
import { Collections } from "./Collections";
import { Notes } from "./Notes";
import { Trash } from "./Trash";
import { History as HistoryView } from "./History";
import { Settings as SettingsView } from "./Settings";

const same = (a: Route, b: Route) => JSON.stringify(a) === JSON.stringify(b);

function FolderLink({
  name,
  short,
  active,
}: {
  name: string;
  short: string;
  active: boolean;
}) {
  const { move } = useStore();
  const drop = useDropTarget((ids) => move(ids, name));
  return (
    <a
      {...drop.props}
      href={href({ k: "folder", name })}
      className={cn(
        "relative flex h-8 items-center gap-2.5 rounded-lg px-2.5 text-[13px] text-muted transition-colors hover:bg-white/[0.04] hover:text-fg",
        active && "bg-white/[0.07] text-fg",
        drop.over && "bg-accent/20 text-fg ring-1 ring-accent",
      )}
    >
      <FolderIcon name={name} className="h-4 w-5 shrink-0" />
      <span className="truncate">{short}</span>
    </a>
  );
}

function TrashLink({ active }: { active: boolean }) {
  const { trash } = useStore();
  const drop = useDropTarget((ids) => trash(ids));
  return (
    <a
      {...drop.props}
      href={href({ k: "trash" })}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-muted transition-colors hover:bg-white/[0.04] hover:text-fg",
        active && "bg-white/[0.07] text-fg",
        drop.over && "bg-red-500/15 text-red-200 ring-1 ring-red-400/60",
      )}
    >
      <Trash2 className="size-4" />
      <span className="flex-1">Trash</span>
    </a>
  );
}

export function Shell() {
  return (
    <SelectionProvider>
      <ShellInner />
    </SelectionProvider>
  );
}

function ShellInner() {
  const { session, bookmarks, folders } = useStore();
  const [route, go] = useRoute();
  const [nav, setNav] = useState(false);
  const [palette, setPalette] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);
  useEffect(() => setNav(false), [route]);

  const Item = ({
    r,
    icon: I,
    label,
    count,
  }: {
    r: Route;
    icon: typeof Bookmark;
    label: string;
    count?: number;
  }) => (
    <a
      href={href(r)}
      aria-current={same(route, r) ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-muted transition-colors hover:bg-white/[0.04] hover:text-fg",
        same(route, r) && "text-fg",
      )}
    >
      {same(route, r) && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-lg bg-white/[0.07]"
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
        />
      )}
      <I className="relative size-4" />
      <span className="relative flex-1 truncate">{label}</span>
      {count !== undefined && (
        <span className="relative rounded-full bg-white/[0.06] px-1.5 py-px font-mono text-[11px] text-muted">
          {count}
        </span>
      )}
    </a>
  );

  const sidebar = (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2.5">
        <Logo size={34} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">
            {session?.name
              ? `${session.name.split(" ")[0]}'s Workspace`
              : "MarkBase"}
          </p>
          <p className="text-xs text-subtle">Workspace</p>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full justify-center"
        onClick={() => setAdding(true)}
      >
        <Plus />
        New bookmark
      </Button>
      <div>
        <p className="mb-1.5 px-2.5 text-[11px] font-medium text-subtle">
          Main Menu
        </p>
        <nav className="space-y-0.5" aria-label="Main menu">
          <Item
            r={{ k: "all" }}
            icon={Bookmark}
            label="All Bookmarks"
            count={bookmarks?.length}
          />
          <Item
            r={{ k: "collections" }}
            icon={Folder}
            label="Collections"
            count={folders.length}
          />
          <Item r={{ k: "notes" }} icon={FileText} label="Notes" />
          <Item r={{ k: "history" }} icon={History} label="History" />
          <TrashLink active={same(route, { k: "trash" })} />
        </nav>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-1.5 px-2.5 text-[11px] font-medium text-subtle">
          Folders
        </p>
        <nav className="space-y-0.5" aria-label="Folders">
          {folders.map((f) => (
            <FolderLink
              key={f.name}
              name={f.name}
              short={f.short}
              active={same(route, { k: "folder", name: f.name })}
            />
          ))}
        </nav>
      </div>
      <div className="space-y-0.5 border-t border-line pt-3">
        <p className="mb-1 px-2.5 text-[11px] font-medium text-subtle">Tools</p>
        <Item r={{ k: "settings" }} icon={Settings} label="Settings" />
        <a
          href={href({ k: "settings" })}
          className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13.5px] text-muted hover:bg-white/[0.04] hover:text-fg"
        >
          <Upload className="size-4" />
          Import bookmarks
        </a>
        <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-line bg-surface p-2">
          {session?.picture ? (
            <img
              src={session.picture}
              alt=""
              referrerPolicy="no-referrer"
              className="size-8 rounded-full"
            />
          ) : (
            <div className="grid size-8 place-items-center rounded-full bg-elevated text-xs">
              {(session?.name || "M")[0]}
            </div>
          )}
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-[13px] font-medium">
              {session?.name || "Google Account"}
            </p>
            <p className="truncate text-[11px] text-subtle">
              {session?.email || "Connected"}
            </p>
          </div>
          <ChevronsUpDown className="size-3.5 text-subtle" />
        </div>
      </div>
    </div>
  );

  let page: ReactNode;
  switch (route.k) {
    case "collections":
      page = <Collections go={go} onAdd={() => setAdding(true)} />;
      break;
    case "folder":
      page = (
        <Bookmarks
          key={route.name}
          folder={route.name}
          onAdd={() => setAdding(true)}
        />
      );
      break;
    case "notes":
      page = <Notes />;
      break;
    case "history":
      page = <HistoryView />;
      break;
    case "trash":
      page = <Trash />;
      break;
    case "settings":
      page = <SettingsView />;
      break;
    default:
      page = <Bookmarks onAdd={() => setAdding(true)} />;
  }

  return (
    <div className="flex h-full gap-2 p-2">
      <aside className="hidden w-[248px] shrink-0 overflow-hidden rounded-2xl border border-line bg-[#0b0b0e] md:block">
        {sidebar}
      </aside>
      <AnimatePresence>
        {nav && (
          <motion.div
            className="fixed inset-0 z-40 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setNav(false)}
            />
            <motion.aside
              className="relative h-full w-[280px] border-r border-line bg-[#0b0b0e]"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 420, damping: 38 }}
            >
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-[#0b0b0e]">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line px-3 md:px-5">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setNav(true)}
          >
            <Menu />
          </Button>
          <button
            onClick={() => setPalette(true)}
            className="mx-auto flex h-9 w-full max-w-md items-center gap-2 rounded-xl border border-line bg-bg px-3 text-[13px] text-subtle transition-colors hover:border-line-strong hover:text-muted"
          >
            <Search className="size-3.5" />
            <span>Search everything</span>
            <kbd className="ml-auto hidden rounded border border-line px-1.5 font-mono text-[10px] sm:block">
              Ctrl K
            </kbd>
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">{page}</div>
        </main>
      </div>

      <SelectionBar />
      <Palette
        open={palette}
        onOpenChange={setPalette}
        go={go}
        onAdd={() => setAdding(true)}
      />
      <AddDialog
        open={adding}
        onOpenChange={setAdding}
        folder={route.k === "folder" ? route.name : ""}
      />
    </div>
  );
}

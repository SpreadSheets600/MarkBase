import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { api, foldersOf, type Bookmark, type Folder, type Note } from "./api";
import type { Session } from "./auth";

type Store = {
  session: Session | null;
  bookmarks: Bookmark[] | null;
  folders: Folder[];
  notes: Note[];
  error: string;
  reload: () => Promise<void>;
  add: (url: string, title: string, folder: string) => Promise<void>;
  trash: (ids: string[]) => Promise<void>;
  move: (ids: string[], folder: string) => Promise<void>;
  byId: (id: string) => Bookmark | undefined;
  loadNotes: () => Promise<void>;
  logout: () => void;
  saveToken: (t: string) => void;
};

const CACHE_KEY = "markbase_cache_v1";
const readCache = (): Bookmark[] | null => {
  try {
    const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
};
const writeCache = (l: Bookmark[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(l.slice(0, 3000)));
  } catch {}
};

const Ctx = createContext<Store>(null!);
export const useStore = () => useContext(Ctx);

export function StoreProvider({
  session,
  error,
  onLogout,
  onToken,
  children,
}: {
  session: Session | null;
  error: string;
  onLogout: () => void;
  onToken: (t: string) => void;
  children: ReactNode;
}) {
  const [bookmarks, setBookmarks] = useState<Bookmark[] | null>(readCache);
  const [notes, setNotes] = useState<Note[]>([]);
  const [err, setErr] = useState(error);
  const folders = useMemo(() => foldersOf(bookmarks ?? []), [bookmarks]);

  const reload = useCallback(async () => {
    try {
      const l = await api.bookmarks();
      setBookmarks(l);
      writeCache(l);
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't reach the API");
      setBookmarks((b) => b ?? []);
    }
  }, []);
  const loadNotes = useCallback(async () => {
    try {
      setNotes(await api.notes());
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      await reload();

      try {
        let changed = 0;
        for (let i = 0; i < 12; i++) {
          const r = await api.enrich();
          changed += r.done;
          if (!r.remaining || !r.done) break;
        }
        if (changed) await reload();
      } catch {}
    })();
  }, [reload]);

  const store: Store = {
    session,
    bookmarks,
    folders,
    notes,
    error: err,
    reload,
    loadNotes,
    add: async (url, title, folder) => {
      await api.add(url, title, folder);
      await reload();
      toast.success("Bookmark added");
    },
    byId: (id) => bookmarks?.find((b) => b.id === id),

    trash: async (ids) => {
      const gone = new Set(ids);
      setBookmarks((l) => l && l.filter((b) => !gone.has(b.id)));
      try {
        await api.toTrash(ids);
      } catch {
        toast.error("Couldn't move to trash");
        await reload();
        return;
      }
      toast(
        ids.length > 1
          ? `${ids.length} bookmarks moved to trash`
          : "Moved to trash",
        {
          action: {
            label: "Undo",
            onClick: async () => {
              await api.restore(ids);
              await reload();
            },
          },
        },
      );
      reload();
    },
    move: async (ids, folder) => {
      const set = new Set(ids);
      const before = (bookmarks ?? [])
        .filter((b) => set.has(b.id) && b.folder_path !== folder)
        .map((b) => ({ url: b.url, folder: b.folder_path }));
      if (!before.length) return;
      setBookmarks(
        (l) =>
          l &&
          l.map((b) => (set.has(b.id) ? { ...b, folder_path: folder } : b)),
      );
      try {
        await api.move(ids, folder);
      } catch {
        toast.error("Couldn't move");
        await reload();
        return;
      }
      const label = folder ? folder.split(" / ").pop() : "Library";
      toast.success(
        before.length > 1
          ? `Moved ${before.length} bookmarks to ${label}`
          : `Moved to ${label}`,
        {
          action: {
            label: "Undo",
            onClick: async () => {
              const fresh = await api.bookmarks();
              const byFolder = new Map<string, string[]>();
              for (const prev of before) {
                const cur = fresh.find(
                  (b) => b.url === prev.url && b.folder_path === folder,
                );
                if (cur)
                  byFolder.set(prev.folder, [
                    ...(byFolder.get(prev.folder) ?? []),
                    cur.id,
                  ]);
              }
              for (const [f, list] of byFolder) await api.move(list, f);
              await reload();
            },
          },
        },
      );
      reload();
    },
    logout: onLogout,
    saveToken: onToken,
  };
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

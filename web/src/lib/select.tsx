import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";

export const DRAG_MIME = "application/x-markbase-ids";

type Sel = {
  on: boolean;
  ids: Set<string>;
  setOn: (v: boolean) => void;
  toggle: (id: string, order?: string[], shift?: boolean) => void;
  selectAll: (order: string[]) => void;
  clear: () => void;

  dragIds: (id: string) => string[];
};

const Ctx = createContext<Sel>(null!);
export const useSelection = () => useContext(Ctx);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState(false);
  const [ids, setIds] = useState<Set<string>>(new Set());
  const last = useRef<string | null>(null);

  const toggle = useCallback(
    (id: string, order?: string[], shift?: boolean) => {
      setMode(true);
      setIds((prev) => {
        const next = new Set(prev);
        const anchor = last.current;
        if (shift && anchor && order) {
          const a = order.indexOf(anchor),
            b = order.indexOf(id);
          if (a >= 0 && b >= 0) {
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++)
              next.add(order[i]);
            last.current = id;
            return next;
          }
        }
        if (next.has(id)) next.delete(id);
        else next.add(id);
        last.current = id;
        return next;
      });
    },
    [],
  );

  const value = useMemo<Sel>(
    () => ({
      on: mode || ids.size > 0,
      ids,
      setOn: (v) => {
        setMode(v);
        if (!v) {
          setIds(new Set());
          last.current = null;
        }
      },
      toggle,
      selectAll: (order) => {
        setMode(true);
        setIds(new Set(order));
      },
      clear: () => {
        setIds(new Set());
        setMode(false);
        last.current = null;
      },
      dragIds: (id) => (ids.has(id) ? [...ids] : [id]),
    }),
    [mode, ids, toggle],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function startDrag(e: DragEvent, ids: string[], label: string) {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(ids));
  e.dataTransfer.effectAllowed = "move";
  const el = document.createElement("div");
  el.textContent =
    ids.length > 1 ? `${ids.length} bookmarks` : label.slice(0, 40);
  el.style.cssText =
    "position:fixed;top:-100px;left:-100px;padding:8px 12px;border-radius:10px;background:#8b5cf6;color:#fff;font:500 13px system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.5)";
  document.body.appendChild(el);
  e.dataTransfer.setDragImage(el, 12, 12);
  setTimeout(() => el.remove());
}

export function useDropTarget(onDrop: (ids: string[]) => void) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);
  const has = (e: DragEvent) => e.dataTransfer.types.includes(DRAG_MIME);
  return {
    over,
    props: {
      onDragEnter: (e: DragEvent) => {
        if (has(e)) {
          depth.current++;
          setOver(true);
        }
      },
      onDragOver: (e: DragEvent) => {
        if (has(e)) {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
        }
      },
      onDragLeave: (e: DragEvent) => {
        if (has(e) && --depth.current <= 0) {
          depth.current = 0;
          setOver(false);
        }
      },
      onDrop: (e: DragEvent) => {
        if (!has(e)) return;
        e.preventDefault();
        depth.current = 0;
        setOver(false);
        try {
          const ids = JSON.parse(e.dataTransfer.getData(DRAG_MIME));
          if (Array.isArray(ids) && ids.length) onDrop(ids);
        } catch {}
      },
    },
  };
}

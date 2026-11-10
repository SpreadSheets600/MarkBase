import { useEffect, useMemo } from "react";
import { Bookmark as Icon, CheckSquare } from "lucide-react";
import { useStore } from "@/lib/store";
import { GRID, usePrefs } from "@/lib/prefs";
import { folderShort } from "@/lib/api";
import { BookmarkCard, BookmarkRow } from "@/components/BookmarkCard";
import { Empty, LayoutToggle, PageHeader, SkeletonGrid } from "./Header";
import { BlurFade } from "@/components/magic/blur-fade";
import { useSelection } from "@/lib/select";
import { Button } from "@/components/ui/button";

export function Bookmarks({
  folder,
  onAdd,
}: {
  folder?: string;
  onAdd: () => void;
}) {
  const { bookmarks, error } = useStore();
  const prefs = usePrefs();
  const sel = useSelection();
  const list = useMemo(() => {
    const l = (bookmarks ?? []).filter(
      (b) => !folder || b.folder_path === folder,
    );
    return [...l].sort((a, b) => (b.date_added || 0) - (a.date_added || 0));
  }, [bookmarks, folder]);

  const order = useMemo(() => list.map((b) => b.id), [list]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const typing =
        e.target instanceof HTMLElement &&
        /^(INPUT|TEXTAREA)$/.test(e.target.tagName);
      if (typing) return;
      if (e.key === "Escape" && sel.on) sel.clear();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a" && sel.on) {
        e.preventDefault();
        sel.selectAll(order);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sel, order]);

  useEffect(() => () => sel.clear(), [folder]);

  return (
    <>
      <PageHeader
        title={folder ? folderShort(folder) : "All bookmarks"}
        subtitle={
          bookmarks
            ? `${list.length} bookmark${list.length === 1 ? "" : "s"}`
            : "Loading…"
        }
        icon={<Icon className="size-5 text-muted" />}
        actions={
          <>
            <Button
              variant={sel.on ? "accent" : "outline"}
              size="sm"
              onClick={() => (sel.on ? sel.clear() : sel.setOn(true))}
            >
              <CheckSquare />
              {sel.on ? "Done" : "Select"}
            </Button>
            <LayoutToggle />
          </>
        }
        onAdd={onAdd}
      />
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-200"
        >
          {error}
        </p>
      )}
      {bookmarks === null ? (
        <SkeletonGrid />
      ) : list.length === 0 ? (
        <Empty
          title="Nothing here yet"
          body="Bookmarks you save in any browser or on your phone appear here."
        />
      ) : prefs.layout === "grid" ? (
        <div className={`grid gap-3 ${GRID[prefs.cols]}`}>
          {list.map((b, i) => (
            <BlurFade key={b.id} delay={Math.min(i, 14) * 0.02} y={6}>
              <BookmarkCard b={b} order={order} />
            </BlurFade>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {list.map((b) => (
            <BookmarkRow key={b.id} b={b} order={order} />
          ))}
        </div>
      )}
    </>
  );
}

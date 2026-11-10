import { useEffect, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, type Bookmark } from "@/lib/api";
import { useStore } from "@/lib/store";
import { hostOf } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Thumb } from "@/components/BookmarkCard";
import { Empty, PageHeader } from "./Header";

export function Trash() {
  const { reload } = useStore();
  const [items, setItems] = useState<Bookmark[] | null>(null);
  const load = () =>
    api
      .trash()
      .then(setItems)
      .catch(() => setItems([]));
  useEffect(() => {
    load();
  }, []);
  const act = async (
    fn: (ids: string[]) => Promise<unknown>,
    ids: string[],
    msg: string,
  ) => {
    await fn(ids);
    await Promise.all([load(), reload()]);
    toast(msg);
  };

  return (
    <>
      <PageHeader
        title="Trash"
        subtitle="Removed bookmarks stay here until you delete them for good."
        icon={<Trash2 className="size-5 text-muted" />}
        actions={
          items && items.length > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                act(
                  api.purge,
                  items.map((i) => i.id),
                  "Trash emptied",
                )
              }
            >
              Empty trash
            </Button>
          ) : null
        }
      />
      {items === null ? null : items.length === 0 ? (
        <Empty
          title="Trash is empty"
          body="Bookmarks you remove land here first, so nothing is lost by accident."
        />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {items.map((b) => (
            <div key={b.id} className="flex items-center gap-3 p-3">
              <Thumb
                b={b}
                className="hidden h-12 w-20 shrink-0 rounded-lg border border-line sm:block"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{b.title || hostOf(b.url)}</p>
                <p className="truncate font-mono text-xs text-subtle">
                  {hostOf(b.url)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => act(api.restore, [b.id], "Restored")}
              >
                <RotateCcw />
                Restore
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete forever"
                onClick={() => act(api.purge, [b.id], "Deleted forever")}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from "react";
import {
  Copy,
  ExternalLink,
  History as HistoryIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { api, type Page, type PageInfo } from "@/lib/api";
import { mdToHtml } from "@/lib/markdown";
import { faviconOf, hostOf } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Empty, PageHeader } from "./Header";

const ago = (t: number) => {
  const m = Math.round((Date.now() - t) / 60000);
  return m < 1
    ? "just now"
    : m < 60
      ? `${m} min ago`
      : m < 1440
        ? `${Math.round(m / 60)} h ago`
        : `${Math.round(m / 1440)} d ago`;
};
const dur = (s: number) =>
  s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

function Status({
  label,
  value,
  on,
}: {
  label: string;
  value: string;
  on: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <span className="font-medium">{label}</span>
      <span className="flex items-center gap-2 text-xs text-muted">
        <i
          className={`size-1.5 rounded-full ${on ? "bg-emerald-400" : "bg-subtle"}`}
        />
        {value}
      </span>
    </div>
  );
}

function Reader({
  page,
  onClose,
  onForgot,
}: {
  page: Page;
  onClose: () => void;
  onForgot: () => void;
}) {
  const [info, setInfo] = useState<PageInfo | null>(null);
  useEffect(() => {
    api
      .pageInfo(page.url)
      .then(setInfo)
      .catch(() => setInfo(null));
  }, [page.url]);
  const h = info?.history;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        wide
        title={page.title || hostOf(page.url)}
        description={hostOf(page.url)}
      >
        <div className="divide-y divide-line rounded-xl border border-line bg-bg">
          <Status
            label="Bookmark"
            value={info?.bookmarked ? "Saved" : "Not saved"}
            on={!!info?.bookmarked}
          />
          <Status
            label="Content"
            value={
              info?.words
                ? `${info.words.toLocaleString()} words extracted`
                : "Not captured"
            }
            on={!!info?.words}
          />
          <Status
            label="History"
            value={
              h
                ? `read ${dur(h.dwell_sec)} · ${ago(h.visited_at)}`
                : "Not remembered"
            }
            on={!!h}
          />
        </div>
        <div className="mt-3 flex gap-2">
          <Button asChild variant="accent" className="flex-1">
            <a href={page.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
              Open page
            </a>
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={async () => {
              await api.forgetPage(page.url);
              toast("Removed from history");
              onForgot();
              onClose();
            }}
          >
            <Trash2 />
            Forget
          </Button>
        </div>
        {info?.content ? (
          <div className="mt-4 overflow-hidden rounded-xl border border-line bg-bg">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5 text-xs text-muted">
              <span>Extracted content · kept {info.retention_days} days</span>
              <button
                className="inline-flex items-center gap-1.5 text-accent-soft hover:underline"
                onClick={() => {
                  navigator.clipboard.writeText(info.content);
                  toast.success("Copied as markdown");
                }}
              >
                <Copy className="size-3" />
                Copy
              </button>
            </div>
            <div
              className="reader max-h-[40vh] overflow-y-auto px-4 py-3 text-[13.5px] leading-relaxed text-zinc-300"
              dangerouslySetInnerHTML={{ __html: mdToHtml(info.content) }}
            />
          </div>
        ) : info ? (
          <p className="mt-4 text-center text-sm text-muted">
            No text was extracted from this page.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function History() {
  const [pages, setPages] = useState<Page[] | null>(null);
  const [open, setOpen] = useState<Page | null>(null);
  const load = () =>
    api
      .pages()
      .then(setPages)
      .catch(() => setPages([]));
  useEffect(() => {
    load();
  }, []);
  return (
    <>
      <PageHeader
        title="History"
        subtitle="Pages you spent time on, not every click. Kept for 60 days and searchable by content."
        icon={<HistoryIcon className="size-5 text-muted" />}
      />
      {pages === null ? null : pages.length === 0 ? (
        <Empty
          title="Nothing remembered yet"
          body="Turn on Smart history in the browser extension. It saves readable content from pages you stay on, and skips quick visits and private sites."
        />
      ) : (
        <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {pages.map((p) => (
            <button
              key={p.url}
              onClick={() => setOpen(p)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
            >
              <img src={faviconOf(p.url)} alt="" className="size-5 rounded" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{p.title || p.url}</p>
                <p className="truncate text-xs text-subtle">
                  {p.description || hostOf(p.url)}
                </p>
              </div>
              <span className="shrink-0 text-xs text-subtle">
                {ago(p.visited_at)}
              </span>
            </button>
          ))}
        </div>
      )}
      {open && (
        <Reader page={open} onClose={() => setOpen(null)} onForgot={load} />
      )}
    </>
  );
}

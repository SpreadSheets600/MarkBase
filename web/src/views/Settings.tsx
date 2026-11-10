import { useRef, useState } from "react";
import { Download, LogOut, Settings as Icon, Upload } from "lucide-react";
import { toast } from "sonner";
import { api, exportHtml, parseBookmarksHtml } from "@/lib/api";
import { useStore } from "@/lib/store";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "./Header";

const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-6"><h2 className="mb-2 text-xs font-medium uppercase tracking-widest text-subtle">{title}</h2>
    <div className="divide-y divide-line rounded-2xl border border-line bg-surface">{children}</div></section>
);
const Row = ({ title, body, children }: { title: string; body?: string; children?: React.ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 p-4"><div className="min-w-0"><p className="text-sm font-medium">{title}</p>{body && <p className="mt-0.5 text-xs text-muted">{body}</p>}</div>{children}</div>
);
const Seg = ({ on, children, ...p }: { on: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...p} className={cn("h-8 rounded-lg border border-line px-3 text-[13px] text-muted transition-colors hover:text-fg", on && "border-accent/50 bg-accent/15 text-fg")}>{children}</button>
);

export function Settings() {
  const { session, bookmarks, logout, reload, saveToken } = useStore();
  const prefs = usePrefs();
  const file = useRef<HTMLInputElement>(null);
  const [token, setToken] = useState(getToken());
  const google = !!session?.email;

  const onFile = async (f?: File) => {
    if (!f) return;
    const items = parseBookmarksHtml(await f.text());
    if (!items.length) { toast.error("No bookmarks found in that file"); return; }
    await api.importMany(items); await reload(); toast.success(`Imported ${items.length} bookmarks`);
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Settings" subtitle="Defaults for layout, data and your account." icon={<Icon className="size-5 text-muted" />} />
      <Card title="Bookmarks">
        <Row title="Default layout" body="Starting view for all lists.">
          <div className="flex gap-2"><Seg on={prefs.layout === "grid"} onClick={() => setPrefs({ layout: "grid" })}>Grid</Seg><Seg on={prefs.layout === "list"} onClick={() => setPrefs({ layout: "list" })}>List</Seg></div>
        </Row>
        <Row title="Grid columns" body="Used for the grid layout on large screens.">
          <div className="flex gap-2">{([2, 3, 4] as const).map((c) => <Seg key={c} on={prefs.cols === c} onClick={() => setPrefs({ cols: c })}>{c}</Seg>)}</div>
        </Row>
      </Card>
      <Card title="Data">
        <Row title="Import bookmarks" body="Upload an HTML export from Chrome, Firefox, Safari or Edge.">
          <input ref={file} type="file" accept=".html,text/html" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <Button variant="outline" size="sm" onClick={() => file.current?.click()}><Upload />Import</Button>
        </Row>
        <Row title="Export bookmarks" body="Download everything as a standard bookmarks file."><Button variant="outline" size="sm" onClick={() => bookmarks?.length ? exportHtml(bookmarks) : toast("Nothing to export")}><Download />Export</Button></Row>
        <Row title="Smart history" body="Page capture runs in the browser extension. It saves readable text from pages you stay on, so you can search by what a page says." />
      </Card>
      <Card title="Account">
        {google ? (
          <Row title={session!.name} body={`Signed in as ${session!.email}`}><Button variant="outline" size="sm" onClick={logout}><LogOut />Log out</Button></Row>
        ) : (
          <div className="space-y-3 p-4">
            <p className="text-sm font-medium">Sync token</p>
            <Input type="password" value={token} onChange={(e) => setToken(e.target.value)} placeholder="mb_sync_…" className="font-mono text-[13px]" />
            <div className="flex gap-2"><Button variant="accent" size="sm" disabled={!token.trim()} onClick={() => { saveToken(token); toast.success("Token saved"); }}>Save</Button><Button variant="outline" size="sm" onClick={logout}><LogOut />Log out</Button></div>
          </div>
        )}
      </Card>
    </div>
  );
}

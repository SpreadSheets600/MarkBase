import { getToken } from "./auth";

export type Bookmark = {
  id: string; url: string; title: string; folder_path: string; date_added: number; updated_at: number;
  description: string; image: string; tags: string; deleted?: number; snippet?: string;
};
export type Note = { id: string; title: string; body: string; folder_path: string; created_at: number; updated_at: number; snippet?: string };
export type Page = { url: string; title: string; description: string; image: string; dwell_sec: number; visited_at: number; snippet?: string };
export type PageInfo = { bookmarked: boolean; folders: string[]; history: { dwell_sec: number; visited_at: number } | null; title: string; content: string; words: number; retention_days: number };
export type Folder = { name: string; short: string; count: number };

export class AuthError extends Error {}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { authorization: `Bearer ${getToken()}`, ...(init?.json ? { "content-type": "application/json" } : {}) },
    body: init?.json ? JSON.stringify(init.json) : init?.body,
  });
  if (res.status === 401) throw new AuthError("Token rejected");
  if (!res.ok) throw new Error(`API responded ${res.status}`);
  return res.json();
}

export const api = {
  bookmarks: async (t?: string) => {
    const res = await fetch("/v1/bookmarks", { headers: { authorization: `Bearer ${t ?? getToken()}` } });
    if (res.status === 401) throw new AuthError("Token rejected");
    if (!res.ok) throw new Error(`API responded ${res.status}`);
    return ((await res.json()).bookmarks ?? []) as Bookmark[];
  },
  trash: () => call<{ bookmarks: Bookmark[] }>("/v1/bookmarks?trash=1").then((r) => r.bookmarks),
  add: (url: string, title: string, folder_path: string) => call("/v1/bookmarks", { method: "POST", json: { url, title, folder_path } }),
  toTrash: (ids: string[]) => call("/v1/bookmarks/trash", { method: "POST", json: { ids } }),
  restore: (ids: string[]) => call("/v1/bookmarks/restore", { method: "POST", json: { ids } }),
  purge: (ids: string[]) => call("/v1/bookmarks/purge", { method: "POST", json: { ids } }),
  move: (ids: string[], folder_path: string) => call("/v1/bookmarks/move", { method: "POST", json: { ids, folder_path } }),
  notes: () => call<{ notes: Note[] }>("/v1/notes").then((r) => r.notes),
  saveNote: (n: Partial<Note>) => call<{ id: string }>("/v1/notes", { method: "POST", json: n }),
  deleteNote: (id: string) => call("/v1/notes?id=" + encodeURIComponent(id), { method: "DELETE" }),
  pages: () => call<{ pages: Page[] }>("/v1/pages").then((r) => r.pages),
  pageInfo: (url: string) => call<PageInfo>("/v1/page?url=" + encodeURIComponent(url)),
  forgetPage: (url: string) => call("/v1/pages?url=" + encodeURIComponent(url), { method: "DELETE" }),
  search: (q: string) => call<{ bookmarks: Bookmark[]; notes: Note[]; pages: Page[] }>("/v1/search?q=" + encodeURIComponent(q)),
  enrich: () => call<{ done: number; remaining: number }>("/v1/enrich", { method: "POST", json: { limit: 8 } }),
  importMany: (items: { url: string; title: string; folder_path: string; date_added: number }[]) =>
    call("/v1/changes", { method: "POST", json: { cursor: 0, upserts: items } }),
};

export const folderShort = (n: string) => n.split(" / ").pop() || "Root";

export function foldersOf(list: Bookmark[]): Folder[] {
  const m = new Map<string, Folder>();
  for (const b of list) {
    const k = b.folder_path || "";
    if (!k) continue;
    const f = m.get(k) ?? { name: k, short: folderShort(k), count: 0 };
    f.count++; m.set(k, f);
  }
  return [...m.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function exportHtml(list: Bookmark[]) {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
  const body = list.map((b) => `  <DT><A HREF="${esc(b.url)}">${esc(b.title || b.url)}</A>`).join("\n");
  const blob = new Blob([`<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<DL><p>\n${body}\n</DL><p>`], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = "markbase-bookmarks.html"; a.click();
}

/** Parse a browser "Export bookmarks" HTML file into flat items with folder paths. */
export function parseBookmarksHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const out: { url: string; title: string; folder_path: string; date_added: number }[] = [];
  const walk = (dl: Element, path: string[]) => {
    let label = "";
    for (const el of Array.from(dl.children)) {
      if (el.tagName === "DT") {
        const h3 = el.querySelector(":scope > h3");
        const a = el.querySelector(":scope > a");
        if (h3) { label = h3.textContent?.trim() || ""; const sub = el.querySelector(":scope > dl"); if (sub) walk(sub, [...path, label]); }
        else if (a?.getAttribute("href")?.startsWith("http"))
          out.push({ url: a.getAttribute("href")!, title: a.textContent?.trim() || "", folder_path: path.join(" / "), date_added: Number(a.getAttribute("add_date") || 0) * 1000 });
      }
    }
  };
  const root = doc.querySelector("dl");
  if (root) walk(root, []);
  return out;
}

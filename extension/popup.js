"use strict";

const DEFAULT_ENDPOINT = "https://markbase-api.spreadsheets600.workers.dev";
const $ = (id) => document.getElementById(id);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const fav = (u) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostOf(u))}`;
const short = (p) => (p || "").split(" / ").pop() || "Root";
const HUES = [262, 190, 152, 38, 350, 320, 220, 90];
const hue = (s) => HUES[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % HUES.length, 0)];

const get = (k) => chrome.storage.local.get(k);
const set = (o) => chrome.storage.local.set(o);

const S = {
  tab: "lib",
  items: [],
  remote: [],
  folder: "",
  q: "",
  cfg: {},
  status: {},
  tabInfo: null,
  page: null,
  reader: null,
  notes: [],
  note: null,
  history: [],
};

async function config() {
  const c = await get([
    "endpoint", "token", "googleSession", "autosync", "captureBookmarks",
    "smartHistory", "dwellSeconds", "historyCadence", "historyRetention", "skipPrivate",
    "status", "libCache", "syncMinutes"
  ]);
  S.cfg = {
    endpoint: (c.endpoint || DEFAULT_ENDPOINT).replace(/\/+$/, ""),
    token: (c.token || "").trim(),
    session: c.googleSession || null,
    autosync: c.autosync !== false,
    syncMinutes: [15, 30, 60].includes(c.syncMinutes) ? c.syncMinutes : 15,
    captureBookmarks: c.captureBookmarks !== false,
    smartHistory: c.smartHistory !== false,
    dwellSeconds: [10, 30, 60].includes(c.dwellSeconds) ? c.dwellSeconds : 10,
    historyCadence: [20, 60, 300].includes(c.historyCadence) ? c.historyCadence : 20,
    historyRetention: [30, 60, 90].includes(c.historyRetention) ? c.historyRetention : 60,
    skipPrivate: c.skipPrivate !== false,
  };
  S.status = c.status || {};
  if (!S.items.length && Array.isArray(c.libCache)) S.items = c.libCache;
}

async function api(path) {
  const r = await fetch(S.cfg.endpoint + path, { headers: { authorization: `Bearer ${S.cfg.token}` } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  return r.json();
}

/* ---------------------------------------------------------------- library */
async function refresh() {
  if (!S.cfg.token) { render(); return; }
  try {
    const { bookmarks } = await api("/v1/bookmarks");
    S.items = bookmarks;
    await set({ libCache: bookmarks.slice(0, 600).map((b) => ({ id: b.id, url: b.url, title: b.title, folder_path: b.folder_path, image: b.image, description: b.description })) });
  } catch { /* offline: keep the cache */ }
  render();
}

const ICONS = {
  bookmark: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
  globe: '<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12"/></svg>',
  history: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
};

const safeUrl = (u) => {
  if (!u || typeof u !== "string") return "#";
  const s = u.trim();
  return /^https?:\/\//i.test(s) ? s : "#";
};

function thumb(b) {
  const img = b.image && /^https?:\/\//i.test(b.image) ? b.image : null;
  const favUrl = b.url && /^https?:\/\//i.test(b.url) ? fav(b.url) : "";
  return img
    ? `<img class="cover" src="${esc(img)}" referrerpolicy="no-referrer" loading="lazy" alt="">`
    : favUrl
      ? `<img class="fav" src="${esc(favUrl)}" alt="">`
      : `<span class="fav-fallback" style="display:grid;place-items:center;color:var(--muted)">${ICONS.globe}</span>`;
}

function itemHtml(b) {
  const url = safeUrl(b.url);
  const isHttp = url !== "#";
  const tag = isHttp ? "a" : "div";
  const hrefAttr = isHttp ? `href="${esc(url)}" target="_blank" rel="noopener"` : "";
  return `<${tag} class="item" ${hrefAttr}>
    <div class="thumb">${thumb(b)}</div>
    <div class="t"><b>${esc(b.title || hostOf(b.url) || "Untitled")}</b><small>${esc(hostOf(b.url))}${b.folder_path ? " · " + esc(short(b.folder_path)) : ""}</small>${b.snippet ? `<em>${esc(b.snippet)}</em>` : ""}</div>
  </${tag}>`;
}

function renderLib() {
  const q = S.q.trim().toLowerCase();
  let list = S.items.filter((b) => (!S.folder || b.folder_path === S.folder) && (!q || `${b.title} ${b.url} ${b.folder_path}`.toLowerCase().includes(q)));
  if (q.length >= 3) {
    const have = new Set(list.map((b) => b.id));
    list = list.concat(S.remote.filter((b) => !have.has(b.id) && (!S.folder || b.folder_path === S.folder)));
  }
  $("chip").hidden = !S.folder;
  $("chip").innerHTML = S.folder ? `${esc(short(S.folder))} <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>` : "";
  $("list").innerHTML = list.slice(0, 80).map(itemHtml).join("");
  const empty = $("empty");
  empty.hidden = list.length > 0;
  if (!list.length) empty.textContent = !S.cfg.token ? "Sign in on the MarkBase dashboard to see your library." : q ? "No matches." : "Nothing here yet. Bookmarks sync instantly.";
}

function folders() {
  const m = new Map();
  for (const b of S.items) if (b.folder_path) m.set(b.folder_path, (m.get(b.folder_path) || 0) + 1);
  return [...m].sort((a, b) => a[0].localeCompare(b[0]));
}

function folderSvg(name) {
  const h = hue(name);
  return `<svg class="f" viewBox="0 0 160 120"><defs><linearGradient id="g${h}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2b33"/><stop offset="1" stop-color="#15151a"/></linearGradient></defs>
    <path d="M10 24a10 10 0 0 1 10-10h38l12 12h70a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10z" fill="hsl(${h} 65% 58% / .55)"/>
    <rect x="10" y="34" width="140" height="76" rx="10" fill="url(#g${h})" stroke="#383842"/></svg>`;
}

function renderCols() {
  const f = folders();
  $("foldersEmpty").hidden = f.length > 0;
  $("folders").innerHTML = f.map(([name, n]) => `<button class="folder" data-f="${esc(name)}">${folderSvg(name)}<div class="n"><b>${esc(short(name))}</b><span>${n}</span></div></button>`).join("");
}

/* --------------------------------------------------------------- settings */
const fmt = (ts) => { if (!ts) return "never synced"; const s = Math.round((Date.now() - ts) / 1000); return s < 10 ? "just now" : s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); };

function renderSet() {
  const { session, token } = S.cfg;
  $("account").innerHTML = session && session.email
    ? `<div class="av">${session.picture ? `<img src="${esc(session.picture)}" referrerpolicy="no-referrer" alt="">` : esc((session.name || "?")[0])}</div><div class="who"><b>${esc(session.name || "Signed in")}</b><small>${esc(session.email)}</small></div>`
    : token ? `<div class="av">${ICONS.check}</div><div class="who"><b>Connected</b><small>Using a sync token</small></div>`
    : `<div class="who"><b>Not signed in</b><small>Sign in with Google on the dashboard</small></div><button class="btn primary" id="signin">Sign in</button>`;
  const st = S.status, map = { ok: "Library synced", syncing: "Syncing…", error: "Sync failed", unconfigured: "Not connected", paused: "Auto-sync paused" };
  $("statusText").textContent = map[st.phase] || "Idle";
  $("statusSub").textContent = st.phase === "error" ? (st.error || "").slice(0, 90) : st.phase === "unconfigured" ? "Sign in to start syncing" : `${st.count ?? 0} bookmarks · ${fmt(st.lastSyncTs)}`;
  $("autosync").checked = S.cfg.autosync;
  $("syncMinutes").value = String(S.cfg.syncMinutes);
  chrome.alarms.get("markbase-periodic").then((a) => {
    $("nextSync").textContent = a ? `Reconciles every ${S.cfg.syncMinutes}m + instant two-way sync on edits` : "Instant two-way sync active";
  });
  $("smartHistory").checked = S.cfg.smartHistory;
  $("dwellSeconds").value = String(S.cfg.dwellSeconds);
  $("historyCadence").value = String(S.cfg.historyCadence);
  $("historyRetention").value = String(S.cfg.historyRetention);
  $("captureBookmarks").checked = S.cfg.captureBookmarks;
  $("skipPrivate").checked = S.cfg.skipPrivate;
  $("advanced").hidden = !!(session && session.email);
  const d = $("dot"); d.className = "dot " + ({ ok: "ok", error: "err", syncing: "busy" }[st.phase] || "");
  $("syncBtn").classList.toggle("spin", st.phase === "syncing");
}

/* --------------------------------------------------------------- this page */
const ago = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`; };
const dur = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

/** Safe markdown renderer for extracted content */
function md(src) {
  const inline = (t) => esc(t)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  const out = []; let list = false, code = false, buf = [];
  const close = () => { if (list) { out.push("</ul>"); list = false; } };
  for (const line of src.split("\n")) {
    if (line.startsWith("```")) { if (code) { out.push(`<pre>${esc(buf.join("\n"))}</pre>`); buf = []; } else close(); code = !code; continue; }
    if (code) { buf.push(line); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) { close(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (li) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (!line.trim()) { close(); continue; }
    close(); out.push(`<p>${inline(line)}</p>`);
  }
  close();
  return out.join("");
}

async function loadPage() {
  S.page = null;
  if (S.reader) {
    S.tabInfo = { id: null, url: S.reader.url, title: S.reader.title };
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    S.tabInfo = tab ? { id: tab.id, url: tab.url || "", title: tab.title || "" } : null;
  }
  renderPage();
  if (!S.tabInfo || !/^https?:/.test(S.tabInfo.url) || !S.cfg.token) return;
  try { S.page = await api("/v1/page?url=" + encodeURIComponent(S.tabInfo.url)); } catch { S.page = { error: true }; }
  renderPage();
}

function renderPage() {
  const t = S.tabInfo, p = S.page;
  const ok = t && /^https?:/.test(t.url);
  const dwellTime = S.cfg.dwellSeconds || 10;
  $("pageLabel").textContent = S.reader ? "Reading" : "This page";
  $("pageTimer").textContent = S.cfg.smartHistory ? `Smart history · ${dwellTime}s wait` : "Smart history off";
  $("pageTimer").classList.toggle("ok", S.cfg.smartHistory);

  if (!ok) {
    $("pageFav").src = "";
    $("pageFav").hidden = true;
    $("pageTitle").textContent = "No page here";
    $("pageHost").textContent = "Open a website to see its history";
    $("dotBookmark").className = "dot";
    $("txtBookmark").textContent = "N/A";
    $("dotContent").className = "dot";
    $("txtContent").textContent = "N/A";
    $("dotHistory").className = "dot";
    $("txtHistory").textContent = "N/A";
    $("capNow").hidden = true;
    $("quickSave").hidden = true;
    $("forget").hidden = true;
    $("openExternal").style.display = "none";
    $("readerBack").style.display = "none";
    $("pageContent").innerHTML = "";
    return;
  }

  $("pageFav").src = fav(t.url);
  $("pageFav").hidden = false;
  $("pageTitle").textContent = t.title || hostOf(t.url);
  $("pageHost").textContent = hostOf(t.url);

  if (!S.cfg.token) {
    $("dotBookmark").className = "dot";
    $("txtBookmark").textContent = "Sign in first";
    $("dotContent").className = "dot";
    $("txtContent").textContent = "Sign in first";
    $("dotHistory").className = "dot";
    $("txtHistory").textContent = "Sign in first";
    $("capNow").hidden = true;
    $("quickSave").hidden = true;
    $("forget").hidden = true;
    $("pageContent").innerHTML = `<p class="page-hint">Sign in on the MarkBase dashboard to enable two-way sync and smart history.</p>`;
    return;
  }

  if (!p) {
    $("dotBookmark").className = "dot";
    $("txtBookmark").textContent = "Checking…";
    $("dotContent").className = "dot";
    $("txtContent").textContent = "Checking…";
    $("dotHistory").className = "dot";
    $("txtHistory").textContent = "Checking…";
    $("capNow").hidden = false;
    $("quickSave").hidden = false;
    $("forget").hidden = true;
    $("pageContent").innerHTML = "";
    return;
  }

  if (p.error) {
    $("dotBookmark").className = "dot err";
    $("txtBookmark").textContent = "Offline";
    $("dotContent").className = "dot err";
    $("txtContent").textContent = "Offline";
    $("dotHistory").className = "dot err";
    $("txtHistory").textContent = "Offline";
    $("capNow").hidden = false;
    $("quickSave").hidden = false;
    $("forget").hidden = true;
    $("pageContent").innerHTML = `<p class="page-hint">Couldn't reach MarkBase. Check your connection or API status.</p>`;
    return;
  }

  const h = p.history;
  const isBookmarked = !!p.bookmarked;
  $("dotBookmark").className = "dot " + (isBookmarked ? "ok" : "");
  $("txtBookmark").textContent = isBookmarked ? (p.folders?.[0] ? short(p.folders[0]) : "Saved") : "Not saved";

  const hasWords = !!(p.words && p.words > 0);
  $("dotContent").className = "dot " + (hasWords ? "ok" : "");
  $("txtContent").textContent = hasWords ? `${p.words.toLocaleString()} words` : "Not captured yet";

  $("dotHistory").className = "dot " + (h ? "ok" : "");
  $("txtHistory").textContent = h ? `read ${dur(h.dwell_sec)}` : (S.cfg.smartHistory ? "Not remembered" : "Smart history off");

  if (S.reader) {
    $("capNow").hidden = true;
    $("quickSave").hidden = true;
    $("forget").hidden = !h;
    if (t?.url && /^https?:\/\//i.test(t.url)) {
      $("openExternal").style.display = "inline-flex";
      $("openExternal").href = t.url;
    } else {
      $("openExternal").style.display = "none";
      $("openExternal").removeAttribute("href");
    }
    $("readerBack").style.display = "inline-flex";
  } else {
    $("capNow").hidden = false;
    $("capNow").textContent = hasWords ? "Re-capture" : "Capture now";
    $("quickSave").hidden = isBookmarked;
    $("quickSave").textContent = "Save bookmark";
    $("forget").hidden = !h;
    $("openExternal").style.display = "none";
    $("openExternal").removeAttribute("href");
    $("readerBack").style.display = "none";
  }

  $("pageContent").innerHTML = p.content
    ? `<div class="reader"><header><span>Extracted content · kept ${p.retention_days || S.cfg.historyRetention} days</span><span class="link" id="copyMd">Copy</span></header><div class="body">${md(p.content)}</div></div>`
    : `<p class="page-hint">Nothing extracted yet. Tap “Capture now” to read this page and make it searchable.</p>`;
}

async function loadHistory() {
  if (!S.cfg.token) return;
  try {
    const { pages } = await api("/v1/pages");
    S.history = pages;
  } catch { S.history = S.history || []; }
  const hist = S.history || [];
  $("histSectionLabel").textContent = `Recent · Kept ${S.cfg.historyRetention || 60} days`;
  $("histCount").textContent = hist.length ? `${hist.length} pages` : "";
  $("histList").innerHTML = hist.slice(0, 40).map((p) => {
    const url = safeUrl(p.url);
    const favUrl = p.url && /^https?:\/\//i.test(p.url) ? fav(p.url) : "";
    return `<button class="item" data-url="${esc(url)}" data-title="${esc(p.title || "")}" style="text-align:left;width:100%">
      <div class="thumb" style="width:40px;height:40px;color:var(--muted)">${favUrl ? `<img class="fav" src="${esc(favUrl)}" alt="">` : ICONS.history}</div>
      <div class="t"><b>${esc(p.title || p.url || "Untitled")}</b><small>${esc(hostOf(p.url))} · ${ago(p.visited_at)}</small></div></button>`;
  }).join("");
  $("histEmpty").hidden = hist.length > 0;
}

/* ------------------------------------------------------------------ notes */
async function loadNotes() {
  if (!S.cfg.token) return;
  try { S.notes = (await api("/v1/notes")).notes; } catch { /* keep what we have */ }
  $("notesList").innerHTML = S.notes.map((n) => `<button class="item" data-note="${esc(n.id)}" style="text-align:left;width:100%"><div class="t"><b>${esc(n.title || "Untitled")}</b><small>${esc((n.body || "Empty note").slice(0, 70))}</small></div></button>`).join("");
  $("notesEmpty").hidden = S.notes.length > 0;
}

let noteTimer = 0;
async function saveNote() {
  if (!S.note) return;
  S.note.title = $("noteTitle").value; S.note.body = $("noteBody").value;
  await fetch(S.cfg.endpoint + "/v1/notes", { method: "POST", headers: { authorization: `Bearer ${S.cfg.token}`, "content-type": "application/json" }, body: JSON.stringify(S.note) }).catch(() => {});
}
function openNote(n) {
  S.note = n; $("noteTitle").value = n.title || ""; $("noteBody").value = n.body || "";
  show("note");
}

document.addEventListener("click", async (e) => {
  if (e.target.id === "capNow") {
    const b = e.target;
    b.disabled = true;
    b.textContent = "Reading page…";

    let tabId = S.tabInfo?.id;
    if (!tabId) {
      try {
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = activeTab?.id;
        if (activeTab) {
          S.tabInfo = { id: activeTab.id, url: activeTab.url || "", title: activeTab.title || "" };
        }
      } catch (err) {
        console.error("Tab query error:", err);
      }
    }

    if (!tabId) {
      b.disabled = false;
      b.textContent = "No active tab";
      setTimeout(renderPage, 2000);
      return;
    }

    try {
      const r = await chrome.runtime.sendMessage({ type: "capture-now", tabId });
      if (!r?.ok) {
        b.disabled = false;
        b.textContent = r?.error || "Couldn't capture";
        setTimeout(renderPage, 2500);
        return;
      }
      b.textContent = "Captured!";
      await loadPage();
      await refresh();
    } catch (err) {
      b.disabled = false;
      b.textContent = "Capture failed";
      setTimeout(renderPage, 2500);
    }
  }
  if (e.target.id === "forget") {
    await fetch(`${S.cfg.endpoint}/v1/pages?url=${encodeURIComponent(S.tabInfo.url)}`, { method: "DELETE", headers: { authorization: `Bearer ${S.cfg.token}` } }).catch(() => {});
    S.reader = null; await loadPage(); await loadHistory();
  }
  if (e.target.id === "readerBack") { S.reader = null; await loadPage(); }
  const hi = e.target.closest("#histList [data-url]");
  if (hi) {
    S.reader = { url: hi.dataset.url, title: hi.dataset.title };
    await loadPage();
    window.scrollTo(0, 0);
    document.querySelector("main").scrollTo({ top: 0, behavior: "smooth" });
  }
  const ni = e.target.closest("[data-note]");
  if (ni) openNote(S.notes.find((n) => n.id === ni.dataset.note));
  if (e.target.id === "copyMd" && S.page?.content) {
    await navigator.clipboard.writeText(S.page.content);
    e.target.textContent = "Copied";
    setTimeout(() => { e.target.textContent = "Copy"; }, 1200);
  }
});

/* -------------------------------------------------------------------- tabs */
function show(tab) {
  S.tab = tab;
  for (const v of ["lib", "cols", "notes", "note", "hist", "set", "add"]) {
    const el = $("v-" + v);
    if (el) el.hidden = v !== tab;
  }
  document.querySelectorAll(".pill button").forEach((b) => b.classList.toggle("on", b.dataset.tab === (tab === "note" ? "notes" : tab)));
  render();
  if (tab === "hist") { S.reader = null; loadPage(); loadHistory(); }
  if (tab === "notes") loadNotes();
}
function render() { renderLib(); renderCols(); renderSet(); }

function renderChips() {
  const names = ["Bookmarks bar", ...folders().map((f) => f[0]).filter((n) => n !== "Bookmarks bar")];
  $("addChips").innerHTML = names.map((n) => `<button data-c="${esc(n)}" class="${!S.creating && S.addFolder === n ? "on" : ""}"><i style="background:hsl(${hue(n)} 80% 62%)"></i>${esc(short(n))}</button>`).join("") + `<button data-c="__new" class="${S.creating ? "on" : ""}">+ New</button>`;
}
document.addEventListener("click", (e) => {
  const c = e.target.closest("#addChips button");
  if (!c) return;
  if (c.dataset.c === "__new") { S.creating = true; $("addFolder").hidden = false; $("addFolder").focus(); }
  else { S.creating = false; S.addFolder = c.dataset.c; $("addFolder").hidden = true; }
  renderChips();
});

async function openAdd() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $("favicon").src = tab?.url ? fav(tab.url) : "";
  $("addTitle").value = tab?.title || "";
  $("addHost").textContent = tab?.url ? hostOf(tab.url) : "No page";
  $("addFolder").value = ""; $("addFolder").hidden = true;
  $("addMsg").hidden = true;
  S.addFolder = "Bookmarks bar"; S.creating = false;
  renderChips();
  $("saveTab").disabled = !/^https?:/.test(tab?.url || "");
  $("saveTab").dataset.url = tab?.url || "";
  show("add");
}

/* ------------------------------------------------------------------ events */
document.querySelectorAll(".pill button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
$("plus").addEventListener("click", openAdd);
$("newNote").addEventListener("click", async () => {
  const r = await fetch(S.cfg.endpoint + "/v1/notes", { method: "POST", headers: { authorization: `Bearer ${S.cfg.token}`, "content-type": "application/json" }, body: JSON.stringify({ title: "", body: "" }) }).then((x) => x.json()).catch(() => null);
  if (r?.id) openNote({ id: r.id, title: "", body: "" });
});
for (const id of ["noteTitle", "noteBody"]) $(id).addEventListener("input", () => { clearTimeout(noteTimer); noteTimer = setTimeout(saveNote, 700); });
$("noteBack").addEventListener("click", async () => { clearTimeout(noteTimer); await saveNote(); show("notes"); });
$("noteDelete").addEventListener("click", async () => {
  clearTimeout(noteTimer);
  await fetch(`${S.cfg.endpoint}/v1/notes?id=${encodeURIComponent(S.note.id)}`, { method: "DELETE", headers: { authorization: `Bearer ${S.cfg.token}` } }).catch(() => {});
  S.note = null; show("notes");
});
$("openDash").addEventListener("click", () => chrome.tabs.create({ url: S.cfg.endpoint }));
$("chip").addEventListener("click", () => { S.folder = ""; renderLib(); });
$("folders").addEventListener("click", (e) => { const f = e.target.closest(".folder"); if (f) { S.folder = f.dataset.f; show("lib"); } });
document.addEventListener("click", (e) => { if (e.target.id === "signin") chrome.tabs.create({ url: S.cfg.endpoint }); });

let timer = 0;
$("q").addEventListener("input", (e) => {
  S.q = e.target.value; S.remote = []; renderLib();
  clearTimeout(timer);
  if (S.q.trim().length >= 3 && S.cfg.token) timer = setTimeout(async () => {
    try { S.remote = (await api("/v1/search?q=" + encodeURIComponent(S.q.trim()))).bookmarks; renderLib(); } catch { /* offline */ }
  }, 250);
});

const sync = async () => {
  S.status = { ...S.status, phase: "syncing" };
  renderSet();
  await chrome.runtime.sendMessage({ type: "sync-now" });
  await config();
  await refresh();
};
$("syncBtn").addEventListener("click", sync);
$("syncNow").addEventListener("click", sync);

$("quickSave").addEventListener("click", async () => {
  if (!S.tabInfo?.url) return;
  const b = $("quickSave");
  b.disabled = true;
  b.textContent = "Saving…";
  const r = await chrome.runtime.sendMessage({
    type: "save-tab",
    url: S.tabInfo.url,
    title: S.tabInfo.title || hostOf(S.tabInfo.url),
    folder: "Bookmarks bar",
  });
  if (r?.ok) {
    b.textContent = "Saved";
    setTimeout(async () => {
      await loadPage();
      await refresh();
    }, 400);
  } else {
    b.disabled = false;
    b.textContent = "Failed";
  }
});

$("clearAllHistory").addEventListener("click", async () => {
  const btn = $("clearAllHistory");
  btn.disabled = true;
  btn.textContent = "Clearing…";
  await chrome.runtime.sendMessage({ type: "clear-history" });
  btn.disabled = false;
  btn.textContent = "Cleared";
  setTimeout(() => { btn.textContent = "Clear"; }, 1500);
  S.reader = null;
  await loadPage();
  await loadHistory();
});

for (const k of ["autosync", "captureBookmarks", "smartHistory", "skipPrivate"]) {
  const el = $(k);
  if (el) el.addEventListener("change", (e) => {
    S.cfg[k] = e.target.checked;
    set({ [k]: e.target.checked });
    if (k === "smartHistory") renderPage();
  });
}
for (const k of ["syncMinutes", "dwellSeconds", "historyCadence", "historyRetention"]) {
  const el = $(k);
  if (el) el.addEventListener("change", (e) => {
    const val = Number(e.target.value);
    S.cfg[k] = val;
    set({ [k]: val });
    if (k === "historyRetention") $("histSectionLabel").textContent = `Recent · Kept ${val} days`;
    if (k === "dwellSeconds") renderPage();
  });
}

$("saveToken").addEventListener("click", async () => { const t = $("token").value.trim(); if (t) { await set({ token: t }); await sync(); } });

$("saveTab").addEventListener("click", async () => {
  const url = $("saveTab").dataset.url, msg = $("addMsg");
  const r = await chrome.runtime.sendMessage({ type: "save-tab", url, title: $("addTitle").value.trim(), folder: (S.creating && $("addFolder").value.trim()) || S.addFolder || "Bookmarks bar" });
  msg.hidden = false; msg.className = "msg" + (r?.ok ? "" : " err");
  msg.textContent = r?.ok ? "Saved. Syncing to all your devices." : "Couldn't save this page.";
  if (r?.ok) setTimeout(() => { show("lib"); refresh(); }, 900);
});

chrome.storage.onChanged.addListener((ch) => { if (ch.status) { S.status = ch.status.newValue || {}; renderSet(); } });

(async () => {
  await config();
  render();
  await refresh();
  if (S.cfg.token) chrome.runtime.sendMessage({ type: "sync-now" });
})();

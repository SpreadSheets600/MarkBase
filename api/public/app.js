/* MarkBase web library — Auroum-style shell, vanilla JS over the MarkBase API */
const $ = (id) => document.getElementById(id);
const TOKEN_KEY = "markbase_token";

const EMOJI = [
  [/ai|gpt|ml|model/i, "🤖"], [/design|ui|ux|figma/i, "🎨"], [/dev|code|git/i, "🧑‍💻"],
  [/read|book|article|blog/i, "📚"], [/watch|movie|film|video/i, "🎬"], [/anime|manga/i, "🌸"],
  [/icon|asset/i, "🧩"], [/tool|util/i, "🧰"], [/fun|game/i, "🎮"], [/music|song/i, "🎵"],
  [/news/i, "📰"], [/shop|buy/i, "🛍️"], [/food|recipe/i, "🍜"], [/travel/i, "🧭"],
];
const FOLDER_EMOJI = (name) => (EMOJI.find(([re]) => re.test(name)) || [null, "📁"])[1];

const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const favicon = (b) => `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostOf(b.url))}`;

const state = {
  bookmarks: [],
  view: "collections", // collections | all | recent | folder | trash
  folder: "",
  query: "",
  layout: localStorage.getItem("mb_layout") || "grid",
  history: [],
  hIndex: -1,
};

const token = () => localStorage.getItem(TOKEN_KEY) || "";

/* ------------------------------------------------------------ data helpers */
function folders() {
  const m = new Map();
  for (const b of state.bookmarks) {
    const key = b.folder_path || "";
    if (!key) continue;
    if (!m.has(key)) m.set(key, { name: key, count: 0, last: 0 });
    const f = m.get(key);
    f.count++;
    f.last = Math.max(f.last, Number(b.date_added) || 0);
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
function folderShort(name) { return name.split(" / ").pop(); }

function inFolder(b, folder) {
  return folder === "" ? true : (b.folder_path || "") === folder;
}
function filtered() {
  const q = state.query.trim().toLowerCase();
  // A search always looks across the whole library, not just the open folder.
  let list = state.bookmarks;
  if (!q && state.view === "folder") list = list.filter((b) => inFolder(b, state.folder));
  if (q) list = list.filter((b) =>
    (b.title || "").toLowerCase().includes(q) ||
    (b.url || "").toLowerCase().includes(q) ||
    (b.folder_path || "").toLowerCase().includes(q));
  return list;
}

/* ------------------------------------------------------------------ chrome */
function setCrumbs() {
  const names = { collections: "Collections", all: "All Bookmarks", recent: "Recently added", trash: "Trash" };
  let trail;
  if (state.query) trail = ["Search", `“${state.query}”`];
  else if (state.view === "folder") trail = ["Collections", folderShort(state.folder) || "Root"];
  else trail = [names[state.view] || "Collections"];
  $("crumbs").innerHTML =
    `<span class="crumb-muted">Library</span><span class="slash">/</span>` +
    trail.map((t, i) => i === trail.length - 1
      ? `<span class="crumb-current">${esc(t)}</span>`
      : `<span class="crumb-muted">${esc(t)}</span><span class="slash">/</span>`).join("");

  document.querySelectorAll("#mainNav .nav-item").forEach((el) => {
    el.classList.toggle("active", !state.query && el.dataset.view === state.view);
  });
  document.querySelectorAll("#folderNav .nav-item").forEach((el) => {
    el.classList.toggle("active", !state.query && el.dataset.folder === state.folder && state.view === "folder");
  });
}

function renderSidebar() {
  const fs = folders();
  $("cntAll").textContent = state.bookmarks.length;
  $("cntCollections").textContent = fs.length;
  $("cntRecent").textContent = Math.min(state.bookmarks.length, 20);
  $("wsSub").textContent = location.host.replace(/^markbase-api\./, "").replace(/\.workers\.dev$/, " · workers.dev");

  $("folderNav").innerHTML = fs.slice(0, 8).map((f) => `
    <button class="nav-item" data-folder="${esc(f.name)}" title="${esc(f.name)}">
      <span class="folder-dot" style="background:${hueFor(f.name)}"></span>
      <span class="grow folder-name">${esc(folderShort(f.name) || "Root")}</span>
      <span class="count">${f.count}</span>
    </button>`).join("") || `<div class="sidebar-empty">No folders yet</div>`;

  $("userName").textContent = "This device";
  $("userSub").textContent = token() ? `connected · ${location.host}` : "not connected";
  $("userAvatar").style.background = token()
    ? "linear-gradient(140deg,#8b5cf6,#6d28d9)"
    : "linear-gradient(140deg,#a1a1aa,#71717a)";
}

function hueFor(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return `hsl(${h} 55% 58%)`;
}

/* ------------------------------------------------------------------ views */
function renderContent() {
  const el = $("content");
  $("searchKbd").hidden = !!state.query;

  if (state.query) { el.innerHTML = bookmarkMarkup(visibleSorted(filtered()), "Search results"); return; }

  switch (state.view) {
    case "collections": el.innerHTML = collectionsMarkup(); bindFolderTiles(); break;
    case "all": el.innerHTML = bookmarkMarkup(visibleSorted(state.bookmarks), "All Bookmarks"); break;
    case "recent": el.innerHTML = bookmarkMarkup(recent(), "Recently added"); break;
    case "folder": el.innerHTML = bookmarkMarkup(visibleSorted(filtered()), folderShort(state.folder) || "Root", state.folder); break;
    case "trash": el.innerHTML = trashMarkup(); break;
  }
  bindBookmarkCards();
}

function visibleSorted(list) { return [...list].sort((a, b) => (a.title || "").localeCompare(b.title || "")); }
function recent() {
  return [...state.bookmarks].sort((a, b) => (Number(b.date_added) || 0) - (Number(a.date_added) || 0)).slice(0, 24);
}

function collectionsMarkup() {
  const fs = folders();
  if (!fs.length) return emptyMarkup("🗂️", "No collections yet", "Folders from your bookmarks bar show up here automatically after the extension syncs.");
  return `
    <div class="grid">
      ${fs.map((f) => `
        <div class="folder-cell" data-folder="${esc(f.name)}">
          <div class="folder-tile" role="button" tabindex="0" aria-label="${esc(f.name)}"></div>
          <div class="folder-label-row">
            <span class="folder-label">${esc(folderShort(f.name) || "Root")}</span>
            <button class="more-btn" data-menu="${esc(f.name)}" aria-label="Folder actions">
              <svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></svg>
            </button>
          </div>
        </div>`).join("")}
    </div>`;
}

function bookmarkMarkup(list, title, folder = null) {
  if (!list.length) {
    return emptyMarkup("🔍", state.query ? "Nothing matches" : "No bookmarks here yet",
      state.query ? `No bookmark, folder or URL matches “${esc(state.query)}”.`
        : "Add bookmarks in your browser — the extension syncs them within seconds.");
  }
  const head = `
    <div class="view-head">
      <div>
        <div class="view-title">${esc(title)}</div>
        <div class="view-sub">${list.length} bookmark${list.length === 1 ? "" : "s"}${folder ? ` · ${esc(folder)}` : ""}</div>
      </div>
      <div class="view-actions">
        <button class="new-btn compact" id="copyAll">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          Copy links
        </button>
      </div>
    </div>`;

  if (state.layout === "list") {
    return head + `<div class="list-view">${list.map((b) => `
      <div class="lv-row" data-url="${esc(b.url)}" data-title="${esc(b.title)}">
        <div class="bm-fav">${faviconTag(b)}</div>
        <div class="grow bm-meta">
          <div class="bm-title">${esc(b.title || hostOf(b.url) || "Untitled")}</div>
          <div class="bm-sub">${esc(hostOf(b.url))}</div>
        </div>
        <span class="lv-folder">${esc(folderShort(b.folder_path) || "Root")}</span>
        <span class="lv-copy copy-btn" data-url="${esc(b.url)}" title="Copy link">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
        </span>
      </div>`).join("")}</div>`;
  }
  return head + `<div class="bm-grid">${list.map((b) => `
    <a class="bm-card" href="${esc(b.url)}" target="_blank" rel="noopener" data-title="${esc(b.title)}">
      <div class="bm-fav">${faviconTag(b)}</div>
      <div class="bm-meta">
        <div class="bm-title">${esc(b.title || hostOf(b.url) || "Untitled")}</div>
        <div class="bm-sub">${esc(hostOf(b.url))}</div>
      </div>
      <span class="bm-copy copy-btn" data-url="${esc(b.url)}" title="Copy link">
        <svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
      </span>
    </a>`).join("")}</div>`;
}

function faviconTag(b) {
  return `<img src="${favicon(b)}" alt="" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'fallback',textContent:'🌐'}))"/>`;
}

function trashMarkup() {
  return `<div class="empty"><div class="glyph">🗑️</div><h3>Trash is always empty</h3>
    <p>MarkBase has no bin by design: when you delete a bookmark in your browser, the next sync removes it everywhere. Nothing lingers here.</p></div>`;
}
function emptyMarkup(glyph, title, text) {
  return `<div class="empty"><div class="glyph">${glyph}</div><h3>${esc(title)}</h3><p>${text}</p></div>`;
}

function bindFolderTiles() {
  document.querySelectorAll(".folder-cell").forEach((cell) => {
    const go = () => { state.folder = cell.dataset.folder; navigate("folder"); };
    cell.querySelector(".folder-tile").addEventListener("click", go);
    cell.querySelector(".folder-tile").addEventListener("keydown", (e) => { if (e.key === "Enter") go(); });
    cell.querySelector(".more-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      const f = folders().find((x) => x.name === cell.dataset.folder);
      menu(e.currentTarget, [
        ["Open collection", go],
        ["Copy all links", () => copyAll(f ? state.bookmarks.filter((b) => b.folder_path === f.name) : [])],
      ]);
    });
  });
}

function bindBookmarkCards() {
  document.querySelectorAll(".copy-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      copy(btn.dataset.url);
    });
  });
  // In list mode clicking the whole row opens it
  document.querySelectorAll(".lv-row").forEach((row) => {
    row.addEventListener("click", (e) => {
      if (e.target.closest(".copy-btn")) return;
      window.open(row.dataset.url, "_blank", "noopener");
    });
  });
  const ca = document.getElementById("copyAll");
  if (ca) ca.addEventListener("click", () => copyAll(filtered()));
}

/* ---------------------------------------------------------------- actions */
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); }
  catch { toast("Couldn't access the clipboard"); }
}
function copyAll(list) { copy(list.map((b) => b.url).join("\n")); toast(`Copied ${list.length} link${list.length === 1 ? "" : "s"}`); }

function navigate(view, push = true) {
  state.view = view;
  if (push) {
    state.history = state.history.slice(0, state.hIndex + 1);
    state.history.push({ view, folder: state.folder });
    state.hIndex++;
  }
  $("backBtn").disabled = state.hIndex <= 0;
  $("fwdBtn").disabled = state.hIndex >= state.history.length - 1;
  setCrumbs();
  renderContent();
  renderSidebar();
}

function menu(anchor, items) {
  document.querySelector(".mr-menu")?.remove();
  const r = anchor.getBoundingClientRect();
  const el = document.createElement("div");
  el.className = "mr-menu";
  el.style.top = `${r.bottom + 6}px`;
  el.style.left = `${Math.min(r.left, window.innerWidth - 190)}px`;
  items.forEach(([label, fn]) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.onclick = () => { el.remove(); fn(); };
    el.appendChild(b);
  });
  document.body.appendChild(el);
  setTimeout(() => document.addEventListener("click", () => el.remove(), { once: true }), 0);
}

function toast(msg) {
  const t = $("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.hidden = true), 1800);
}

/* ------------------------------------------------------------------- api */
async function load(showSkeleton = true) {
  const t = token();
  if (!t) { showGate(); return; }
  if (showSkeleton) $("content").innerHTML = skeletonMarkup();
  try {
    const res = await fetch("/v1/bookmarks", { headers: { authorization: `Bearer ${t}` } });
    if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); showGate("That token was rejected — check it."); return; }
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const body = await res.json();
    state.bookmarks = body.bookmarks || [];
    $("gate").hidden = true;
    if (state.query) { setCrumbs(); renderContent(); } else navigate(state.view, false);
  } catch (err) {
    $("content").innerHTML = emptyMarkup("⚠️", "Couldn't reach the API", esc(String(err.message || err)) + ". Check your connection and hit Refresh.");
  }
}

function skeletonMarkup() {
  return `<div class="sk-grid">${Array.from({ length: 10 }, () => `<div><div class="sk-folder"></div><div class="sk-line"></div></div>`).join("")}</div>`;
}

/* ------------------------------------------------------------------ gate */
function showGate(message = "") {
  $("gate").hidden = false;
  $("gateError").textContent = message;
  $("gateError").hidden = !message;
  setTimeout(() => $("gateInput")?.focus(), 50);
}

$("gateBtn").addEventListener("click", connectFromGate);
$("gateInput").addEventListener("keydown", (e) => { if (e.key === "Enter") connectFromGate(); });
async function connectFromGate() {
  const t = $("gateInput").value.trim();
  if (!t) { showGate("Paste the token from api/.env first."); return; }
  localStorage.setItem(TOKEN_KEY, t);
  $("gate").hidden = true;
  await load();
}

/* -------------------------------------------------------------- settings */
function openSettings() {
  $("setEndpoint").value = location.origin;
  $("setToken").value = token();
  $("settingsMsg").textContent = "";
  $("settingsModal").hidden = false;
}
$("settingsBtn").onclick = openSettings;
$("settingsBtn2").onclick = openSettings;
$("closeSettings").onclick = () => ($("settingsModal").hidden = true);
$("saveSettings").onclick = async () => {
  localStorage.setItem(TOKEN_KEY, $("setToken").value.trim());
  const res = await fetch("/v1/bookmarks", { headers: { authorization: `Bearer ${$("setToken").value.trim()}` } }).catch(() => null);
  if (res && res.ok) {
    $("settingsMsg").textContent = "✓ Verified — reloading library…";
    setTimeout(() => { $("settingsModal").hidden = true; load(); }, 700);
  } else {
    $("settingsMsg").textContent = "✗ That token didn't work.";
  }
};

/* ------------------------------------------------------------------ help */
$("helpBtn").onclick = () => ($("helpModal").hidden = false);
$("closeHelp").onclick = () => ($("helpModal").hidden = true);

/* ---------------------------------------------------------------- export */
$("exportBtn").onclick = () => {
  if (!state.bookmarks.length) { toast("Nothing to export yet"); return; }
  const lines = ["<!DOCTYPE NETSCAPE-Bookmark-file-1>", "<DL><p>",
    ...state.bookmarks.map((b) => `    <DT><A HREF="${esc(b.url)}">${esc(b.title || b.url)}</A>`),
    "</DL><p>"];
  const blob = new Blob([lines.join("\n")], { type: "text/html" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "markbase-bookmarks.html";
  a.click();
  toast("Exported bookmarks.html");
};

/* --------------------------------------------------------------- controls */
$("mainNav").addEventListener("click", (e) => {
  const item = e.target.closest(".nav-item");
  if (!item) return;
  state.query = "";
  $("search").value = "";
  if (item.dataset.view) {
    if (item.dataset.view === "collections") state.folder = "";
    navigate(item.dataset.view);
  }
});
$("folderNav").addEventListener("click", (e) => {
  const item = e.target.closest(".nav-item");
  if (!item) return;
  state.folder = item.dataset.folder;
  state.query = "";
  $("search").value = "";
  navigate("folder");
});
$("search").addEventListener("input", (e) => { state.query = e.target.value; setCrumbs(); renderContent(); });
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    $("search").focus();
    $("search").select();
  }
  if (e.key === "Escape") { $("search").blur(); $("settingsModal").hidden = true; $("helpModal").hidden = true; }
});
document.querySelectorAll(".seg-btn").forEach((btn) => {
  btn.classList.toggle("active", btn.dataset.layout === state.layout);
  btn.onclick = () => {
    state.layout = btn.dataset.layout;
    localStorage.setItem("mb_layout", state.layout);
    document.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", b === btn));
    renderContent();
  };
});
$("backBtn").onclick = () => {
  if (state.hIndex <= 0) return;
  state.hIndex--;
  const s = state.history[state.hIndex];
  state.view = s.view; state.folder = s.folder;
  $("backBtn").disabled = state.hIndex <= 0;
  $("fwdBtn").disabled = false;
  setCrumbs(); renderContent(); renderSidebar();
};
$("fwdBtn").onclick = () => {
  if (state.hIndex >= state.history.length - 1) return;
  state.hIndex++;
  const s = state.history[state.hIndex];
  state.view = s.view; state.folder = s.folder;
  $("fwdBtn").disabled = state.hIndex >= state.history.length - 1;
  $("backBtn").disabled = false;
  setCrumbs(); renderContent(); renderSidebar();
};
$("refreshBtn").onclick = () => load();
$("refreshBtn2").onclick = () => { load(); toast("Syncing from the cloud…"); };
$("lockBtn").onclick = (e) => {
  e.stopPropagation();
  if (!confirm("Sign this browser out of MarkBase?")) return;
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
};
$("userCard").onclick = openSettings;

// mobile drawer
const menuBtn = document.createElement("button");
menuBtn.id = "menuBtn";
menuBtn.className = "icon-btn";
menuBtn.title = "Menu";
menuBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>';
document.querySelector(".hist").prepend(menuBtn);
menuBtn.onclick = () => $("sidebar").classList.toggle("open");
$("content").addEventListener("click", (e) => { if (e.target.closest(".folder-tile")) $("sidebar").classList.remove("open"); });

/* ------------------------------------------------------------------ theme */
const themeBtn = $("themeBtn");
// Older engines (and jsdom) may not implement matchMedia — never let that
// stop the rest of the dashboard from booting.
const systemDark =
  typeof window.matchMedia === "function" ? window.matchMedia("(prefers-color-scheme: dark)") : null;
const systemPrefersDark = () => !!(systemDark && systemDark.matches);

function applyTheme(theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", theme === "dark" ? "#0a0a0d" : "#fbfbfc");
  if (persist) localStorage.setItem("mb_theme", theme);
}

if (themeBtn) {
  themeBtn.onclick = () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next, true);
    themeBtn.blur();
    toast(next === "dark" ? "Dark mode on" : "Light mode on");
  };
}

// Follow the OS only while the user hasn't picked a side.
if (systemDark && systemDark.addEventListener) {
  systemDark.addEventListener("change", (e) => {
    if (!localStorage.getItem("mb_theme")) applyTheme(e.matches ? "dark" : "light");
  });
}

applyTheme(document.documentElement.dataset.theme || (systemPrefersDark() ? "dark" : "light"));

/* ------------------------------------------------------------------ boot */
renderSidebar();
setCrumbs();
if (token()) load(); else showGate();

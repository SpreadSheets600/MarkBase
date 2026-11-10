/* MarkBase dashboard logic — vanilla JS, no build step */
const $ = (id) => document.getElementById(id);
const TOKEN_KEY = "markbase_token";

let state = { bookmarks: [], folder: "All", query: "" };

const urlHost = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const favicon = (u, host) =>
  `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host || urlHost(u) || "")}`;

const grouped = () => {
  const q = state.query.trim().toLowerCase();
  const items = state.bookmarks.filter((b) => {
    const hit =
      !q ||
      (b.title || "").toLowerCase().includes(q) ||
      (b.url || "").toLowerCase().includes(q) ||
      (b.folder_path || "").toLowerCase().includes(q);
    const inFolder = state.folder === "All" || (b.folder_path || "") === state.folder;
    return hit && inFolder;
  });
  const groups = new Map();
  for (const b of items) {
    const key = b.folder_path || "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(b);
  }
  return { items, groups };
};

const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function renderStats() {
  const folders = new Set(state.bookmarks.map((b) => b.folder_path || "Other"));
  $("countBadge").hidden = false;
  $("countBadge").textContent = `${state.bookmarks.length} bookmarks`;
  $("stats").innerHTML = `
    <div class="glass-card stat"><div class="n">${state.bookmarks.length}</div><div class="l">Bookmarks</div></div>
    <div class="glass-card stat"><div class="n">${folders.size}</div><div class="l">Folders</div></div>
    <div class="glass-card stat"><div class="n">${new Set(state.bookmarks.map((b) => urlHost(b.url))).size}</div><div class="l">Domains</div></div>`;
}

function renderFolders() {
  const counts = new Map();
  for (const b of state.bookmarks) {
    const key = b.folder_path || "Other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const chips = [`<span class="chip ${state.folder === "All" ? "on" : ""}" data-f="All">All · ${state.bookmarks.length}</span>`];
  chips.push(
    ...[...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .filter(([f]) => f !== "All")
      .map(([f, n]) => `<span class="chip ${state.folder === f ? "on" : ""}" data-f="${esc(f)}">${esc(f === "" ? "Root" : f)} · ${n}</span>`),
  );
  $("folders").innerHTML = chips.join("");
  $("folders").onclick = (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.folder = chip.dataset.f;
    render();
  };
}

function renderList() {
  const { items, groups } = grouped();
  $("empty").hidden = items.length > 0;
  let html = "";
  for (const [folder, arr] of groups) {
    html += `<div class="folder-head">${esc(folder === "" ? "Root" : folder)} · ${arr.length}</div>`;
    for (const b of arr) {
      html += `
        <a class="bm" href="${esc(b.url)}" target="_blank" rel="noopener">
          <img src="${favicon(b.url, urlHost(b.url))}" alt="" loading="lazy"
               onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'logo',textContent:'🌐'}))"/>
          <div class="col"><div class="t">${esc(b.title || urlHost(b.url) || "Untitled")}</div>
          <div class="s">${esc(urlHost(b.url))}</div></div>
          <span class="copy" data-url="${esc(b.url)}" title="Copy">⧉</span>
        </a>`;
    }
  }
  $("list").innerHTML = html;
  $("list").onclick = (e) => {
    const c = e.target.closest(".copy");
    if (!c) return;
    e.preventDefault();
    navigator.clipboard.writeText(c.dataset.url);
    c.textContent = "✓";
    setTimeout(() => (c.textContent = "⧉"), 900);
  };
}

function render() {
  renderStats();
  renderFolders();
  renderList();
}

async function load(token) {
  const res = await fetch("/v1/bookmarks", { headers: { authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error("That token didn't work — check SYNC_TOKEN.");
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const body = await res.json();
  state.bookmarks = body.bookmarks || [];
  localStorage.setItem(TOKEN_KEY, token);
  $("gate").hidden = true;
  $("app").hidden = false;
  render();
}

const token = () => localStorage.getItem(TOKEN_KEY) || "";

(async () => {
  if (token()) {
    try {
      await load(token());
      return;
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
  $("gate").hidden = false;
})();

$("gateBtn").addEventListener("click", async () => {
  const t = $("tokenInput").value.trim();
  const err = $("gateError");
  err.hidden = true;
  if (!t) { err.textContent = "Paste the token from `wrangler secret put SYNC_TOKEN`."; err.hidden = false; return; }
  try { await load(t); } catch (e) { err.textContent = e.message; err.hidden = false; }
});
$("tokenInput").addEventListener("keydown", (e) => { if (e.key === "Enter") $("gateBtn").click(); });

$("search").addEventListener("input", (e) => { state.query = e.target.value; renderList(); });
$("searchToggle").addEventListener("click", () => { $("searchWrap").classList.toggle("d-none"); $("search").focus(); });
$("refreshBtn").addEventListener("click", () => token() && load(token()));
$("lockBtn").addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
});

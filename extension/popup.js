/* MarkBase popup. Everything is defensive on purpose: a missing storage key,
   a blocked API or an offline network must never leave a blank popup. */

const $ = (id) => document.getElementById(id);

/* ------------------------------------------------------------- crash guard */
function showFatal(err) {
  const box = $("fatal");
  if (!box) return;
  const msg = (err && (err.message || err.reason?.message || err.reason)) || String(err);
  box.textContent = "The popup hit an error — reopen it, or check the extension's service worker console. (" + msg + ")";
  box.hidden = false;
}

window.addEventListener("error", (e) => showFatal(e.error || e.message));
window.addEventListener("unhandledrejection", (e) => showFatal(e.reason));

/* ------------------------------------------------------------------- utils */
const fmtTime = (ts) => {
  if (!ts) return "—";
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return new Date(ts).toLocaleDateString();
};

const COPY = {
  ok: { text: "Synced", pulse: "ok" },
  syncing: { text: "Syncing…", pulse: "busy" },
  error: { text: "Sync failed", pulse: "err" },
  unconfigured: { text: "Not connected", pulse: "err" },
  paused: { text: "Auto-sync paused", pulse: "" },
  idle: { text: "Idle", pulse: "" },
};

const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* Safe wrappers so a browser without one API still renders the rest. */
const store = {
  async get(keys) {
    if (!chrome?.storage?.local) return {};
    try { return (await chrome.storage.local.get(keys)) || {}; } catch { return {}; }
  },
  async set(obj) {
    if (!chrome?.storage?.local) return;
    try { await chrome.storage.local.set(obj); } catch { /* ignore */ }
  },
};

/* ------------------------------------------------------------------- theme */
const themeBtn = $("themeBtn");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    if (window.MBTheme) window.MBTheme.toggle();
    themeBtn.blur();
  });
}

/* --------------------------------------------------------------- status UI */
function renderStatus(status) {
  const st = status || {};
  const copy = COPY[st.phase] || COPY.idle;
  $("statusText").textContent = copy.text;
  $("pulse").className = `pulse ${copy.pulse}`.trim();
  $("lastText").textContent = fmtTime(st.lastSyncTs);
  $("countText").textContent = st.count ?? 0;
  const err = $("errorText");
  if ((st.phase === "error" || st.phase === "unconfigured") && st.error) {
    err.textContent = st.error;
    err.hidden = false;
  } else {
    err.hidden = true;
  }
}

async function refreshStatus() {
  const { status } = await store.get(["status"]);
  renderStatus(status);
}

function triggerSync() {
  const btn = $("syncNow");
  btn.setAttribute("aria-busy", "true");
  const done = async () => {
    btn.removeAttribute("aria-busy");
    await refreshStatus();
    await refreshLibrary();
  };
  try {
    chrome.runtime.sendMessage({ type: "sync-now" }, () => {
      void chrome.runtime.lastError; // popup may close before the worker answers
      done();
    });
  } catch {
    done();
  }
}

/* ---------------------------------------------------------- folders + config */
async function topFolders() {
  if (!chrome?.bookmarks?.getTree) return [];
  const tree = await chrome.bookmarks.getTree();
  const out = [];
  const countAll = (kids) => (kids || []).reduce((n, k) => n + (k.url ? 1 : countAll(k.children)), 0);
  const root = tree && tree[0];
  for (const rootFolder of root?.children || []) {
    for (const child of rootFolder.children || []) {
      if (child.url) continue; // root-level loose bookmarks aren't folders
      const count = countAll(child.children || []);
      if (count > 0) out.push({ path: `${rootFolder.title} / ${child.title}`, label: child.title, count });
    }
  }
  return out;
}

async function renderFolders() {
  const holder = $("folderList");
  const [{ ignoredFolders = [] }] = await Promise.all([store.get(["ignoredFolders"])]);
  const ignored = Array.isArray(ignoredFolders) ? ignoredFolders : [];
  const folders = await topFolders().catch(() => []);

  if (!folders.length) {
    holder.innerHTML = '<div class="loading-line">No folders found yet — add a bookmark folder and reopen.</div>';
    return;
  }

  holder.innerHTML = folders.map((f) => `
    <label class="folder-row">
      <input type="checkbox" data-path="${esc(f.path)}" ${ignored.includes(f.path) ? "" : "checked"} />
      <span class="fname" title="${esc(f.path)}">${esc(f.label)}</span>
      <span class="fcount">${f.count}</span>
    </label>`).join("");

  holder.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      const next = new Set(ignored);
      cb.checked ? next.delete(cb.dataset.path) : next.add(cb.dataset.path);
      await store.set({ ignoredFolders: [...next] });
      triggerSync();
    });
  });
}

async function loadConfig() {
  const { endpoint = "", token = "", autosync = true } = await store.get(["endpoint", "token", "autosync"]);
  $("endpoint").value = endpoint;
  $("token").value = token;
  $("autosync").checked = autosync !== false;
  return { endpoint: String(endpoint || "").trim().replace(/\/+$/, ""), token: String(token || "").trim() };
}

/* ------------------------------------------------------------------ library */
let allBookmarks = [];

async function refreshLibrary() {
  const { endpoint, token } = await loadConfig();
  const err = $("libError");
  err.hidden = true;
  if (!endpoint || !token) {
    $("libEmpty").hidden = false;
    $("libList").innerHTML = "";
    $("libCount").textContent = "0";
    return;
  }
  try {
    const res = await fetch(`${endpoint}/v1/bookmarks`, { headers: { authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const body = await res.json();
    allBookmarks = body.bookmarks || [];
    $("libCount").textContent = String(allBookmarks.length);
    renderLibrary();
  } catch (e) {
    err.textContent = `Couldn't load the library: ${e.message}`;
    err.hidden = false;
  }
}

function renderLibrary() {
  const q = $("libSearch").value.trim().toLowerCase();
  const list = allBookmarks.filter((b) =>
    !q || (b.title || "").toLowerCase().includes(q) || (b.url || "").toLowerCase().includes(q) ||
    (b.folder_path || "").toLowerCase().includes(q));
  $("libEmpty").hidden = list.length > 0;
  $("libList").innerHTML = list.map((b) => `
    <a class="lib-row" href="${esc(b.url)}" target="_blank" rel="noopener">
      <span class="lib-fav"><img src="https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostOf(b.url))}" alt="" loading="lazy" /></span>
      <span class="lib-meta">
        <span class="lib-title">${esc(b.title || hostOf(b.url) || "Untitled")}</span>
        <span class="lib-sub">${esc(hostOf(b.url))}${b.folder_path ? " · " + esc(b.folder_path.split(" / ").pop()) : ""}</span>
      </span>
    </a>`).join("");
}

/* -------------------------------------------------------------------- tabs */
function switchTab(which) {
  const lib = which === "lib";
  $("tabSync").classList.toggle("active", !lib);
  $("tabLib").classList.toggle("active", lib);
  $("tabSync").setAttribute("aria-selected", String(!lib));
  $("tabLib").setAttribute("aria-selected", String(lib));
  $("panelSync").hidden = lib;
  $("panelLib").hidden = !lib;
  if (lib) {
    refreshLibrary();
    $("libSearch").focus();
  }
}

/* ------------------------------------------------------------------ wiring */
function wire() {
  $("syncNow").addEventListener("click", triggerSync);

  $("autosync").addEventListener("change", async (e) => {
    await store.set({ autosync: e.target.checked });
    if (e.target.checked) triggerSync();
  });

  $("save").addEventListener("click", async () => {
    const endpoint = $("endpoint").value.trim().replace(/\/+$/, "");
    const token = $("token").value.trim();
    await store.set({ endpoint, token });
    $("saveMsg").hidden = false;
    setTimeout(() => ($("saveMsg").hidden = true), 1600);
    triggerSync();
  });

  $("tabSync").addEventListener("click", () => switchTab("sync"));
  $("tabLib").addEventListener("click", () => switchTab("lib"));
  $("libSearch").addEventListener("input", renderLibrary);

  const openDashboard = async (path = "/") => {
    const { endpoint } = await loadConfig();
    const base = endpoint || "https://markbase-api.spreadsheets600.workers.dev";
    chrome.tabs.create({ url: base + path });
  };
  $("openDash").addEventListener("click", () => openDashboard("/"));
  ["openLib", "openLib2", "openHome"].forEach((id) =>
    $(id).addEventListener("click", (e) => { e.preventDefault(); openDashboard("/"); }));

  if (chrome?.storage?.onChanged?.addListener) {
    chrome.storage.onChanged.addListener((_c, area) => { if (area === "local") refreshStatus(); });
  }
}

async function boot() {
  wire();
  // Each panel renders independently — one failure never blanks the popup.
  await Promise.allSettled([refreshStatus(), loadConfig(), renderFolders()]);
  refreshLibrary();
}

boot().catch(showFatal);

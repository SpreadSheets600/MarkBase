const $ = (id) => document.getElementById(id);

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

/* --------------------------------------------------------------- status UI */
function renderStatus(status) {
  const st = status || {};
  const copy = COPY[st.phase] || COPY.idle;
  $("statusText").textContent = copy.text;
  $("pulse").className = `pulse ${copy.pulse}`;
  $("lastText").textContent = fmtTime(st.lastSyncTs);
  $("countText").textContent = st.count ?? 0;
  const err = $("errorText");
  if ((st.phase === "error" || st.phase === "unconfigured") && st.error) {
    err.textContent = st.error; err.hidden = false;
  } else {
    err.hidden = true;
  }
}

async function refreshStatus() {
  const { status } = await chrome.storage.local.get(["status"]);
  renderStatus(status);
}

function triggerSync() {
  $("syncNow").setAttribute("aria-busy", "true");
  chrome.runtime.sendMessage({ type: "sync-now" }, async () => {
    $("syncNow").removeAttribute("aria-busy");
    await refreshStatus();
    await refreshLibrary();
  });
}

/* ---------------------------------------------------------- folders + config */
async function topFolders() {
  const tree = await chrome.bookmarks.getTree();
  const out = [];
  const countAll = (kids) => (kids || []).reduce((n, k) => n + (k.url ? 1 : countAll(k.children)), 0);
  const root = tree[0];
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
  const [{ ignoredFolders = [] }] = await Promise.all([chrome.storage.local.get(["ignoredFolders"])]);
  const folders = await topFolders().catch(() => []);
  if (!folders.length) {
    holder.innerHTML = '<div class="loading-line">No folders found yet.</div>';
    return;
  }
  holder.innerHTML = folders.map((f) => `
    <label class="folder-row">
      <input type="checkbox" data-path="${esc(f.path)}" ${ignoredFolders.includes(f.path) ? "" : "checked"} />
      <span class="fname" title="${esc(f.path)}">${esc(f.label.replace("Bookmarks bar · ", "").replace("Bookmarks bar", "Bar"))}</span>
      <span class="fcount">${f.count}</span>
    </label>`).join("");

  holder.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", async () => {
      const ignored = new Set(ignoredFolders);
      cb.checked ? ignored.delete(cb.dataset.path) : ignored.add(cb.dataset.path);
      await chrome.storage.local.set({ ignoredFolders: [...ignored] });
      triggerSync();
    });
  });
}

async function loadConfig() {
  const { endpoint = "", token = "", autosync = true } = await chrome.storage.local.get(["endpoint", "token", "autosync"]);
  $("endpoint").value = endpoint;
  $("token").value = token;
  $("autosync").checked = autosync !== false;
  return { endpoint: (endpoint || "").trim().replace(/\/+$/, ""), token: (token || "").trim() };
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

/* ------------------------------------------------------------------- boots */
$("syncNow").addEventListener("click", triggerSync);
$("autosync").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ autosync: e.target.checked });
  if (e.target.checked) triggerSync();
});

$("save").addEventListener("click", async () => {
  const endpoint = $("endpoint").value.trim().replace(/\/+$/, "");
  const token = $("token").value.trim();
  await chrome.storage.local.set({ endpoint, token });
  $("saveMsg").hidden = false;
  setTimeout(() => ($("saveMsg").hidden = true), 1600);
  triggerSync();
});

// tabs
function switchTab(which) {
  const lib = which === "lib";
  $("tabSync").classList.toggle("active", !lib);
  $("tabLib").classList.toggle("active", lib);
  $("panelSync").hidden = lib;
  $("panelLib").hidden = !lib;
  document.documentElement.style.height = "auto";
  document.body.style.height = "auto";
  if (lib) { refreshLibrary(); $("libSearch").focus(); }
}
$("tabSync").addEventListener("click", () => switchTab("sync"));
$("tabLib").addEventListener("click", () => switchTab("lib"));
$("libSearch").addEventListener("input", renderLibrary);

async function openDashboard(path = "/") {
  const { endpoint } = await loadConfig();
  const base = endpoint || "https://markbase-api.spreadsheets600.workers.dev";
  chrome.tabs.create({ url: base + path });
}
$("openDash").addEventListener("click", () => openDashboard("/"));
$("openLib").addEventListener("click", (e) => { e.preventDefault(); openDashboard("/"); });
$("openLib2").addEventListener("click", (e) => { e.preventDefault(); openDashboard("/"); });
$("openHome").addEventListener("click", (e) => { e.preventDefault(); openDashboard("/"); });

chrome.storage.onChanged.addListener((_c, area) => { if (area === "local") refreshStatus(); });

(async () => {
  await Promise.all([refreshStatus(), loadConfig(), renderFolders()]);
  refreshLibrary();
})();

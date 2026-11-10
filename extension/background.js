/**
 * MarkBase - MV3 service worker.
 *
 * Two-way bookmark sync (batched - it runs when the browser opens and every 15/30/60 min,
 * not on every edit, so it stays light on requests):
 *   local tree  <->  /v1/changes (delta + cursor)  <->  cloud  <->  other browsers & phone
 *
 * A bookmark's identity is (folder path, url), never the browser's node id, so Chrome,
 * Edge, Brave and Firefox all agree. Each cycle we diff the local tree against what we
 * knew after the last successful sync, push the delta, pull what changed elsewhere and
 * apply it with the bookmarks API. Deletes win over stale copies; failures retry with
 * backoff and never advance the cursor.
 *
 * Page capture: bookmarked pages (and, if enabled, pages you actually read) are turned
 * into clean markdown with Defuddle - the engine behind Obsidian Web Clipper - so they
 * can be searched by content. See capture.js / dwell.js.
 */

const DEFAULT_ENDPOINT = "https://markbase-api.spreadsheets600.workers.dev";
const DEFAULT_SYNC_MIN = 15;
const RETRY_SCHEDULE_MIN = [1, 4, 15];
const MAX_PAYLOAD = 5000;
const MIN_WORDS = 80;

let retryAttempt = 0;
let running = false;
let rerun = false;

/* ------------------------------------------------------------------ init */

/** (Re)arm the batch-sync timer. Alarms don't survive a browser restart, so this runs at startup too. */
async function armAlarm() {
  const { syncMinutes } = await chrome.storage.local.get(["syncMinutes"]);
  const period = [15, 30, 60].includes(syncMinutes) ? syncMinutes : DEFAULT_SYNC_MIN;
  await chrome.alarms.create("markbase-periodic", { periodInMinutes: period, delayInMinutes: period });
}

chrome.runtime.onInstalled.addListener(() => { armAlarm(); syncNow("install"); });
chrome.runtime.onStartup.addListener(() => { armAlarm(); syncNow("startup"); }); // browser opened
chrome.storage.onChanged.addListener((ch) => { if (ch.syncMinutes) armAlarm(); });

/* ------------------------------------------------------- bookmark events */
// Instant, direct 2-way sync: any creation, rename, move, or deletion in Chrome
// triggers an immediate debounced sync (400ms) to Cloudflare, while avoiding loops.
let bookmarkTimer = null;
let applyingRemote = false;

function scheduleBookmarkSync(delay = 400) {
  if (applyingRemote) return;
  clearTimeout(bookmarkTimer);
  bookmarkTimer = setTimeout(() => {
    syncNow("instant-bookmark");
  }, delay);
}

chrome.bookmarks.onCreated.addListener((_id, node) => {
  if (applyingRemote) return;
  if (node && node.url) captureBookmarkedTab(node.url);
  scheduleBookmarkSync(350);
});
chrome.bookmarks.onRemoved.addListener(() => scheduleBookmarkSync(350));
chrome.bookmarks.onChanged.addListener(() => scheduleBookmarkSync(350));
chrome.bookmarks.onMoved.addListener(() => scheduleBookmarkSync(350));
chrome.bookmarks.onChildrenReordered.addListener(() => scheduleBookmarkSync(350));

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "markbase-periodic") syncNow("periodic");
  if (alarm.name === "markbase-retry") syncNow("retry");
});

/* ---------------------------------------------------------------- config */

async function getConfig() {
  const c = await chrome.storage.local.get(["endpoint", "token", "ignoredFolders", "autosync"]);
  return {
    endpoint: (c.endpoint || DEFAULT_ENDPOINT).trim().replace(/\/+$/, ""),
    token: (c.token || "").trim(),
    ignoredFolders: Array.isArray(c.ignoredFolders) ? c.ignoredFolders : [],
    autosync: c.autosync !== false,
  };
}

async function setStatus(patch) {
  const { status = {} } = await chrome.storage.local.get(["status"]);
  await chrome.storage.local.set({ status: { ...status, ...patch } });
  if (patch.phase === "ok") {
    chrome.action.setBadgeText({ text: "" });
  } else if (patch.phase === "error") {
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    chrome.action.setBadgeText({ text: "!" });
  }
}

/* -------------------------------------------------------------- the tree */

/** Same logical root in every browser, whatever it calls it. */
function rootName(node) {
  const t = (node.title || "").toLowerCase();
  if (node.id === "1" || node.id === "toolbar_____" || /(bar|toolbar)$/.test(t)) return "Bookmarks bar";
  if (node.id === "2" || node.id === "unfiled_____" || /^other/.test(t)) return "Other bookmarks";
  if (node.id === "menu________") return "Bookmarks menu";
  if (node.id === "3" || node.id === "mobile______" || /mobile/.test(t)) return "Mobile bookmarks";
  return (node.title || "Bookmarks").trim();
}

const keyOf = (folder, url) => `${folder}\n${url}`;

/** Map<key, {id,title,url,folder_path,sort_index,date_added}> of every http(s) bookmark. */
async function snapshot() {
  const { ignoredFolders } = await getConfig();
  const [tree] = await chrome.bookmarks.getTree();
  const out = new Map();
  const walk = (node, parts) => {
    if (node.url) {
      if (!/^https?:/i.test(node.url)) return;
      const folder = parts.join(" / ");
      if (ignoredFolders.some((ig) => folder === ig || folder.startsWith(ig + " / "))) return;
      out.set(keyOf(folder, node.url), {
        id: node.id, title: node.title || "", url: node.url, folder_path: folder,
        sort_index: typeof node.index === "number" ? node.index : 0,
        date_added: Math.round(node.dateAdded || 0),
      });
    } else {
      for (const c of node.children || []) walk(c, [...parts, (node.title || "").trim()]);
    }
  };
  for (const root of tree.children || []) {
    for (const c of root.children || []) {
      if (c.url) walk(c, [rootName(root)]);
      else walk(c, [rootName(root)]);
    }
  }
  return out;
}

async function rootByName(name) {
  const [tree] = await chrome.bookmarks.getTree();
  const roots = tree.children || [];
  return roots.find((r) => rootName(r) === name) || roots.find((r) => rootName(r) === "Other bookmarks") || roots[0];
}

async function ensureFolder(path) {
  const parts = (path || "").split(" / ").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) parts.push("Other bookmarks");
  let node = await rootByName(parts[0]);
  for (const name of parts.slice(1)) {
    const kids = await chrome.bookmarks.getChildren(node.id);
    let next = kids.find((k) => !k.url && (k.title || "").trim() === name);
    if (!next) next = await chrome.bookmarks.create({ parentId: node.id, title: name });
    node = next;
  }
  return node.id;
}

/* ------------------------------------------------------------------ sync */

async function syncNow(reason = "manual") {
  if (running) { rerun = true; return; }
  running = true;
  try { await doSync(reason); }
  finally {
    running = false;
    if (rerun) { rerun = false; setTimeout(() => syncNow("queued"), 600); }
  }
}

async function doSync(reason) {
  const { endpoint, token, autosync } = await getConfig();
  if (!token) {
    await setStatus({ phase: "unconfigured", reason, error: "Sign in on the MarkBase dashboard to connect this browser." });
    return;
  }
  if (!autosync && reason !== "manual") { await setStatus({ phase: "paused", reason }); return; }

  try {
    await setStatus({ phase: "syncing", reason });
    const local = await snapshot();
    const { cursor = 0, known = null } = await chrome.storage.local.get(["cursor", "known"]);

    const upserts = [];
    const deletes = [];
    for (const [k, b] of local) {
      if (!known || known[k] === undefined || known[k] !== b.title) {
        upserts.push({ url: b.url, title: b.title, folder_path: b.folder_path, sort_index: b.sort_index, date_added: b.date_added });
      }
    }
    if (known) {
      for (const k of Object.keys(known)) {
        if (!local.has(k)) { const [folder_path, url] = k.split("\n"); deletes.push({ folder_path, url }); }
      }
    }

    const res = await fetch(`${endpoint}/v1/changes`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ cursor, upserts: upserts.slice(0, MAX_PAYLOAD), deletes: deletes.slice(0, MAX_PAYLOAD) }),
    });
    if (res.status === 401) throw new Error("Session expired - sign in again on the dashboard.");
    if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text().catch(() => "")).slice(0, 160)}`);
    const body = await res.json();

    // Apply what changed elsewhere.
    const pushed = new Set(upserts.map((u) => keyOf(u.folder_path, u.url)));
    const removed = new Set(deletes.map((d) => keyOf(d.folder_path, d.url)));
    let applied = 0;
    applyingRemote = true;
    try {
      for (const c of body.changes || []) {
        const k = keyOf(c.folder_path || "", c.url);
        if (c.deleted) {
          const mine = local.get(k);
          if (mine && !pushed.has(k)) { await chrome.bookmarks.remove(mine.id).catch(() => {}); applied++; }
        } else if (!local.has(k) && !removed.has(k)) {
          const parentId = await ensureFolder(c.folder_path);
          await chrome.bookmarks.create({ parentId, title: c.title || c.url, url: c.url }).catch(() => {});
          applied++;
        }
      }
    } finally {
      applyingRemote = false;
    }

    // Remember the converged state for the next diff.
    const after = applied ? await snapshot() : local;
    const nextKnown = {};
    for (const [k, b] of after) nextKnown[k] = b.title;
    await chrome.storage.local.set({ cursor: body.cursor, known: nextKnown });

    retryAttempt = 0;
    await chrome.alarms.clear("markbase-retry");
    await setStatus({ phase: "ok", reason, count: after.size, pushed: upserts.length + deletes.length, pulled: applied, lastSyncTs: Date.now(), error: null });

    // One more request carries every page captured since the last sync.
    await flushClips(endpoint, token);

    // Let the server fetch thumbnails/text for anything new (best effort).
    if (upserts.length) fetch(`${endpoint}/v1/enrich`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify({ limit: 8 }) }).catch(() => {});
  } catch (err) {
    const attempt = Math.min(retryAttempt, RETRY_SCHEDULE_MIN.length - 1);
    retryAttempt = attempt + 1;
    chrome.alarms.create("markbase-retry", { delayInMinutes: RETRY_SCHEDULE_MIN[attempt] });
    await setStatus({ phase: "error", reason, error: String((err && err.message) || err) });
    console.error("[markbase] sync failed:", err);
  }
}

/* --------------------------------------------------------- page capture */

const BLOCKED_HOSTS = /(^|\.)(accounts\.google\.com|mail\.google\.com|outlook\.(live|office)\.com|paypal\.com|1password\.com|bitwarden\.com|lastpass\.com|web\.whatsapp\.com)$|bank|login|signin|auth\./i;

async function settings() {
  const s = await chrome.storage.local.get(["captureBookmarks", "smartHistory", "historyExclude", "dwellSeconds"]);
  return {
    captureBookmarks: s.captureBookmarks !== false,
    smartHistory: s.smartHistory !== false,
    dwellSeconds: [10, 30, 60].includes(s.dwellSeconds) ? s.dwellSeconds : 10,
    exclude: s.historyExclude || [],
  };
}

const pendingDwell = new Map(); // tabId -> seconds

async function injectCapture(tabId) {
  try { await chrome.scripting.executeScript({ target: { tabId }, files: ["capture.js"] }); return true; }
  catch { return false; } // restricted page, closed tab, no permission
}

async function captureBookmarkedTab(url) {
  const { captureBookmarks } = await settings();
  if (!captureBookmarks) return;
  const base = url.split("#")[0];
  const tabs = await chrome.tabs.query({}).catch(() => []);
  const tab = tabs.find((t) => t.url && t.url.split("#")[0] === base);
  if (tab) injectCapture(tab.id);
}

let historyFlushTimer = null;
function scheduleHistoryFlush(delayMs = 20000) {
  clearTimeout(historyFlushTimer);
  historyFlushTimer = setTimeout(async () => {
    const { endpoint, token } = await getConfig();
    if (token) await flushClips(endpoint, token);
  }, delayMs);
}

/** Captured pages wait here and go out after a brief interval or with the next sync. */
async function queueClip(page, dwell) {
  const { pendingClips = [] } = await chrome.storage.local.get(["pendingClips"]);
  const next = pendingClips.filter((c) => c.url !== page.url);
  const prev = pendingClips.find((c) => c.url === page.url);
  next.push({ ...page, content: (page.content || "").slice(0, 40000), history: dwell > 0 || !!(prev && prev.history), dwell_sec: (dwell || 0) + ((prev && prev.dwell_sec) || 0) });
  await chrome.storage.local.set({ pendingClips: next.slice(-60) });
  scheduleHistoryFlush(20000); // sync history after 20 seconds
}

async function flushClips(endpoint, token) {
  const { pendingClips = [] } = await chrome.storage.local.get(["pendingClips"]);
  if (!pendingClips.length) return;
  const res = await fetch(`${endpoint}/v1/clip`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ pages: pendingClips }),
  }).catch(() => null);
  if (res && res.ok) await chrome.storage.local.set({ pendingClips: [] });
}

/** Explicit "Capture now" from the popup: send straight away so the popup can show the result. */
async function postClipNow(page) {
  const { endpoint, token } = await getConfig();
  const res = await fetch(`${endpoint}/v1/clip`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ ...page, content: (page.content || "").slice(0, 40000), history: true, dwell_sec: 0 }),
  }).catch(() => null);
  return !!(res && res.ok);
}

const immediate = new Map(); // tabId -> sendResponse for an in-flight "capture now"

/* ------------------------------------------------------------- messages */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg) return false;

  if (msg.type === "sync-now") {
    retryAttempt = 0;
    syncNow("manual").then(() => sendResponse({ done: true }));
    return true;
  }

  if (msg.type === "flush-history") {
    (async () => {
      const { endpoint, token } = await getConfig();
      if (token) await flushClips(endpoint, token);
      sendResponse({ done: true });
    })();
    return true;
  }

  if (msg.type === "clear-history") {
    (async () => {
      await chrome.storage.local.set({ pendingClips: [] });
      const { endpoint, token } = await getConfig();
      if (token) {
        await fetch(`${endpoint}/v1/pages?url=all`, {
          method: "DELETE",
          headers: { authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
      sendResponse({ done: true });
    })();
    return true;
  }

  if (msg.type === "save-tab") {
    (async () => {
      const parentId = await ensureFolder(msg.folder || "Bookmarks bar");
      await chrome.bookmarks.create({ parentId, title: msg.title || msg.url, url: msg.url });
      sendResponse({ ok: true });
      syncNow("manual"); // an explicit save goes out straight away
    })().catch((e) => sendResponse({ ok: false, error: String(e) }));
    return true;
  }

  // Dwell detector (dwell.js) says the user actually read this page.
  if (msg.type === "dwell" && sender.tab) {
    settings().then(async ({ smartHistory, exclude, dwellSeconds }) => {
      let host = "";
      try { host = new URL(msg.url).hostname; } catch { return; }
      if (!smartHistory || BLOCKED_HOSTS.test(host) || exclude.some((d) => host === d || host.endsWith("." + d))) return;
      pendingDwell.set(sender.tab.id, msg.seconds || dwellSeconds || 10);
      injectCapture(sender.tab.id);
    });
    return false;
  }

  // Popup "Capture now" for the page in the active tab.
  if (msg.type === "capture-now") {
    const tabId = msg.tabId;
    immediate.set(tabId, sendResponse);
    injectCapture(tabId).then((ok) => { if (!ok) { immediate.delete(tabId); sendResponse({ ok: false, error: "This page can't be captured." }); } });
    setTimeout(() => { const r = immediate.get(tabId); if (r) { immediate.delete(tabId); r({ ok: false, error: "Timed out." }); } }, 15000);
    return true;
  }

  if (msg.type === "page-captured") {
    const tabId = sender.tab && sender.tab.id;
    const dwell = tabId != null ? pendingDwell.get(tabId) || 0 : 0;
    if (tabId != null) pendingDwell.delete(tabId);
    const cb = tabId != null ? immediate.get(tabId) : null;
    const enough = msg.page && (msg.page.words || 0) >= MIN_WORDS;
    if (cb) {
      immediate.delete(tabId);
      if (!enough) cb({ ok: false, error: msg.error || "Not enough readable text on this page." });
      else postClipNow(msg.page).then((ok) => cb({ ok, words: msg.page.words }));
      return false;
    }
    if (enough) queueClip(msg.page, dwell);
    return false;
  }

  // Session bridge: the dashboard shares the signed-in session with the extension.
  if (msg.type === "website-session" && msg.payload) {
    const { googleSession, token, endpoint } = msg.payload;
    const t = String(token || (googleSession && googleSession.token) || "").trim();
    const e = String(endpoint || "").trim().replace(/\/+$/, "");
    const patch = {};
    if (googleSession) patch.googleSession = googleSession;
    if (t) patch.token = t;
    if (e) patch.endpoint = e;
    if (Object.keys(patch).length) {
      chrome.storage.local.set(patch).then(() => { if (t) { retryAttempt = 0; syncNow("auth"); } }).catch(() => {});
    }
    sendResponse({ done: true });
    return false;
  }

  return false;
});

self.addEventListener("install", () => self.skipWaiting());

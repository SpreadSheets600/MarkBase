/**
 * MarkBase Sync — MV3 service worker.
 *
 * Always keeps an eye on the bookmarks tree:
 *  - instant debounced sync on any bookmark event (create/change/move/delete/import)
 *  - a periodic safety-net re-sync every 30 minutes
 *  - full reconcile on browser start / extension install
 *  - exponential-backoff retry when the API is unreachable
 *
 * Every sync is a full idempotent snapshot POST — the server diffs, we stay simple.
 */

const DEBOUNCE_MS = 1500;        // settle time after bookmark events
const PERIODIC_MIN = 30;         // safety-net full sync cadence
const RETRY_SCHEDULE_MIN = [1, 4, 15]; // backoff steps when a sync fails
const MAX_PAYLOAD = 20000;       // hard cap on bookmarks per snapshot

let debounceTimer = null;
let retryAttempt = 0;
let importing = false;

/* ------------------------------------------------------------------ init */

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("markbase-periodic", { periodInMinutes: PERIODIC_MIN, delayInMinutes: PERIODIC_MIN });
  syncNow("install");
});

chrome.runtime.onStartup.addListener(() => syncNow("startup"));

/* ------------------------------------------------------- bookmark events */

chrome.bookmarks.onCreated.addListener(() => scheduleSync());
chrome.bookmarks.onRemoved.addListener(() => scheduleSync());
chrome.bookmarks.onChanged.addListener(() => scheduleSync());
chrome.bookmarks.onMoved.addListener(() => scheduleSync());
chrome.bookmarks.onChildrenReordered.addListener(() => scheduleSync());
chrome.bookmarks.onImportBegan.addListener(() => { importing = true; });
chrome.bookmarks.onImportEnded.addListener(() => { importing = false; scheduleSync(2000); });

function scheduleSync(delay = DEBOUNCE_MS) {
  if (importing) return; // wait for onImportEnded; big imports sync once
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => syncNow("change"), delay);
}

/* -------------------------------------------------------------- alarms */

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "markbase-periodic" || alarm.name === "markbase-retry") {
    syncNow(alarm.name === "markbase-retry" ? "retry" : "periodic");
  }
});

/* ---------------------------------------------------------------- sync */

async function getConfig() {
  const {
    endpoint = "",
    token = "",
    ignoredFolders = [],
    autosync = true,
  } = await chrome.storage.local.get(["endpoint", "token", "ignoredFolders", "autosync"]);
  return {
    endpoint: (endpoint || "").trim().replace(/\/+$/, ""),
    token: (token || "").trim(),
    ignoredFolders: Array.isArray(ignoredFolders) ? ignoredFolders : [],
    autosync: autosync !== false,
  };
}

async function setStatus(patch) {
  const state = await chrome.storage.local.get(["status"]);
  await chrome.storage.local.set({ status: { ...(state.status || {}), ...patch } });
  if (patch.phase === "ok") {
    chrome.action.setBadgeBackgroundColor({ color: "#22c55e" });
    chrome.action.setBadgeText({ text: patch.count ? String(patch.count) : "" });
  } else if (patch.phase === "error") {
    chrome.action.setBadgeBackgroundColor({ color: "#ef4444" });
    chrome.action.setBadgeText({ text: "!" });
  }
}

async function snapshot() {
  const { ignoredFolders } = await getConfig();
  const tree = await chrome.bookmarks.getTree();
  const out = [];
  const walk = (nodes, folderParts) => {
    for (const node of nodes) {
      if (node.url) {
        if (/^place:/i.test(node.url)) continue; // chrome-internal placeholder
        const folder = folderParts.join(" / ");
        if (ignoredFolders.some((ig) => folder === ig || folder.startsWith(ig + " / "))) continue;
        out.push({
          id: String(node.id),
          parent_id: String(node.parentId || ""),
          title: node.title || "",
          url: node.url,
          folder_path: folder,
          sort_index: typeof node.index === "number" ? node.index : 0,
          date_added: Math.round(node.dateAdded || 0),
        });
      } else if (Array.isArray(node.children)) {
        // Skip the invisible root ("0"); keep named roots like "Bookmarks bar".
        const parts = node.id === "0" ? [] : [...folderParts, (node.title || "").trim()];
        walk(node.children, parts);
      }
    }
  };
  walk(tree, []);
  return out.slice(0, MAX_PAYLOAD);
}

async function syncNow(reason = "manual") {
  const { endpoint, token, autosync } = await getConfig();
  if (!endpoint || !token) {
    await setStatus({ phase: "unconfigured", reason, error: "Set your MarkBase URL and token in the popup." });
    return;
  }
  if (!autosync && reason !== "manual") {
    await setStatus({ phase: "paused", reason });
    return;
  }
  try {
    const bookmarks = await snapshot();
    await setStatus({ phase: "syncing", reason, count: bookmarks.length });

    const res = await fetch(`${endpoint}/v1/sync`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify({ bookmarks, reason, client_time: new Date().toISOString() }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${text.slice(0, 180)}`);
    }

    const body = await res.json();
    retryAttempt = 0;
    await chrome.alarms.clear("markbase-retry");
    await setStatus({
      phase: "ok",
      reason,
      count: bookmarks.length,
      total: body.total,
      lastSyncTs: Date.now(),
      error: null,
    });
  } catch (err) {
    const attempt = Math.min(retryAttempt, RETRY_SCHEDULE_MIN.length - 1);
    retryAttempt = attempt + 1;
    chrome.alarms.create("markbase-retry", { delayInMinutes: RETRY_SCHEDULE_MIN[attempt] });
    await setStatus({ phase: "error", reason, error: String(err && err.message || err) });
    console.error("[markbase] sync failed:", err);
  }
}

/* ------------------------------------------------------- popup messages */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === "sync-now") {
    retryAttempt = 0;
    syncNow("manual").then(() => sendResponse({ done: true }));
    return true; // async
  }
  sendResponse({ done: false });
  return false;
});

self.addEventListener("install", () => self.skipWaiting());

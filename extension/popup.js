const $ = (id) => document.getElementById(id);

const fmtTime = (ts) => {
  if (!ts) return "—";
  const diff = Math.round((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleString();
};

const COPY = {
  ok:        { text: "Synced ✓",    pulse: "ok" },
  syncing:   { text: "Syncing…",    pulse: "busy" },
  error:     { text: "Error",       pulse: "err" },
  unconfigured: { text: "Not set up", pulse: "err" },
  idle:      { text: "Idle",        pulse: "" },
};

async function loadConfig() {
  const { endpoint = "", token = "" } = await chrome.storage.local.get(["endpoint", "token"]);
  $("endpoint").value = endpoint;
  $("token").value = token;
  if (endpoint) {
    try { $("apiHint").textContent = new URL(endpoint).hostname; } catch { $("apiHint").textContent = endpoint; }
    $("openDash").hidden = false;
  } else {
    $("openDash").hidden = true;
  }
}

function render(status) {
  const st = status || {};
  const copy = COPY[st.phase] || COPY.idle;
  $("statusText").textContent = copy.text;
  $("pulse").className = `pulse ${copy.pulse}`;
  $("countText").textContent = st.count != null ? String(st.count) : "—";
  $("lastText").textContent = fmtTime(st.lastSyncTs);
  const err = $("errorText");
  if (st.phase === "error" && st.error) { err.textContent = st.error; err.hidden = false; }
  else if (st.phase === "unconfigured" && st.error) { err.textContent = st.error; err.hidden = false; }
  else err.hidden = true;
}

async function refresh() {
  const { status } = await chrome.storage.local.get(["status"]);
  render(status);
}

$("syncNow").addEventListener("click", async () => {
  $("syncNow").setAttribute("aria-busy", "true");
  chrome.runtime.sendMessage({ type: "sync-now" }, async () => {
    $("syncNow").removeAttribute("aria-busy");
    await refresh();
  });
});

$("openDash").addEventListener("click", async () => {
  const { endpoint } = await chrome.storage.local.get(["endpoint"]);
  if (endpoint) chrome.tabs.create({ url: endpoint });
});

$("save").addEventListener("click", async () => {
  const endpoint = $("endpoint").value.trim().replace(/\/+$/, "");
  const token = $("token").value.trim();
  await chrome.storage.local.set({ endpoint, token });
  const msg = $("saveMsg");
  msg.hidden = false;
  setTimeout(() => { msg.hidden = true; }, 1600);
  await loadConfig();
  chrome.runtime.sendMessage({ type: "sync-now" }, async () => { await refresh(); });
});

chrome.storage.onChanged.addListener((_changes, area) => {
  if (area === "local") refresh();
});

loadConfig();
refresh();

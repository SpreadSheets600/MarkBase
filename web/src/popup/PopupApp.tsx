import React, { useEffect, useState } from "react";
import {
  Bookmark,
  Check,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Folder,
  Globe,
  Loader2,
  Moon,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  Sun,
  Trash2,
} from "lucide-react";
import { Logo } from "@/components/Logo";

interface BookmarkItem {
  id: string;
  url: string;
  title: string;
  folder_path?: string;
  description?: string;
}

interface ExtensionConfig {
  endpoint: string;
  token: string;
  autosync: boolean;
  smartHistory: boolean;
  dwellSeconds: number;
  googleSession: {
    user?: {
      name?: string;
      email?: string;
      picture?: string;
    };
  } | null;
}

interface SyncStatus {
  phase?: string;
  count?: number;
  at?: number;
  err?: string;
}

const DEFAULT_ENDPOINT = "https://markbase-api.spreadsheets600.workers.dev";

export function PopupApp() {
  const [tab, setTab] = useState<"sync" | "library" | "settings">("sync");
  const [cfg, setCfg] = useState<ExtensionConfig>({
    endpoint: DEFAULT_ENDPOINT,
    token: "",
    autosync: true,
    smartHistory: true,
    dwellSeconds: 10,
    googleSession: null,
  });
  const [status, setStatus] = useState<SyncStatus>({});
  const [items, setItems] = useState<BookmarkItem[]>([]);
  const [activeTab, setActiveTab] = useState<{
    id?: number;
    url?: string;
    title?: string;
  } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [endpointInput, setEndpointInput] = useState(DEFAULT_ENDPOINT);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");

    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.get(
        [
          "endpoint",
          "token",
          "autosync",
          "smartHistory",
          "dwellSeconds",
          "googleSession",
          "status",
          "libCache",
        ],
        (rawRes) => {
          const res = rawRes as Record<string, any>;
          const loadedCfg: ExtensionConfig = {
            endpoint:
              typeof res.endpoint === "string"
                ? res.endpoint
                : DEFAULT_ENDPOINT,
            token: typeof res.token === "string" ? res.token : "",
            autosync: res.autosync !== false,
            smartHistory: res.smartHistory !== false,
            dwellSeconds: Number(res.dwellSeconds) || 10,
            googleSession: res.googleSession || null,
          };
          setCfg(loadedCfg);
          setEndpointInput(loadedCfg.endpoint);
          setTokenInput(loadedCfg.token);
          setStatus(res.status || {});
          if (Array.isArray(res.libCache)) setItems(res.libCache);
        },
      );

      chrome.tabs?.query({ active: true, currentWindow: true }, (tabs) => {
        const cur = tabs[0];
        if (cur && cur.url) {
          setActiveTab({ id: cur.id, url: cur.url, title: cur.title });
          chrome.bookmarks?.search({ url: cur.url }, (results) => {
            setIsBookmarked(results && results.length > 0);
          });
        }
      });
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    if (next === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const handleSyncNow = () => {
    setSyncing(true);
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: "sync-now" }, () => {
        setTimeout(() => {
          chrome.storage.local.get(["status", "libCache"], (res) => {
            if (res.status) setStatus(res.status);
            if (Array.isArray(res.libCache)) setItems(res.libCache);
            setSyncing(false);
          });
        }, 1200);
      });
    } else {
      setTimeout(() => setSyncing(false), 800);
    }
  };

  const handleCaptureNow = () => {
    if (!activeTab?.id) return;
    setCapturing(true);
    if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage(
        { type: "capture-now", tabId: activeTab.id },
        (res) => {
          setCapturing(false);
          if (res && res.ok) setIsCaptured(true);
        },
      );
    } else {
      setTimeout(() => {
        setCapturing(false);
        setIsCaptured(true);
      }, 1000);
    }
  };

  const handleToggleBookmark = () => {
    if (!activeTab?.url) return;
    if (typeof chrome !== "undefined" && chrome.bookmarks) {
      if (isBookmarked) {
        chrome.bookmarks.search({ url: activeTab.url }, (res) => {
          for (const b of res || []) chrome.bookmarks.remove(b.id);
          setIsBookmarked(false);
        });
      } else {
        chrome.runtime.sendMessage(
          {
            type: "save-tab",
            url: activeTab.url,
            title: activeTab.title || activeTab.url,
            folder: "Bookmarks bar",
          },
          () => setIsBookmarked(true),
        );
      }
    } else {
      setIsBookmarked(!isBookmarked);
    }
  };

  const handleSaveSettings = () => {
    const cleanEndpoint = endpointInput.trim().replace(/\/+$/, "");
    const cleanToken = tokenInput.trim();
    const updated = { ...cfg, endpoint: cleanEndpoint, token: cleanToken };
    setCfg(updated);
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
      chrome.storage.local.set(
        {
          endpoint: cleanEndpoint,
          token: cleanToken,
          autosync: cfg.autosync,
          smartHistory: cfg.smartHistory,
          dwellSeconds: cfg.dwellSeconds,
        },
        () => {
          setSavedSuccess(true);
          setTimeout(() => setSavedSuccess(false), 2000);
          handleSyncNow();
        },
      );
    }
  };

  const filteredItems = items.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.title?.toLowerCase().includes(q) ||
      b.url?.toLowerCase().includes(q) ||
      b.folder_path?.toLowerCase().includes(q)
    );
  });

  const hostname = activeTab?.url
    ? new URL(activeTab.url).hostname.replace(/^www\./, "")
    : "";

  return (
    <div className="flex flex-col h-[540px] w-[380px] bg-bg text-fg select-none font-sans overflow-hidden">
      <header className="flex items-center justify-between px-3.5 py-2.5 border-b border-line bg-surface/70 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <Logo size={24} />
          <span className="font-semibold text-sm tracking-tight">MarkBase</span>
          <span
            className={`size-2 rounded-full transition-colors ${
              syncing
                ? "bg-accent animate-pulse"
                : status.phase === "ok"
                  ? "bg-emerald-500"
                  : "bg-muted"
            }`}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition-colors"
            title="Instant 2-way sync"
          >
            <RefreshCw
              className={`size-4 ${syncing ? "animate-spin text-accent" : ""}`}
            />
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition-colors"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </button>
          <a
            href={cfg.endpoint}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-muted hover:text-fg hover:bg-elevated transition-colors"
            title="Open web dashboard"
          >
            <ExternalLink className="size-4" />
          </a>
        </div>
      </header>

      <nav className="flex items-center border-b border-line bg-surface/40 px-3 text-xs font-medium shrink-0">
        <button
          onClick={() => setTab("sync")}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            tab === "sync"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-muted hover:text-fg"
          }`}
        >
          <RefreshCw className="size-3.5" />
          <span>Sync</span>
        </button>
        <button
          onClick={() => setTab("library")}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            tab === "library"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-muted hover:text-fg"
          }`}
        >
          <Folder className="size-3.5" />
          <span>Library ({items.length})</span>
        </button>
        <button
          onClick={() => setTab("settings")}
          className={`flex items-center gap-1.5 py-2 px-2.5 border-b-2 transition-colors ${
            tab === "settings"
              ? "border-accent text-fg font-semibold"
              : "border-transparent text-muted hover:text-fg"
          }`}
        >
          <SettingsIcon className="size-3.5" />
          <span>Setup</span>
        </button>
      </nav>

      <main className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {tab === "sync" && (
          <>
            {activeTab && (
              <section className="bg-surface rounded-xl border border-line p-3 space-y-3 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="size-8 rounded-lg bg-elevated border border-line flex items-center justify-center shrink-0 overflow-hidden">
                    {hostname ? (
                      <img
                        src={`https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(hostname)}`}
                        alt=""
                        className="size-5 object-contain"
                        onError={(e) =>
                          ((e.target as HTMLElement).style.display = "none")
                        }
                      />
                    ) : (
                      <Globe className="size-4 text-muted" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-xs font-medium truncate text-fg"
                      title={activeTab.title}
                    >
                      {activeTab.title || "Current tab"}
                    </h3>
                    <p className="text-[11px] text-muted truncate">
                      {hostname || "Local page"}
                    </p>
                  </div>
                </div>

                <div className="bg-elevated/60 rounded-lg p-2.5 space-y-2 border border-line/60">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Bookmark</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isBookmarked
                          ? "bg-accent/20 text-accent-soft"
                          : "bg-line text-muted"
                      }`}
                    >
                      {isBookmarked ? "Saved" : "Not saved"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Content</span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isCaptured
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-line text-muted"
                      }`}
                    >
                      {isCaptured ? "Captured" : "Not captured yet"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">Smart History</span>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-line text-muted">
                      {cfg.smartHistory
                        ? `${cfg.dwellSeconds}s dwell threshold`
                        : "Disabled"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleToggleBookmark}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                      isBookmarked
                        ? "bg-elevated hover:bg-line text-muted hover:text-fg border border-line"
                        : "bg-accent hover:bg-accent/90 text-white shadow-xs"
                    }`}
                  >
                    <Bookmark className="size-3.5" />
                    <span>
                      {isBookmarked ? "Remove bookmark" : "Save bookmark"}
                    </span>
                  </button>
                  <button
                    onClick={handleCaptureNow}
                    disabled={capturing || isCaptured}
                    className="flex-1 py-1.5 px-3 rounded-lg text-xs font-medium bg-elevated hover:bg-line text-fg border border-line transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {capturing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Clock className="size-3.5" />
                    )}
                    <span>{isCaptured ? "Captured" : "Capture page"}</span>
                  </button>
                </div>
              </section>
            )}

            <section className="bg-surface rounded-xl border border-line p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-fg">
                    {cfg.token ? "Two-Way Sync Active" : "Setup Required"}
                  </h4>
                  <p className="text-[11px] text-muted">
                    {status.at
                      ? `Last sync ${new Date(status.at).toLocaleTimeString()}`
                      : "Syncs with your browser bar"}
                  </p>
                </div>
                <span className="text-xs font-mono font-medium text-accent-soft bg-accent/15 px-2 py-0.5 rounded-md">
                  {status.count ?? items.length} synced
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-line/60">
                <span className="text-xs text-muted">Auto-sync on changes</span>
                <input
                  type="checkbox"
                  checked={cfg.autosync}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setCfg({ ...cfg, autosync: next });
                    if (
                      typeof chrome !== "undefined" &&
                      chrome.storage?.local
                    ) {
                      chrome.storage.local.set({ autosync: next });
                    }
                  }}
                  className="rounded border-line bg-elevated text-accent focus:ring-accent"
                />
              </div>

              <button
                onClick={handleSyncNow}
                disabled={syncing}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-accent hover:bg-accent/90 text-white transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <RefreshCw
                  className={`size-3.5 ${syncing ? "animate-spin" : ""}`}
                />
                <span>{syncing ? "Syncing bookmarks..." : "Sync now"}</span>
              </button>
            </section>
          </>
        )}

        {tab === "library" && (
          <div className="space-y-2.5">
            <div className="relative">
              <Search className="size-3.5 text-muted absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="search"
                placeholder="Search titles, URLs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-surface border border-line rounded-lg text-xs text-fg placeholder:text-muted focus:border-accent outline-none"
              />
            </div>

            <div className="space-y-1.5 max-h-[410px] overflow-y-auto pr-0.5">
              {filteredItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted">
                  No bookmarks found. Use Sync to pull from browser bar.
                </div>
              ) : (
                filteredItems.map((b) => (
                  <a
                    key={b.id || b.url}
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-elevated border border-line/60 transition-colors group"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="text-xs font-medium text-fg truncate group-hover:text-accent-soft transition-colors">
                        {b.title || b.url}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted truncate">
                        <span>{b.folder_path || "Root"}</span>
                        <span>•</span>
                        <span>{new URL(b.url).hostname}</span>
                      </div>
                    </div>
                    <ExternalLink className="size-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </a>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="space-y-3">
            {cfg.googleSession?.user && (
              <div className="flex items-center gap-3 p-3 bg-surface border border-line rounded-xl">
                {cfg.googleSession.user.picture ? (
                  <img
                    src={cfg.googleSession.user.picture}
                    alt=""
                    className="size-9 rounded-full"
                  />
                ) : (
                  <div className="size-9 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-sm">
                    {cfg.googleSession.user.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-fg truncate">
                    {cfg.googleSession.user.name}
                  </div>
                  <div className="text-[11px] text-muted truncate">
                    {cfg.googleSession.user.email}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-surface border border-line rounded-xl p-3 space-y-3">
              <h4 className="text-xs font-semibold text-fg">API Connection</h4>

              <div className="space-y-1">
                <label className="text-[11px] text-muted font-medium">
                  Dashboard URL
                </label>
                <input
                  type="url"
                  value={endpointInput}
                  onChange={(e) => setEndpointInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-elevated border border-line rounded-lg text-xs text-fg focus:border-accent outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-muted font-medium">
                  Sync Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? "text" : "password"}
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="mb_sync_..."
                    className="w-full px-2.5 py-1.5 pr-8 bg-elevated border border-line rounded-lg text-xs text-fg focus:border-accent outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-2 text-muted hover:text-fg"
                  >
                    {showToken ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full py-2 px-3 rounded-lg text-xs font-medium bg-accent hover:bg-accent/90 text-white transition-colors shadow-xs flex items-center justify-center gap-1.5"
              >
                {savedSuccess ? <Check className="size-3.5" /> : null}
                <span>
                  {savedSuccess ? "Saved & Connected!" : "Save & Connect"}
                </span>
              </button>
            </div>

            <div className="bg-surface border border-line rounded-xl p-3 space-y-2">
              <h4 className="text-xs font-semibold text-fg">
                Smart History &amp; Dwell
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted">Reading dwell time</span>
                <select
                  value={cfg.dwellSeconds}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setCfg({ ...cfg, dwellSeconds: next });
                    if (
                      typeof chrome !== "undefined" &&
                      chrome.storage?.local
                    ) {
                      chrome.storage.local.set({ dwellSeconds: next });
                    }
                  }}
                  className="bg-elevated border border-line rounded-md px-2 py-1 text-xs text-fg outline-none"
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

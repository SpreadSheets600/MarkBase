/**
 * MarkBase dwell detector - content script on http(s) pages.
 *
 * Tracks active, focused reading time. When the user stays on a page past the
 * configured threshold (default 10s, or 30s/60s), it notifies the background worker
 * to capture page contents for Smart History and full-text search.
 */
(async () => {
  try {
    if (!/^https?:$/.test(location.protocol) || window.top !== window) return;

    const { smartHistory = true, dwellSeconds = 10, skipPrivate = true } =
      await chrome.storage.local.get(["smartHistory", "dwellSeconds", "skipPrivate"]);

    if (smartHistory === false) return;

    const host = (location.hostname || "").toLowerCase();
    if (skipPrivate !== false && (
      host === "localhost" || host === "127.0.0.1" || host.endsWith(".local") ||
      /^(bank|login|signin|auth|accounts|checkout|mail|admin|sso)\./i.test(host) ||
      /(paypal|stripe|chase|wellsfargo|citi|bankofamerica|1password|bitwarden)/i.test(host)
    )) return;

    const thresholdMs = Math.max(5, Number(dwellSeconds) || 10) * 1000;
    let visibleMs = 0;
    let since = document.visibilityState === "visible" ? Date.now() : 0;
    let triggered = false;

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        since = Date.now();
      } else if (since) {
        visibleMs += Date.now() - since;
        since = 0;
      }
    });

    const timer = setInterval(() => {
      if (triggered) return;
      const total = visibleMs + (since ? Date.now() - since : 0);
      if (total >= thresholdMs) {
        triggered = true;
        clearInterval(timer);
        chrome.runtime.sendMessage(
          { type: "dwell", url: location.href, seconds: Math.round(total / 1000) },
          () => void chrome.runtime.lastError
        );
      }
    }, 1000);
  } catch {
    /* extension reloaded or storage unavailable */
  }
})();

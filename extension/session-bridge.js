/**
 * MarkBase Session Bridge - Content Script
 *
 * Runs on the MarkBase website (same origin as the dashboard).
 * Reads the Google session and sync token from localStorage and passes it to the
 * extension's background worker via chrome.runtime.sendMessage.
 *
 * This provides seamless parity between the website and extension:
 * logging in on the website instantly signs in the extension with zero setup.
 */

(function () {
  "use strict";

  const SESSION_KEY = "markbase_session";
  const TOKEN_KEY   = "markbase_token";

  function readSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function readToken() {
    try {
      const sess = readSession();
      return localStorage.getItem(TOKEN_KEY) || sess?.token || "";
    } catch {
      return "";
    }
  }

  function pushToExtension() {
    const sess  = readSession();
    const token = readToken() || sess?.token || "";
    if (!sess && !token) return;

    try {
      chrome.runtime.sendMessage({
        type: "website-session",
        payload: {
          googleSession: sess,
          token: token,
          endpoint: location.origin,
        },
      }, () => void chrome.runtime.lastError);
    } catch {
      // Extension context invalidated / reloaded
    }
  }

  // Push on initial load
  pushToExtension();

  // Listen for direct postMessage updates from app.js (same page execution)
  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "markbase_session_updated") {
      pushToExtension();
    }
  });

  // Listen for custom event updates from app.js
  window.addEventListener("markbase_auth_change", () => {
    pushToExtension();
  });

  // Listen for storage events from other tabs
  window.addEventListener("storage", (e) => {
    if (e.key === SESSION_KEY || e.key === TOKEN_KEY) {
      pushToExtension();
    }
  });
})();

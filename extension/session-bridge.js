(function () {
  "use strict";

  const SESSION_KEY = "markbase_session";
  const TOKEN_KEY = "markbase_token";

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
    const sess = readSession();
    const token = readToken() || sess?.token || "";
    if (!sess && !token) return;

    try {
      chrome.runtime.sendMessage(
        {
          type: "website-session",
          payload: {
            googleSession: sess,
            token: token,
            endpoint: location.origin,
          },
        },
        () => void chrome.runtime.lastError,
      );
    } catch {}
  }

  pushToExtension();

  window.addEventListener("message", (e) => {
    if (e.data && e.data.type === "markbase_session_updated") {
      pushToExtension();
    }
  });

  window.addEventListener("markbase_auth_change", () => {
    pushToExtension();
  });

  window.addEventListener("storage", (e) => {
    if (e.key === SESSION_KEY || e.key === TOKEN_KEY) {
      pushToExtension();
    }
  });
})();

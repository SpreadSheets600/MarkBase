/* Theme bootstrap for extension pages. Loaded synchronously in <head> so the
   first paint already uses the right palette (no white flash in dark mode).
   Matches the website's THEME_KEY ("markbase_theme") for cross-surface parity. */
(() => {
  const KEY = "markbase_theme";  // same key as the web dashboard
  const KEY_OLD = "mb_theme";    // keep reading old key for existing installs

  const prefersDark = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  let initial = prefersDark() ? "dark" : "light";
  try {
    // prefer the new key, fall back to old, fall back to system
    initial = localStorage.getItem(KEY) || localStorage.getItem(KEY_OLD) || initial;
  } catch {
    /* storage blocked - keep the system value */
  }
  document.documentElement.dataset.theme = initial === "dark" ? "dark" : "light";

  window.MBTheme = {
    get: () => document.documentElement.dataset.theme || "dark",
    set(theme, persist = true) {
      const next = theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      if (persist) {
        try {
          localStorage.setItem(KEY, next);
          localStorage.removeItem(KEY_OLD); // migrate
        } catch {
          /* ignore */
        }
      }
      return next;
    },
    toggle() {
      return window.MBTheme.set(window.MBTheme.get() === "dark" ? "light" : "dark");
    },
  };

  // Wire up the theme button once the DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("themeBtn");
    if (btn) {
      btn.addEventListener("click", () => window.MBTheme.toggle());
    }
  });
})();

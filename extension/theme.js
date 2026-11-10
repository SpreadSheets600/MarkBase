/* Theme bootstrap for extension pages. Loaded synchronously in <head> so the
   first paint already uses the right palette (no white flash in dark mode). */
(() => {
  const KEY = "mb_theme";
  const prefersDark = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

  let initial = prefersDark() ? "dark" : "light";
  try {
    initial = localStorage.getItem(KEY) || initial;
  } catch {
    /* storage blocked — keep the system value */
  }
  document.documentElement.dataset.theme = initial === "dark" ? "dark" : "light";

  window.MBTheme = {
    get: () => document.documentElement.dataset.theme || "light",
    set(theme, persist = true) {
      const next = theme === "dark" ? "dark" : "light";
      document.documentElement.dataset.theme = next;
      if (persist) {
        try {
          localStorage.setItem(KEY, next);
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
})();

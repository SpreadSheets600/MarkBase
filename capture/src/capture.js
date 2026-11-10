// Injected on demand by the background worker (chrome.scripting). Extracts the readable
// content of the current page with Defuddle - the engine behind Obsidian Web Clipper -
// and hands markdown back. Never runs on its own.
import Defuddle from "defuddle/full";

(() => {
  try {
    if (document.querySelector("input[type=password]")) return; // login / account pages
    const r = new Defuddle(document, { markdown: true, url: location.href }).parse();
    const words = r.wordCount || (r.content || "").split(/\s+/).length;
    chrome.runtime.sendMessage({
      type: "page-captured",
      page: {
        url: location.href,
        title: r.title || document.title || "",
        description: r.description || "",
        image: r.image || document.querySelector('meta[property="og:image"]')?.content || "",
        content: r.content || "",
        words,
      },
    });
  } catch (e) {
    chrome.runtime.sendMessage({ type: "page-captured", error: String(e && e.message || e) });
  }
})();

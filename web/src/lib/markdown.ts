const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Small, safe markdown renderer for extracted page content (escape first, then format). */
export function mdToHtml(src: string): string {
  const inline = (t: string) =>
    esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\((https?:[^)\s]+)[^)]*\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  const out: string[] = [];
  let list = false, code = false, buf: string[] = [];
  const close = () => { if (list) { out.push("</ul>"); list = false; } };
  for (const line of src.split("\n")) {
    if (line.startsWith("```")) { if (code) { out.push(`<pre>${esc(buf.join("\n"))}</pre>`); buf = []; } else close(); code = !code; continue; }
    if (code) { buf.push(line); continue; }
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) { close(); out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (li) { if (!list) { out.push("<ul>"); list = true; } out.push(`<li>${inline(li[1])}</li>`); continue; }
    if (!line.trim()) { close(); continue; }
    close(); out.push(`<p>${inline(line)}</p>`);
  }
  close();
  return out.join("");
}

import { useId } from "react";

export const HUES = [262, 190, 152, 38, 350, 320, 220, 90];
export const hue = (s: string) => HUES[[...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % HUES.length, 0)];

/** Dark folder illustration with a tinted back tab; hue is derived from the name. */
export function FolderIcon({ name, className }: { name: string; className?: string }) {
  const id = useId();
  const h = hue(name);
  return (
    <svg viewBox="0 0 160 120" className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2b33" /><stop offset="1" stopColor="#15151a" />
        </linearGradient>
      </defs>
      <path d="M10 24a10 10 0 0 1 10-10h38l12 12h70a10 10 0 0 1 10 10v66a10 10 0 0 1-10 10H20a10 10 0 0 1-10-10z" fill={`hsl(${h} 65% 58% / 0.55)`} />
      <rect x="10" y="34" width="140" height="76" rx="10" fill={`url(#${id})`} stroke="#383842" />
      <rect x="10.5" y="34.5" width="139" height="1" rx="1" fill="#ffffff" opacity=".08" />
    </svg>
  );
}

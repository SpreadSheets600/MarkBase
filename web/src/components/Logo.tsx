import { Bookmark } from "lucide-react";

export const Logo = ({ size = 32 }: { size?: number }) => (
  <div
    style={{ width: size, height: size }}
    className="grid shrink-0 place-items-center rounded-[10px] bg-gradient-to-br from-accent to-indigo-500 text-white shadow-[0_6px_18px_-6px_rgba(139,92,246,0.8)]"
  >
    <Bookmark
      style={{ width: size * 0.5, height: size * 0.5 }}
      fill="currentColor"
      strokeWidth={0}
    />
  </div>
);

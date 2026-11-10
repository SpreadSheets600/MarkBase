import { useRef, type ReactNode, type MouseEvent } from "react";
import { cn } from "@/lib/utils";

export function SpotlightCard({
  children,
  className,
  color = "rgba(139,92,246,0.16)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (e: MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    ref.current!.style.setProperty("--x", `${e.clientX - r.left}px`);
    ref.current!.style.setProperty("--y", `${e.clientY - r.top}px`);
  };
  return (
    <div
      ref={ref}
      onMouseMove={move}
      style={{ "--spot": color } as React.CSSProperties}
      className={cn(
        "group/spot relative overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-line-strong",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(260px circle at var(--x) var(--y), var(--spot), transparent 70%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

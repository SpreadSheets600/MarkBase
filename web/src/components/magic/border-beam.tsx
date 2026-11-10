// Magic UI - Border Beam
import { cn } from "@/lib/utils";

export function BorderBeam({ size = 90, duration = 10, delay = 0, from = "#8b5cf6", to = "#22d3ee", className }: {
  size?: number; duration?: number; delay?: number; from?: string; to?: string; className?: string;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]"
    >
      <div
        className={cn("absolute aspect-square animate-border-beam bg-gradient-to-l from-[var(--from)] via-[var(--to)] to-transparent", className)}
        style={{
          width: size, offsetPath: `rect(0 auto auto 0 round ${size}px)`,
          "--from": from, "--to": to, "--duration": duration, animationDelay: `-${delay}s`,
        } as React.CSSProperties}
      />
    </div>
  );
}

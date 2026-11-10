import { useId } from "react";
import { cn } from "@/lib/utils";

export function DotPattern({
  width = 22,
  height = 22,
  r = 1,
  className,
}: {
  width?: number;
  height?: number;
  r?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full fill-white/[0.14]",
        className,
      )}
    >
      <defs>
        <pattern
          id={id}
          width={width}
          height={height}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={r + 1} cy={r + 1} r={r} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

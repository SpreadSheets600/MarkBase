import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const ShimmerButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "group relative inline-flex h-11 items-center justify-center gap-2 overflow-hidden rounded-xl px-6 text-sm font-medium text-white",
      "bg-accent shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_8px_24px_-8px_rgba(139,92,246,0.7)] transition-transform active:scale-[0.98]",
      "disabled:opacity-50 disabled:pointer-events-none",
      className,
    )}
    {...props}
  >
    <span className="pointer-events-none absolute inset-0 animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.28)_50%,transparent_65%)] bg-[length:200%_100%]" />
    <span className="relative z-10 inline-flex items-center gap-2">
      {children}
    </span>
  </button>
));
ShimmerButton.displayName = "ShimmerButton";

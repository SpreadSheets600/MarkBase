// shadcn/ui - Input
import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cn(
    "h-10 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm text-fg placeholder:text-subtle",
    "transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25 read-only:text-muted", className)} {...p} />
));
Input.displayName = "Input";

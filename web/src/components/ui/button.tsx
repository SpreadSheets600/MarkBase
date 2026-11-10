import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-fg text-bg hover:bg-white/90",
        accent: "bg-accent text-white hover:bg-accent-soft",
        outline:
          "border border-line-strong bg-transparent text-fg hover:bg-white/[0.04]",
        ghost: "text-muted hover:bg-white/[0.05] hover:text-fg",
      },
      size: { default: "h-9 px-4", sm: "h-8 px-3 text-[13px]", icon: "size-9" },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...p }, ref) => {
    const C = asChild ? Slot : "button";
    return (
      <C
        ref={ref}
        className={cn(button({ variant, size }), className)}
        {...p}
      />
    );
  },
);
Button.displayName = "Button";

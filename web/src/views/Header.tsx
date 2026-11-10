import { Grid2X2, Grid3X3, LayoutGrid, List, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { setPrefs, usePrefs } from "@/lib/prefs";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function LayoutToggle() {
  const p = usePrefs();
  const opts = [
    {
      on: p.layout === "grid" && p.cols === 2,
      set: () => setPrefs({ layout: "grid", cols: 2 }),
      I: Grid2X2,
      l: "2 columns",
    },
    {
      on: p.layout === "grid" && p.cols === 3,
      set: () => setPrefs({ layout: "grid", cols: 3 }),
      I: Grid3X3,
      l: "3 columns",
    },
    {
      on: p.layout === "grid" && p.cols === 4,
      set: () => setPrefs({ layout: "grid", cols: 4 }),
      I: LayoutGrid,
      l: "4 columns",
    },
    {
      on: p.layout === "list",
      set: () => setPrefs({ layout: "list" }),
      I: List,
      l: "List",
    },
  ];
  return (
    <div
      className="hidden rounded-lg border border-line p-0.5 sm:flex"
      role="group"
      aria-label="Layout"
    >
      {opts.map(({ on, set, I, l }) => (
        <button
          key={l}
          onClick={set}
          aria-label={l}
          aria-pressed={on}
          title={l}
          className={cn(
            "grid size-7 place-items-center rounded-md text-subtle transition-colors hover:text-fg",
            on && "bg-white/[0.08] text-fg",
          )}
        >
          <I className="size-3.5" />
        </button>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  onAdd,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  onAdd?: () => void;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2.5 text-2xl font-semibold tracking-tight">
          {icon}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {actions}
        {onAdd && (
          <Button variant="outline" size="sm" onClick={onAdd}>
            <Plus />
            New bookmark
          </Button>
        )}
      </div>
    </div>
  );
}

export function Empty({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line-strong px-6 py-20 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{body}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: 8 }, (_, i) => (
      <div
        key={i}
        className="aspect-[16/12] animate-pulse rounded-2xl border border-line bg-surface"
        style={{ animationDelay: `${i * 80}ms` }}
      />
    ))}
  </div>
);

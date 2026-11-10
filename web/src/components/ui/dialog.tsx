// shadcn/ui - Dialog (Radix)
import * as D from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

export const Dialog = D.Root;
export function DialogContent({ title, description, children, wide }: { title: string; description?: string; children: ReactNode; wide?: boolean }) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in" />
      <D.Content className={`fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line-strong bg-surface p-6 shadow-2xl shadow-black/50 focus:outline-none`}>
        <D.Title className="text-base font-semibold">{title}</D.Title>
        <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
        <div className="mt-5">{children}</div>
        <D.Close aria-label="Close" className="absolute right-4 top-4 rounded-md p-1 text-subtle hover:bg-white/5 hover:text-fg"><X className="size-4" /></D.Close>
      </D.Content>
    </D.Portal>
  );
}

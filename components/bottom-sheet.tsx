"use client";

import { Drawer } from "vaul";
import { cn } from "@/lib/utils";
import { useModalOpen } from "@/lib/ui/use-modal-open";

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function BottomSheet({
  open,
  onOpenChange,
  title,
  children,
  className,
}: BottomSheetProps) {
  useModalOpen(open);

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[999] bg-black/60" />
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-[999] mx-auto flex max-h-[90dvh] max-w-[430px] flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 outline-none",
            className
          )}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-zinc-700" />
          {title && (
            <Drawer.Title className="shrink-0 px-5 pb-2 pt-3 text-lg font-semibold text-zinc-100">
              {title}
            </Drawer.Title>
          )}
          <div className="flex-1 overflow-y-auto px-5 pb-8">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

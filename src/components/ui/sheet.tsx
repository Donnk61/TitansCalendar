import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

type SheetSide = "right" | "bottom";

const sideClassName: Record<SheetSide, string> = {
  right: "ml-auto h-full w-[min(420px,100vw)]",
  bottom: "mt-auto max-h-[85svh] w-full rounded-t-md",
};

export function Sheet({
  children,
  className,
  description,
  open = false,
  side = "right",
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  open?: boolean;
  side?: SheetSide;
  title: string;
}) {
  return (
    <dialog
      aria-label={title}
      className={cn(
        "backdrop:bg-background/80 fixed inset-0 max-h-none max-w-none border border-border bg-surface p-0 text-text-primary shadow-soft",
        sideClassName[side],
        className,
      )}
      open={open}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-5">
        <div className="grid gap-1">
          <h2 className="font-display text-xl font-semibold">{title}</h2>
          {description ? (
            <p className="text-sm leading-6 text-text-secondary">
              {description}
            </p>
          ) : null}
        </div>
        <IconButton icon={<X className="size-4" />} label="Fechar painel" />
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

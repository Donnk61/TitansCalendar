import type { ReactNode } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils/cn";

export function Dialog({
  children,
  className,
  description,
  open = false,
  title,
}: {
  children: ReactNode;
  className?: string;
  description?: string;
  open?: boolean;
  title: string;
}) {
  return (
    <dialog
      aria-label={title}
      className={cn(
        "backdrop:bg-background/80 fixed inset-0 m-auto max-h-[min(720px,90svh)] w-[min(680px,calc(100vw-2rem))] rounded-md border border-border bg-surface p-0 text-text-primary shadow-soft",
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
        <IconButton icon={<X className="size-4" />} label="Fechar janela" />
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

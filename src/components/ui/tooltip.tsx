import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Tooltip({
  children,
  className,
  content,
}: {
  children: ReactNode;
  className?: string;
  content: string;
}) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-56 -translate-x-1/2 rounded-xs border border-border bg-surface-elevated px-2 py-1 text-xs font-medium text-text-primary shadow-soft group-focus-within:block group-hover:block"
        role="tooltip"
      >
        {content}
      </span>
    </span>
  );
}

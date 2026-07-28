import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-sm bg-surface-elevated shadow-[inset_0_0_0_1px_var(--border)]",
        className,
      )}
    />
  );
}

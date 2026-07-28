import type { ReactNode } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function EmptyState({
  action,
  className,
  description,
  icon,
  title,
}: {
  action?: ReactNode;
  className?: string;
  description: string;
  icon?: ReactNode;
  title: string;
}) {
  return (
    <section
      className={cn(
        "grid justify-items-start gap-4 rounded-md border border-dashed border-border bg-surface p-6",
        className,
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-sm border border-border bg-surface-muted text-brand-orange">
        {icon ?? <CalendarDays aria-hidden="true" className="size-5" />}
      </div>
      <div className="grid gap-2">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          {title}
        </h2>
        <p className="max-w-xl text-sm leading-6 text-text-secondary">
          {description}
        </p>
      </div>
      {action ? <div>{action}</div> : null}
    </section>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type SegmentedControlItem = {
  label: string;
  value: string;
  icon?: ReactNode;
};

export function SegmentedControl({
  ariaLabel,
  items,
  onValueChange,
  value,
}: {
  ariaLabel: string;
  items: SegmentedControlItem[];
  onValueChange?: (value: string) => void;
  value: string;
}) {
  return (
    <div
      aria-label={ariaLabel}
      className="inline-flex rounded-sm border border-border bg-surface p-1"
      role="tablist"
    >
      {items.map((item) => {
        const selected = item.value === value;
        const interactiveProps = onValueChange
          ? { onClick: () => onValueChange(item.value) }
          : {};

        return (
          <button
            aria-selected={selected}
            className={cn(
              "inline-flex min-h-9 items-center gap-2 rounded-xs px-3 text-sm font-semibold transition duration-normal",
              selected
                ? "bg-surface-elevated text-text-primary shadow-[inset_0_-2px_0_var(--brand-orange)]"
                : "text-text-secondary hover:text-text-primary",
            )}
            key={item.value}
            role="tab"
            type="button"
            {...interactiveProps}
          >
            {item.icon ? <span aria-hidden="true">{item.icon}</span> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

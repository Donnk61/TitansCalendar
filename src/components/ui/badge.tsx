import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type BadgeTone =
  "neutral" | "red" | "orange" | "amber" | "success" | "danger" | "info";

const toneClassName: Record<BadgeTone, string> = {
  neutral: "border-border bg-surface-muted text-text-secondary",
  red: "border-brand-red/45 bg-brand-red/10 text-text-primary",
  orange: "border-brand-orange/45 bg-brand-orange/10 text-text-primary",
  amber: "border-brand-amber/45 bg-brand-amber/10 text-text-primary",
  success: "border-success/45 bg-success/10 text-text-primary",
  danger: "border-danger/45 bg-danger/10 text-text-primary",
  info: "border-info/45 bg-info/10 text-text-primary",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  icon?: ReactNode;
};

export function Badge({
  children,
  className,
  icon,
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center gap-1.5 rounded-xs border px-2 py-1 text-xs font-semibold",
        toneClassName[tone],
        className,
      )}
      {...props}
    >
      {icon ? <span aria-hidden="true">{icon}</span> : null}
      {children}
    </span>
  );
}

import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertTone = "info" | "warning" | "success" | "danger";

const toneClassName: Record<AlertTone, string> = {
  info: "border-info/45 bg-info/10",
  warning: "border-warning/45 bg-warning/10",
  success: "border-success/45 bg-success/10",
  danger: "border-danger/45 bg-danger/10",
};

const toneIcon = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  danger: AlertTriangle,
};

export function InlineAlert({
  children,
  className,
  title,
  tone = "info",
}: {
  children: ReactNode;
  className?: string;
  title: string;
  tone?: AlertTone;
}) {
  const Icon = toneIcon[tone];

  return (
    <div
      className={cn(
        "flex gap-3 rounded-sm border p-4",
        toneClassName[tone],
        className,
      )}
      role={tone === "danger" ? "alert" : "status"}
    >
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-brand-orange"
      />
      <div className="grid gap-1">
        <p className="font-semibold text-text-primary">{title}</p>
        <div className="text-sm leading-6 text-text-secondary">{children}</div>
      </div>
    </div>
  );
}

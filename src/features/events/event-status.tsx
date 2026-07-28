import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EventStatus } from "@/types/domain";

export const eventStatusConfig: Record<
  EventStatus,
  {
    label: string;
    tone: "neutral" | "orange" | "success" | "danger" | "info";
    icon: typeof CheckCircle2;
  }
> = {
  confirmed: {
    label: "Confirmado",
    tone: "success",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pendente",
    tone: "orange",
    icon: Clock3,
  },
  changed: {
    label: "Alterado",
    tone: "info",
    icon: RefreshCw,
  },
  cancelled: {
    label: "Cancelado",
    tone: "danger",
    icon: XCircle,
  },
  completed: {
    label: "Concluído",
    tone: "neutral",
    icon: CheckCircle2,
  },
};

export function StatusBadge({ status }: { status: EventStatus }) {
  const config = eventStatusConfig[status];
  const Icon = config.icon;

  return (
    <Badge icon={<Icon className="size-3.5" />} tone={config.tone}>
      {config.label}
    </Badge>
  );
}

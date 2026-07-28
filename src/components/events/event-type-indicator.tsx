import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { eventTypeConfig } from "@/features/events/event-type-config";
import type { EventTypeSlug } from "@/types/domain";

type Tone = "neutral" | "red" | "orange" | "amber";

export function EventTypeIndicator({ type }: { type: EventTypeSlug }) {
  const config = eventTypeConfig[type];
  const Icon = config.icon;

  return (
    <Badge
      icon={<Icon className="size-3.5" />}
      style={{ "--event-type-token": config.token } as CSSProperties}
      tone={config.tone as Tone}
    >
      <span
        aria-hidden="true"
        className="mr-0.5 size-1.5 rounded-full"
        style={{ background: "var(--event-type-token)" }}
      />
      {config.label}
    </Badge>
  );
}

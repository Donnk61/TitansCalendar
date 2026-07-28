import {
  CalendarPlus,
  Clock3,
  Flag,
  HandCoins,
  Trophy,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import type { EventTypeSlug } from "@/types/domain";

type EventTypeTone = "red" | "orange" | "amber" | "neutral";

export const eventTypeConfig: Record<
  EventTypeSlug,
  {
    label: string;
    tone: EventTypeTone;
    icon: typeof Users;
    token: string;
  }
> = {
  "general-meeting": {
    label: "Reunião geral",
    tone: "red",
    icon: Users,
    token: "var(--brand-red)",
  },
  "leaders-meeting": {
    label: "Reunião de líderes",
    tone: "orange",
    icon: UsersRound,
    token: "var(--brand-orange)",
  },
  deadline: {
    label: "Prazo",
    tone: "amber",
    icon: Clock3,
    token: "var(--brand-amber)",
  },
  competition: {
    label: "Competição",
    tone: "red",
    icon: Trophy,
    token: "var(--brand-red)",
  },
  "external-event": {
    label: "Evento externo",
    tone: "neutral",
    icon: CalendarPlus,
    token: "var(--text-secondary)",
  },
  "selection-process": {
    label: "Processo seletivo",
    tone: "orange",
    icon: UserPlus,
    token: "var(--brand-orange)",
  },
  fundraising: {
    label: "Arrecadação",
    tone: "amber",
    icon: HandCoins,
    token: "var(--brand-amber)",
  },
  milestone: {
    label: "Marco importante",
    tone: "neutral",
    icon: Flag,
    token: "var(--text-primary)",
  },
};

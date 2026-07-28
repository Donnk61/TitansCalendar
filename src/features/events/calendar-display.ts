import { format, isSameDay, parseISO } from "date-fns";
import { APP_DATE_LOCALE, APP_TIME_ZONE, getWeekRange } from "@/lib/dates";
import type { PublicCalendarEvent } from "@/features/events/public-types";

export const eventTypeColor: Record<string, string> = {
  "general-meeting": "var(--brand-red)",
  "leaders-meeting": "var(--brand-orange)",
  deadline: "var(--brand-amber)",
  competition: "var(--brand-red)",
  "external-event": "var(--text-secondary)",
  "selection-process": "var(--brand-orange)",
  fundraising: "var(--brand-amber)",
  milestone: "var(--text-primary)",
};

export type WeekEventGroup = {
  date: Date;
  label: string;
  events: PublicCalendarEvent[];
};

export function groupEventsByCurrentWeek(
  events: PublicCalendarEvent[],
  now: Date = new Date(),
): WeekEventGroup[] {
  const { start } = getWeekRange(now);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      label: format(date, "EEEE, d 'de' MMM", { locale: APP_DATE_LOCALE }),
      events: events.filter((event) => isSameDay(parseISO(event.start), date)),
    };
  });
}

export function formatEventTime(event: PublicCalendarEvent): string {
  if (event.allDay) {
    return "Dia inteiro";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  }).format(parseISO(event.start));
}

export function getProjectSummary(event: PublicCalendarEvent): string | null {
  if (event.projects.length === 0) {
    return null;
  }

  if (event.projects.length === 1) {
    return event.projects[0].name;
  }

  return `${event.projects[0].name} +${event.projects.length - 1}`;
}

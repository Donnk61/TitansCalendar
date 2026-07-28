import { addDays, compareAsc, formatISO, parseISO } from "date-fns";
import type {
  FullCalendarPublicEvent,
  PublicCalendarEvent,
  PublicEventLink,
  PublicProject,
} from "@/features/events/public-types";
import { eventStatusSchema, eventTypeSlugSchema } from "@/types/domain";

export type PublicEventRecord = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  all_day: boolean;
  type_slug: string;
  status: string;
  location_name: string | null;
  meeting_url: string | null;
  responsible: string | null;
  description: string | null;
  change_note: string | null;
  change_visible_until: string | null;
  is_important: boolean;
  series_id: string | null;
  event_links?: Array<{
    id: string;
    label: string;
    url: string;
    sort_order: number;
  }> | null;
  event_projects?: Array<{
    projects: {
      id: string;
      slug: string;
      name: string;
    } | null;
  }> | null;
};

export function toPublicCalendarEvent(
  record: PublicEventRecord,
  now: Date = new Date(),
): PublicCalendarEvent {
  const type = eventTypeSlugSchema.parse(record.type_slug);
  const status = eventStatusSchema.parse(record.status);

  return {
    id: record.id,
    title: record.title,
    start: record.starts_at,
    end: getPublicEventEnd(record),
    allDay: record.all_day,
    type,
    status,
    projects: getProjects(record),
    location: record.location_name,
    meetingUrl: record.meeting_url,
    responsible: record.responsible,
    description: record.description,
    links: getLinks(record),
    isImportant: record.is_important,
    changeNotice: getChangeNotice(record, now),
    seriesId: record.series_id,
  };
}

export function toFullCalendarEvent(
  event: PublicCalendarEvent,
): FullCalendarPublicEvent {
  return {
    id: event.id,
    title: event.title,
    start: event.start,
    ...(event.end ? { end: event.end } : {}),
    allDay: event.allDay,
    classNames: [
      `event-type-${event.type}`,
      `event-status-${event.status}`,
      event.isImportant ? "event-important" : "event-normal",
    ],
    extendedProps: {
      type: event.type,
      status: event.status,
      projects: event.projects,
      location: event.location,
      meetingUrl: event.meetingUrl,
      responsible: event.responsible,
      description: event.description,
      links: event.links,
      isImportant: event.isImportant,
      changeNotice: event.changeNotice,
      seriesId: event.seriesId,
    },
  };
}

export function sortPublicEvents(
  events: PublicCalendarEvent[],
): PublicCalendarEvent[] {
  return [...events].sort((a, b) => {
    const byStart = compareAsc(parseISO(a.start), parseISO(b.start));

    if (byStart !== 0) {
      return byStart;
    }

    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export function pickWeekSidebarEvents(
  weekEvents: PublicCalendarEvent[],
  nextFutureEvent: PublicCalendarEvent | null,
  now: Date = new Date(),
): PublicCalendarEvent[] {
  const uniqueWeekEvents = dedupeEvents(sortPublicEvents(weekEvents));

  if (uniqueWeekEvents.length > 0) {
    return uniqueWeekEvents;
  }

  if (!nextFutureEvent) {
    return [];
  }

  if (parseISO(nextFutureEvent.start) < now) {
    return [];
  }

  return [nextFutureEvent];
}

function getPublicEventEnd(record: PublicEventRecord): string | null {
  if (!record.ends_at) {
    return null;
  }

  if (!record.all_day) {
    return record.ends_at;
  }

  const endDate = record.ends_at.slice(0, 10);

  return formatISO(addDays(parseISO(endDate), 1), { representation: "date" });
}

function getProjects(record: PublicEventRecord): PublicProject[] {
  const projects = record.event_projects?.flatMap((link) =>
    link.projects ? [link.projects] : [],
  );

  return projects ?? [];
}

function getLinks(record: PublicEventRecord): PublicEventLink[] {
  return [...(record.event_links ?? [])]
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.label.localeCompare(b.label, "pt-BR"),
    )
    .map((link) => ({
      id: link.id,
      label: link.label,
      url: link.url,
      sortOrder: link.sort_order,
    }));
}

function getChangeNotice(record: PublicEventRecord, now: Date): string | null {
  if (
    record.status !== "changed" ||
    !record.change_note ||
    !record.change_visible_until
  ) {
    return null;
  }

  if (parseISO(record.change_visible_until) < now) {
    return null;
  }

  return record.change_note;
}

function dedupeEvents(events: PublicCalendarEvent[]): PublicCalendarEvent[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    if (seen.has(event.id)) {
      return false;
    }

    seen.add(event.id);
    return true;
  });
}

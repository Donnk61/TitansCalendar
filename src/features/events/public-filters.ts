import { isBefore, parseISO } from "date-fns";
import type {
  PublicAnnouncement,
  PublicCalendarEvent,
} from "@/features/events/public-types";
import type { EventStatus, EventTypeSlug } from "@/types/domain";

export type PublicEventFilters = {
  projectSlug: string;
  typeSlug: string;
  quickFilter: "all" | "meetings" | "competitions" | "deadlines";
  status: "all" | Extract<EventStatus, "confirmed" | "pending" | "cancelled">;
};

export const emptyPublicEventFilters: PublicEventFilters = {
  projectSlug: "all",
  typeSlug: "all",
  quickFilter: "all",
  status: "all",
};

const meetingTypes: EventTypeSlug[] = ["general-meeting", "leaders-meeting"];

export function filterPublicEvents(
  events: PublicCalendarEvent[],
  filters: PublicEventFilters,
): PublicCalendarEvent[] {
  return events.filter((event) => {
    if (
      filters.projectSlug !== "all" &&
      !event.projects.some((project) => project.slug === filters.projectSlug)
    ) {
      return false;
    }

    if (filters.typeSlug !== "all" && event.type !== filters.typeSlug) {
      return false;
    }

    if (!matchesQuickFilter(event, filters.quickFilter)) {
      return false;
    }

    if (filters.status !== "all" && event.status !== filters.status) {
      return false;
    }

    return true;
  });
}

export function hasActivePublicFilters(filters: PublicEventFilters): boolean {
  return (
    filters.projectSlug !== emptyPublicEventFilters.projectSlug ||
    filters.typeSlug !== emptyPublicEventFilters.typeSlug ||
    filters.quickFilter !== emptyPublicEventFilters.quickFilter ||
    filters.status !== emptyPublicEventFilters.status
  );
}

export function getVisibleAnnouncements(
  announcements: PublicAnnouncement[],
  now: Date = new Date(),
): PublicAnnouncement[] {
  return announcements.filter((announcement) => {
    const startsAt = parseISO(announcement.startsAt);
    const endsAt = announcement.endsAt ? parseISO(announcement.endsAt) : null;

    return !isBefore(now, startsAt) && (!endsAt || !isBefore(endsAt, now));
  });
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function matchesQuickFilter(
  event: PublicCalendarEvent,
  quickFilter: PublicEventFilters["quickFilter"],
): boolean {
  if (quickFilter === "all") {
    return true;
  }

  if (quickFilter === "meetings") {
    return meetingTypes.includes(event.type);
  }

  if (quickFilter === "competitions") {
    return event.type === "competition";
  }

  return event.type === "deadline";
}

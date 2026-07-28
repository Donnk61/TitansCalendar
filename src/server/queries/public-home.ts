import { addDays } from "date-fns";
import { groupEventsByCurrentWeek } from "@/features/events/calendar-display";
import { toFullCalendarEvent } from "@/features/events/public-adapter";
import {
  demoAnnouncements,
  demoEvents,
  demoEventTypes,
  demoProjects,
  demoSemester,
} from "@/features/events/demo-public-data";
import type {
  FullCalendarPublicEvent,
  PublicAnnouncement,
  PublicCalendarEvent,
  PublicEventType,
  PublicProject,
  PublicSemester,
} from "@/features/events/public-types";
import { toPostgresTimestamp } from "@/lib/dates";
import {
  getActiveSemester,
  listActiveEventTypes,
  listActiveProjects,
  listCurrentAnnouncements,
  listCurrentWeekEvents,
  listPublicEventsByRange,
} from "@/server/queries/public-calendar";
import { toPublicDataError } from "@/server/queries/public-errors";

export type PublicCalendarHomeData = {
  semester: PublicSemester | null;
  events: PublicCalendarEvent[];
  fullCalendarEvents: FullCalendarPublicEvent[];
  weekEvents: PublicCalendarEvent[];
  announcements: PublicAnnouncement[];
  projects: PublicProject[];
  eventTypes: PublicEventType[];
  status:
    "ready" | "no-active-semester" | "empty-semester" | "connection-error";
  source: "supabase" | "demo";
};

export async function getPublicCalendarHomeData(
  now: Date = new Date(),
): Promise<PublicCalendarHomeData> {
  try {
    const semester = await getActiveSemester();

    if (!semester) {
      return {
        semester: null,
        events: [],
        fullCalendarEvents: [],
        weekEvents: [],
        announcements: [],
        projects: [],
        eventTypes: [],
        status: "no-active-semester",
        source: "supabase",
      };
    }

    const [events, week, announcements, projects, eventTypes] =
      await Promise.all([
        listPublicEventsByRange({
          rangeStart: toPostgresTimestamp(
            startOfSemesterWindow(semester.startsOn),
          ),
          rangeEnd: toPostgresTimestamp(
            addDays(endOfSemesterWindow(semester.endsOn), 1),
          ),
        }),
        listCurrentWeekEvents(now),
        listCurrentAnnouncements(now),
        listActiveProjects(),
        listActiveEventTypes(),
      ]);

    return {
      semester,
      events,
      fullCalendarEvents: events.map(toFullCalendarEvent),
      weekEvents: week.events,
      announcements,
      projects,
      eventTypes,
      status: events.length > 0 ? "ready" : "empty-semester",
      source: "supabase",
    };
  } catch (error) {
    const publicError = toPublicDataError(error);

    if (process.env.NODE_ENV !== "production") {
      return getDemoHomeData(now);
    }

    console.error("Public calendar home data failed", publicError);

    return {
      semester: null,
      events: [],
      fullCalendarEvents: [],
      weekEvents: [],
      announcements: [],
      projects: [],
      eventTypes: [],
      status:
        publicError.code === "NO_ACTIVE_SEMESTER"
          ? "no-active-semester"
          : "connection-error",
      source: "supabase",
    };
  }
}

function getDemoHomeData(now: Date): PublicCalendarHomeData {
  const weekEvents = groupEventsByCurrentWeek(demoEvents, now).flatMap(
    (group) => group.events,
  );

  return {
    semester: demoSemester,
    events: demoEvents,
    fullCalendarEvents: demoEvents.map(toFullCalendarEvent),
    weekEvents,
    announcements: demoAnnouncements,
    projects: demoProjects,
    eventTypes: demoEventTypes,
    status: "ready",
    source: "demo",
  };
}

function startOfSemesterWindow(startsOn: string): Date {
  return new Date(`${startsOn}T00:00:00-03:00`);
}

function endOfSemesterWindow(endsOn: string): Date {
  return new Date(`${endsOn}T00:00:00-03:00`);
}

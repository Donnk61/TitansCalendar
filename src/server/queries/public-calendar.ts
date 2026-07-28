import { cache } from "react";
import { addDays } from "date-fns";
import { unstable_cache } from "next/cache";
import { APP_TIME_ZONE, getWeekRange, toPostgresTimestamp } from "@/lib/dates";
import { createSupabasePublicServerClient } from "@/lib/supabase/server";
import {
  pickWeekSidebarEvents,
  sortPublicEvents,
  toPublicCalendarEvent,
} from "@/features/events/public-adapter";
import type {
  PublicAnnouncement,
  PublicCalendarEvent,
  PublicEventType,
  PublicProject,
  PublicSemester,
} from "@/features/events/public-types";
import { normalizeCalendarRange } from "@/features/semesters/range";
import { PublicDataError } from "@/server/queries/public-errors";
import { eventTypeSlugSchema } from "@/types/domain";

const EVENT_SELECT = `
  id,
  title,
  starts_at,
  ends_at,
  all_day,
  type_slug,
  status,
  location_name,
  meeting_url,
  responsible,
  description,
  change_note,
  change_visible_until,
  is_important,
  series_id,
  event_links (
    id,
    label,
    url,
    sort_order
  ),
  event_projects (
    projects (
      id,
      slug,
      name
    )
  )
`;

export const PUBLIC_CALENDAR_TAGS = {
  announcements: "public-announcements",
  calendar: "public-calendar",
  eventTypes: "public-event-types",
  projects: "public-projects",
  semester: "public-semester",
} as const;

export const getActiveSemester = cache(
  async (): Promise<PublicSemester | null> => {
    return getCachedActiveSemester();
  },
);

const getCachedActiveSemester = unstable_cache(
  async (): Promise<PublicSemester | null> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await supabase
      .from("semesters")
      .select("id,name,starts_on,ends_on")
      .eq("is_active", true)
      .is("archived_at", null)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch active semester", error);
      throw new PublicDataError(
        "Falha ao carregar semestre ativo.",
        "CONNECTION_FAILED",
      );
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      startsOn: data.starts_on,
      endsOn: data.ends_on,
    };
  },
  ["public-active-semester"],
  {
    revalidate: 30,
    tags: [PUBLIC_CALENDAR_TAGS.semester],
  },
);

export async function requireActiveSemester(): Promise<PublicSemester> {
  const semester = await getActiveSemester();

  if (!semester) {
    throw new PublicDataError(
      "Nenhum semestre ativo publicado.",
      "NO_ACTIVE_SEMESTER",
    );
  }

  return semester;
}

export async function listPublicEventsByRange(input: {
  rangeStart: string;
  rangeEnd: string;
}): Promise<PublicCalendarEvent[]> {
  const semester = await requireActiveSemester();
  return getCachedPublicEventsByRange(
    semester,
    input.rangeStart,
    input.rangeEnd,
  );
}

const getCachedPublicEventsByRange = unstable_cache(
  async (
    semester: PublicSemester,
    requestedRangeStart: string,
    requestedRangeEnd: string,
  ): Promise<PublicCalendarEvent[]> => {
    const range = normalizeCalendarRange(
      {
        rangeStart: requestedRangeStart,
        rangeEnd: requestedRangeEnd,
      },
      semester,
    );
    const supabase = createSupabasePublicServerClient();

    const rangeStart = toPostgresTimestamp(range.start);
    const rangeEnd = toPostgresTimestamp(range.end);

    const { data, error } = await supabase
      .from("events")
      .select(EVENT_SELECT)
      .eq("semester_id", semester.id)
      .lt("starts_at", rangeEnd)
      .or(`ends_at.is.null,ends_at.gte.${rangeStart}`)
      .order("starts_at", { ascending: true })
      .order("sort_order", {
        ascending: true,
        foreignTable: "event_links",
      });

    if (error) {
      console.error("Failed to fetch public events", error);
      throw new PublicDataError(
        "Falha ao carregar eventos públicos.",
        "CONNECTION_FAILED",
      );
    }

    return sortPublicEvents(
      (data ?? []).map((event) => toPublicCalendarEvent(event)),
    );
  },
  ["public-events-by-range"],
  {
    revalidate: 30,
    tags: [PUBLIC_CALENDAR_TAGS.calendar],
  },
);

export async function listCurrentWeekEvents(now: Date = new Date()): Promise<{
  events: PublicCalendarEvent[];
  nextFutureEvent: PublicCalendarEvent | null;
}> {
  const { end, start } = getWeekRange(now);
  const weekEndExclusive = addDays(end, 1);
  const weekEvents = await listPublicEventsByRange({
    rangeStart: toPostgresTimestamp(start),
    rangeEnd: toPostgresTimestamp(weekEndExclusive),
  });

  const nextFutureEvent =
    weekEvents.length > 0 ? null : await getNextFutureEvent(now);

  return {
    events: pickWeekSidebarEvents(weekEvents, nextFutureEvent, now),
    nextFutureEvent,
  };
}

export async function listActiveProjects(): Promise<PublicProject[]> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id,slug,name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch active projects", error);
    throw new PublicDataError(
      "Falha ao carregar projetos.",
      "CONNECTION_FAILED",
    );
  }

  return data ?? [];
}

export async function listActiveEventTypes(): Promise<PublicEventType[]> {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from("event_types")
    .select("slug,label,color_token,icon_key,sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch event types", error);
    throw new PublicDataError(
      "Falha ao carregar tipos de evento.",
      "CONNECTION_FAILED",
    );
  }

  return (data ?? []).map((type) => ({
    slug: eventTypeSlugSchema.parse(type.slug),
    label: type.label,
    colorToken: type.color_token,
    iconKey: type.icon_key,
    sortOrder: type.sort_order,
  }));
}

export async function listDistinctResponsibles(): Promise<string[]> {
  const semester = await requireActiveSemester();
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase
    .from("events")
    .select("responsible")
    .eq("semester_id", semester.id)
    .not("responsible", "is", null)
    .order("responsible", { ascending: true });

  if (error) {
    console.error("Failed to fetch responsibles", error);
    throw new PublicDataError(
      "Falha ao carregar responsáveis.",
      "CONNECTION_FAILED",
    );
  }

  return [
    ...new Set(
      (data ?? []).flatMap((row) => (row.responsible ? [row.responsible] : [])),
    ),
  ];
}

export async function listCurrentAnnouncements(
  now: Date = new Date(),
): Promise<PublicAnnouncement[]> {
  const semester = await requireActiveSemester();
  const supabase = createSupabasePublicServerClient();
  const timestamp = toPostgresTimestamp(now);

  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,body,severity,starts_at,ends_at,related_event_id")
    .eq("semester_id", semester.id)
    .eq("is_published", true)
    .lte("starts_at", timestamp)
    .or(`ends_at.is.null,ends_at.gte.${timestamp}`)
    .order("starts_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch public announcements", error);
    throw new PublicDataError("Falha ao carregar avisos.", "CONNECTION_FAILED");
  }

  return (data ?? []).map((announcement) => ({
    id: announcement.id,
    title: announcement.title,
    body: announcement.body,
    severity: announcement.severity,
    startsAt: announcement.starts_at,
    endsAt: announcement.ends_at,
    relatedEventId: announcement.related_event_id,
  }));
}

export async function getPublicEventById(
  id: string,
): Promise<PublicCalendarEvent> {
  const semester = await requireActiveSemester();
  const supabase = createSupabasePublicServerClient();

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("id", id)
    .eq("semester_id", semester.id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch public event by id", error);
    throw new PublicDataError("Falha ao carregar evento.", "CONNECTION_FAILED");
  }

  if (!data) {
    throw new PublicDataError("Evento não encontrado.", "EVENT_NOT_FOUND");
  }

  return toPublicCalendarEvent(data);
}

async function getNextFutureEvent(
  now: Date,
): Promise<PublicCalendarEvent | null> {
  const semester = await requireActiveSemester();
  const supabase = createSupabasePublicServerClient();
  const timestamp = toPostgresTimestamp(now);

  const { data, error } = await supabase
    .from("events")
    .select(EVENT_SELECT)
    .eq("semester_id", semester.id)
    .gte("starts_at", timestamp)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch next future event", error);
    throw new PublicDataError(
      "Falha ao carregar próximo evento.",
      "CONNECTION_FAILED",
    );
  }

  return data ? toPublicCalendarEvent(data) : null;
}

export function getCalendarTimeZone() {
  return APP_TIME_ZONE;
}

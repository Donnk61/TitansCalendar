import { describe, expect, it } from "vitest";
import {
  pickWeekSidebarEvents,
  sortPublicEvents,
  toFullCalendarEvent,
  toPublicCalendarEvent,
  type PublicEventRecord,
} from "@/features/events/public-adapter";
import type { PublicCalendarEvent } from "@/features/events/public-types";
import { normalizeCalendarRange } from "@/features/semesters/range";

const baseRecord: PublicEventRecord = {
  id: "event-1",
  title: "Reunião geral",
  starts_at: "2026-08-10T19:00:00-03:00",
  ends_at: "2026-08-10T20:00:00-03:00",
  all_day: false,
  type_slug: "general-meeting",
  status: "confirmed",
  location_name: "Sala TITANS",
  meeting_url: null,
  responsible: "Capitão",
  description: "Alinhamento semanal",
  change_note: null,
  change_visible_until: null,
  is_important: false,
  series_id: null,
  event_links: [
    {
      id: "link-2",
      label: "Ata",
      sort_order: 20,
      url: "https://example.com/ata",
    },
    {
      id: "link-1",
      label: "Pauta",
      sort_order: 10,
      url: "https://example.com/pauta",
    },
  ],
  event_projects: [
    {
      projects: {
        id: "project-1",
        name: "Rover",
        slug: "rover",
      },
    },
  ],
};

describe("public calendar data rules", () => {
  it("clips requested ranges to the active semester", () => {
    const range = normalizeCalendarRange(
      {
        rangeStart: "2026-07-01T00:00:00-03:00",
        rangeEnd: "2026-12-31T00:00:00-03:00",
      },
      {
        startsOn: "2026-08-01",
        endsOn: "2026-12-20",
      },
    );

    expect(range.start.toISOString()).toContain("2026-08-01");
    expect(range.end.toISOString()).toContain("2026-12-21");
  });

  it("rejects overly large public ranges", () => {
    expect(() =>
      normalizeCalendarRange(
        {
          rangeStart: "2026-01-01T00:00:00-03:00",
          rangeEnd: "2026-12-31T00:00:00-03:00",
        },
        {
          startsOn: "2026-01-01",
          endsOn: "2026-12-31",
        },
      ),
    ).toThrow("Intervalo público maior");
  });

  it("adapts all-day multi-day events to FullCalendar exclusive end dates", () => {
    const event = toPublicCalendarEvent({
      ...baseRecord,
      starts_at: "2026-08-10T00:00:00-03:00",
      ends_at: "2026-08-12T00:00:00-03:00",
      all_day: true,
    });

    expect(event.end).toBe("2026-08-13");
  });

  it("converts public events to FullCalendar without leaking database columns", () => {
    const fullCalendarEvent = toFullCalendarEvent(
      toPublicCalendarEvent(baseRecord),
    );

    expect(fullCalendarEvent.extendedProps.projects).toEqual([
      {
        id: "project-1",
        name: "Rover",
        slug: "rover",
      },
    ]);
    expect(
      fullCalendarEvent.extendedProps.links.map((link) => link.label),
    ).toEqual(["Pauta", "Ata"]);
    expect("starts_at" in fullCalendarEvent.extendedProps).toBe(false);
  });

  it("sorts events chronologically and then by title", () => {
    const events = [
      publicEvent("2", "B", "2026-08-11T19:00:00-03:00"),
      publicEvent("3", "A", "2026-08-11T19:00:00-03:00"),
      publicEvent("1", "C", "2026-08-10T19:00:00-03:00"),
    ];

    expect(sortPublicEvents(events).map((event) => event.id)).toEqual([
      "1",
      "3",
      "2",
    ]);
  });

  it("hides expired change notices", () => {
    const event = toPublicCalendarEvent(
      {
        ...baseRecord,
        status: "changed",
        change_note: "Novo horário: 20h",
        change_visible_until: "2026-08-10T19:00:00-03:00",
      },
      new Date("2026-08-11T12:00:00-03:00"),
    );

    expect(event.changeNotice).toBeNull();
  });

  it("uses the next future event when the week is empty", () => {
    const nextFutureEvent = publicEvent(
      "future",
      "Competição",
      "2026-08-20T09:00:00-03:00",
    );

    expect(
      pickWeekSidebarEvents(
        [],
        nextFutureEvent,
        new Date("2026-08-12T09:00:00-03:00"),
      ),
    ).toEqual([nextFutureEvent]);
  });
});

function publicEvent(
  id: string,
  title: string,
  start: string,
): PublicCalendarEvent {
  return {
    id,
    title,
    start,
    end: null,
    allDay: false,
    type: "general-meeting",
    status: "confirmed",
    projects: [],
    location: null,
    meetingUrl: null,
    responsible: null,
    description: null,
    links: [],
    isImportant: false,
    changeNotice: null,
    seriesId: null,
  };
}

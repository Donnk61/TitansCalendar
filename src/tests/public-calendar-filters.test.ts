import { describe, expect, it } from "vitest";
import {
  demoAnnouncements,
  demoEvents,
} from "@/features/events/demo-public-data";
import {
  emptyPublicEventFilters,
  filterPublicEvents,
  getVisibleAnnouncements,
  hasActivePublicFilters,
  isSafeExternalUrl,
} from "@/features/events/public-filters";

describe("public calendar filters", () => {
  it("combines quick filters, project, type, and status", () => {
    const filtered = filterPublicEvents(demoEvents, {
      ...emptyPublicEventFilters,
      projectSlug: "rover",
      quickFilter: "deadlines",
      status: "pending",
      typeSlug: "deadline",
    });

    expect(filtered.map((event) => event.id)).toEqual(["demo-event-2"]);
  });

  it("detects when clearing filters returns to the inactive state", () => {
    expect(
      hasActivePublicFilters({
        ...emptyPublicEventFilters,
        quickFilter: "competitions",
      }),
    ).toBe(true);

    expect(hasActivePublicFilters(emptyPublicEventFilters)).toBe(false);
  });

  it("keeps events without project when no project filter is selected", () => {
    const filtered = filterPublicEvents(demoEvents, emptyPublicEventFilters);

    expect(filtered.some((event) => event.projects.length === 0)).toBe(true);
  });

  it("matches an event with multiple projects by either project", () => {
    const rover = filterPublicEvents(demoEvents, {
      ...emptyPublicEventFilters,
      projectSlug: "rover",
    });
    const vsss = filterPublicEvents(demoEvents, {
      ...emptyPublicEventFilters,
      projectSlug: "vsss",
    });

    expect(rover.some((event) => event.id === "demo-event-2")).toBe(true);
    expect(vsss.some((event) => event.id === "demo-event-2")).toBe(true);
  });

  it("filters cancelled events from the status selector", () => {
    const filtered = filterPublicEvents(demoEvents, {
      ...emptyPublicEventFilters,
      status: "cancelled",
    });

    expect(filtered.map((event) => event.id)).toEqual(["demo-event-5"]);
  });

  it("supports incomplete event details without unsafe links", () => {
    const incompleteEvent = demoEvents.find(
      (event) => event.id === "demo-event-4",
    );

    expect(incompleteEvent?.location).toBeNull();
    expect(incompleteEvent?.description).toBeNull();
    expect(isSafeExternalUrl("https://example.com/pauta")).toBe(true);
    expect(isSafeExternalUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("public announcements", () => {
  it("shows only active announcements and preserves related event ids", () => {
    const visible = getVisibleAnnouncements(
      demoAnnouncements,
      new Date("2026-07-28T12:00:00-03:00"),
    );

    expect(visible).toHaveLength(1);
    expect(visible[0].relatedEventId).toBe("demo-event-1");
  });
});

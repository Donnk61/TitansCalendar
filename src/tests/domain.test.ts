import { describe, expect, it } from "vitest";
import {
  eventSchema,
  eventStatusSchema,
  eventTypeSlugSchema,
  semesterSchema,
} from "@/types/domain";

const timestamp = "2026-07-28T12:00:00-03:00";
const uuid = "019fa939-9871-79c0-81d4-28d8cd3f3e58";

describe("domain contracts", () => {
  it("contains the approved event statuses", () => {
    expect(eventStatusSchema.options).toEqual([
      "confirmed",
      "pending",
      "changed",
      "cancelled",
      "completed",
    ]);
  });

  it("contains the approved event type slugs", () => {
    expect(eventTypeSlugSchema.options).toEqual([
      "general-meeting",
      "leaders-meeting",
      "deadline",
      "competition",
      "external-event",
      "selection-process",
      "fundraising",
      "milestone",
    ]);
  });

  it("rejects a semester ending before it starts", () => {
    const result = semesterSchema.safeParse({
      id: uuid,
      name: "2026.2",
      startsOn: "2026-12-01",
      endsOn: "2026-08-01",
      isActive: true,
      archivedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });

  it("rejects an event ending before it starts", () => {
    const result = eventSchema.safeParse({
      id: uuid,
      semesterId: uuid,
      seriesId: null,
      occurrenceIndex: null,
      title: "Reuniao geral",
      startsAt: "2026-07-28T12:00:00-03:00",
      endsAt: "2026-07-28T11:00:00-03:00",
      allDay: false,
      typeSlug: "general-meeting",
      status: "confirmed",
      locationName: null,
      meetingUrl: null,
      responsible: null,
      description: null,
      changeNote: null,
      changeVisibleUntil: null,
      isImportant: false,
      createdByEmail: "editor@titans.example",
      updatedByEmail: "editor@titans.example",
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    expect(result.success).toBe(false);
  });
});

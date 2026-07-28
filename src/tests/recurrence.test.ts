import { describe, expect, it } from "vitest";
import { generateOccurrences } from "@/features/events/recurrence";

describe("generateOccurrences", () => {
  it("returns one occurrence when recurrence is disabled", () => {
    const occurrences = generateOccurrences({
      allDay: false,
      endsAt: new Date("2026-07-28T23:30:00.000Z"),
      frequency: "none",
      repeatUntil: null,
      semesterEndsOn: "2026-12-20",
      startsAt: new Date("2026-07-28T22:00:00.000Z"),
    });

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0].index).toBe(0);
  });

  it("generates weekly occurrences", () => {
    const occurrences = generateOccurrences({
      allDay: false,
      endsAt: new Date("2026-07-28T23:00:00.000Z"),
      frequency: "weekly",
      repeatUntil: "2026-08-12",
      semesterEndsOn: "2026-12-20",
      startsAt: new Date("2026-07-28T22:00:00.000Z"),
    });

    expect(occurrences.map((item) => item.startsAt.toISOString())).toEqual([
      "2026-07-28T22:00:00.000Z",
      "2026-08-04T22:00:00.000Z",
      "2026-08-11T22:00:00.000Z",
    ]);
  });

  it("generates biweekly occurrences without exceeding semester end", () => {
    const occurrences = generateOccurrences({
      allDay: false,
      endsAt: new Date("2026-12-02T23:00:00.000Z"),
      frequency: "biweekly",
      repeatUntil: "2027-01-30",
      semesterEndsOn: "2026-12-20",
      startsAt: new Date("2026-12-02T22:00:00.000Z"),
    });

    expect(occurrences.map((item) => item.startsAt.toISOString())).toEqual([
      "2026-12-02T22:00:00.000Z",
      "2026-12-16T22:00:00.000Z",
    ]);
  });
});

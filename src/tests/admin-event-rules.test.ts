import { describe, expect, it } from "vitest";
import {
  getAffectedOccurrenceIndexes,
  getEventConflictWarnings,
  validateEventInsideSemester,
} from "@/features/events/admin-rules";
import { demoAnnouncements } from "@/features/events/demo-public-data";
import { getVisibleAnnouncements } from "@/features/events/public-filters";

describe("admin event rules", () => {
  it("accepts events inside the active semester", () => {
    expect(
      validateEventInsideSemester(
        {
          endsAt: new Date("2026-08-10T23:00:00.000Z"),
          startsAt: new Date("2026-08-10T22:00:00.000Z"),
        },
        { endsOn: "2026-12-20", startsOn: "2026-07-01" },
      ),
    ).toBeNull();
  });

  it("rejects events outside the active semester", () => {
    expect(
      validateEventInsideSemester(
        {
          endsAt: new Date("2026-12-21T03:00:00.000Z"),
          startsAt: new Date("2026-12-20T22:00:00.000Z"),
        },
        { endsOn: "2026-12-20", startsOn: "2026-07-01" },
      ),
    ).toContain("semestre ativo");
  });

  it("warns about duplicate titles on the same day", () => {
    const warnings = getEventConflictWarnings(
      {
        startsAt: new Date("2026-08-10T22:00:00.000Z"),
        endsAt: new Date("2026-08-10T23:00:00.000Z"),
        title: "Reunião geral",
      },
      [
        {
          id: "existing",
          startsAt: new Date("2026-08-10T18:00:00.000Z"),
          endsAt: new Date("2026-08-10T19:00:00.000Z"),
          title: " reunião   geral ",
        },
      ],
    );

    expect(warnings).toContain(
      "Já existe um evento com o mesmo título nesse dia.",
    );
  });

  it("warns about overlapping time windows without blocking", () => {
    const warnings = getEventConflictWarnings(
      {
        startsAt: new Date("2026-08-10T22:00:00.000Z"),
        endsAt: new Date("2026-08-10T23:00:00.000Z"),
        title: "Treino Rover",
      },
      [
        {
          id: "existing",
          startsAt: new Date("2026-08-10T22:30:00.000Z"),
          endsAt: new Date("2026-08-10T23:30:00.000Z"),
          title: "Reunião geral",
        },
      ],
    );

    expect(warnings).toEqual([
      'Há sobreposição de horário com "Reunião geral".',
    ]);
  });

  it("calculates recurrence edit scopes deterministically", () => {
    expect(
      getAffectedOccurrenceIndexes({
        currentIndex: 2,
        scope: "single",
        totalOccurrences: 5,
      }),
    ).toEqual([2]);
    expect(
      getAffectedOccurrenceIndexes({
        currentIndex: 2,
        scope: "future",
        totalOccurrences: 5,
      }),
    ).toEqual([2, 3, 4]);
    expect(
      getAffectedOccurrenceIndexes({
        currentIndex: 2,
        scope: "series",
        totalOccurrences: 5,
      }),
    ).toEqual([0, 1, 2, 3, 4]);
  });
});

describe("announcement expiry", () => {
  it("hides expired announcements", () => {
    const visible = getVisibleAnnouncements(
      [
        {
          ...demoAnnouncements[0],
          endsAt: "2026-07-02T00:00:00-03:00",
        },
      ],
      new Date("2026-07-03T00:00:00-03:00"),
    );

    expect(visible).toEqual([]);
  });
});

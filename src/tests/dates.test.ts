import { describe, expect, it } from "vitest";
import {
  APP_LOCALE,
  APP_TIME_ZONE,
  getWeekRange,
  toFullCalendarAllDayEndExclusive,
  toPostgresDate,
} from "@/lib/dates";

describe("date conventions", () => {
  it("keeps the app locale and time zone centralized", () => {
    expect(APP_LOCALE).toBe("pt-BR");
    expect(APP_TIME_ZONE).toBe("America/Sao_Paulo");
  });

  it("uses Monday as the first day of the week", () => {
    const { start, end } = getWeekRange(new Date("2026-07-28T12:00:00-03:00"));

    expect(toPostgresDate(start)).toBe("2026-07-27");
    expect(toPostgresDate(end)).toBe("2026-08-02");
  });

  it("converts all-day event end dates to FullCalendar exclusive ends", () => {
    const exclusiveEnd = toFullCalendarAllDayEndExclusive(
      new Date("2026-08-10T00:00:00-03:00"),
    );

    expect(toPostgresDate(exclusiveEnd)).toBe("2026-08-11");
  });
});

import { addDays, endOfWeek, formatISO, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export const APP_TIME_ZONE = "America/Sao_Paulo";
export const APP_LOCALE = "pt-BR";
export const APP_DATE_LOCALE = ptBR;
export const WEEK_STARTS_ON = 1;

export function getWeekRange(date: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(date, {
      locale: APP_DATE_LOCALE,
      weekStartsOn: WEEK_STARTS_ON,
    }),
    end: endOfWeek(date, {
      locale: APP_DATE_LOCALE,
      weekStartsOn: WEEK_STARTS_ON,
    }),
  };
}

export function toPostgresTimestamp(date: Date): string {
  return formatISO(date);
}

export function toPostgresDate(date: Date): string {
  return formatISO(date, { representation: "date" });
}

export function parsePostgresTimestamp(value: string): Date {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Timestamp invalido.");
  }

  return date;
}

export function toFullCalendarAllDayEndExclusive(date: Date): Date {
  return addDays(date, 1);
}

export function formatInAppLocale(date: Date): string {
  return new Intl.DateTimeFormat(APP_LOCALE, {
    dateStyle: "medium",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

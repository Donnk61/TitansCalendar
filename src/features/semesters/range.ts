import {
  differenceInCalendarDays,
  isAfter,
  isBefore,
  parseISO,
} from "date-fns";

export const MAX_PUBLIC_CALENDAR_RANGE_DAYS = 190;

export type DateRangeInput = {
  rangeStart: string;
  rangeEnd: string;
};

export type SemesterBounds = {
  startsOn: string;
  endsOn: string;
};

export type NormalizedDateRange = {
  start: Date;
  end: Date;
};

export function normalizeCalendarRange(
  input: DateRangeInput,
  semester: SemesterBounds,
): NormalizedDateRange {
  const requestedStart = parseIsoDateTime(input.rangeStart, "rangeStart");
  const requestedEnd = parseIsoDateTime(input.rangeEnd, "rangeEnd");

  if (!isAfter(requestedEnd, requestedStart)) {
    throw new Error("rangeEnd deve ser posterior a rangeStart.");
  }

  if (
    differenceInCalendarDays(requestedEnd, requestedStart) >
    MAX_PUBLIC_CALENDAR_RANGE_DAYS
  ) {
    throw new Error("Intervalo público maior que o limite permitido.");
  }

  const semesterStart = parseIsoDateOnly(semester.startsOn, "startsOn");
  const semesterEndExclusive = addOneDay(
    parseIsoDateOnly(semester.endsOn, "endsOn"),
  );

  const start = isBefore(requestedStart, semesterStart)
    ? semesterStart
    : requestedStart;
  const end = isAfter(requestedEnd, semesterEndExclusive)
    ? semesterEndExclusive
    : requestedEnd;

  if (!isAfter(end, start)) {
    throw new Error("Intervalo fora do semestre ativo.");
  }

  return { start, end };
}

function parseIsoDateTime(value: string, field: string): Date {
  const date = parseISO(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${field} inválido.`);
  }

  return date;
}

function parseIsoDateOnly(value: string, field: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${field} deve estar no formato YYYY-MM-DD.`);
  }

  return parseIsoDateTime(`${value}T00:00:00-03:00`, field);
}

function addOneDay(date: Date): Date {
  return new Date(date.getTime() + 24 * 60 * 60 * 1000);
}

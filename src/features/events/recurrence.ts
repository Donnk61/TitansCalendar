import { addDays, differenceInMilliseconds, parseISO } from "date-fns";

export type RecurrenceFrequency = "none" | "weekly" | "biweekly";

export type GeneratedOccurrence = {
  index: number;
  startsAt: Date;
  endsAt: Date | null;
};

export function generateOccurrences(input: {
  allDay: boolean;
  frequency: RecurrenceFrequency;
  semesterEndsOn: string;
  startsAt: Date;
  endsAt: Date | null;
  repeatUntil: string | null;
}): GeneratedOccurrence[] {
  const intervalDays = input.frequency === "weekly" ? 7 : 14;

  if (input.frequency === "none") {
    return [{ index: 0, startsAt: input.startsAt, endsAt: input.endsAt }];
  }

  const repeatUntil = input.repeatUntil
    ? parseISO(input.repeatUntil)
    : parseISO(input.semesterEndsOn);
  const semesterEnd = parseISO(input.semesterEndsOn);
  const finalDate = repeatUntil < semesterEnd ? repeatUntil : semesterEnd;
  const duration = input.endsAt
    ? differenceInMilliseconds(input.endsAt, input.startsAt)
    : null;
  const occurrences: GeneratedOccurrence[] = [];
  let currentStart = input.startsAt;
  let index = 0;

  while (currentStart <= finalDate) {
    occurrences.push({
      index,
      startsAt: currentStart,
      endsAt:
        duration === null ? null : new Date(currentStart.getTime() + duration),
    });
    currentStart = addDays(currentStart, intervalDays);
    index += 1;
  }

  return occurrences;
}

export function getRecurrenceRule(input: {
  frequency: Exclude<RecurrenceFrequency, "none">;
  startsOn: string;
  endsOn: string;
}) {
  return {
    schemaVersion: 1 as const,
    frequency: input.frequency,
    startsOn: input.startsOn,
    endsOn: input.endsOn,
    intervalWeeks: input.frequency === "weekly" ? (1 as const) : (2 as const),
  };
}

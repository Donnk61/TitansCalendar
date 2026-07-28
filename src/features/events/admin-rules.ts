import { formatISO } from "date-fns";

export type EventTimeWindow = {
  id?: string;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
};

export type SemesterDateWindow = {
  startsOn: string;
  endsOn: string;
};

export type RecurrenceEditScope = "single" | "future" | "series";

export function validateEventInsideSemester(
  event: Pick<EventTimeWindow, "endsAt" | "startsAt">,
  semester: SemesterDateWindow,
): string | null {
  const startsOn = formatISO(event.startsAt, { representation: "date" });
  const endsOn = formatISO(event.endsAt ?? event.startsAt, {
    representation: "date",
  });

  if (startsOn < semester.startsOn || endsOn > semester.endsOn) {
    return "O evento precisa ficar dentro do semestre ativo.";
  }

  return null;
}

export function getEventConflictWarnings(
  candidate: EventTimeWindow,
  existingEvents: EventTimeWindow[],
): string[] {
  const warnings = existingEvents.flatMap((event) => {
    if (event.id && event.id === candidate.id) {
      return [];
    }

    const messages: string[] = [];

    if (
      normalizeTitle(event.title) === normalizeTitle(candidate.title) &&
      isSameDay(event.startsAt, candidate.startsAt)
    ) {
      messages.push("Já existe um evento com o mesmo título nesse dia.");
    }

    if (eventsOverlap(candidate, event)) {
      messages.push(`Há sobreposição de horário com "${event.title}".`);
    }

    return messages;
  });

  return [...new Set(warnings)];
}

export function getAffectedOccurrenceIndexes(input: {
  currentIndex: number;
  scope: RecurrenceEditScope;
  totalOccurrences: number;
}): number[] {
  const indexes = Array.from(
    { length: input.totalOccurrences },
    (_, index) => index,
  );

  if (input.scope === "single") {
    return indexes.filter((index) => index === input.currentIndex);
  }

  if (input.scope === "future") {
    return indexes.filter((index) => index >= input.currentIndex);
  }

  return indexes;
}

function eventsOverlap(
  first: EventTimeWindow,
  second: EventTimeWindow,
): boolean {
  const firstEnd = first.endsAt ?? first.startsAt;
  const secondEnd = second.endsAt ?? second.startsAt;

  return first.startsAt < secondEnd && second.startsAt < firstEnd;
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

function isSameDay(first: Date, second: Date): boolean {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

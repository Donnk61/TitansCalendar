import { AlertCircle, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { EventTypeIndicator } from "@/components/events/event-type-indicator";
import { StatusBadge } from "@/features/events/event-status";
import {
  formatEventTime,
  getProjectSummary,
  groupEventsByCurrentWeek,
} from "@/features/events/calendar-display";
import type { PublicCalendarEvent } from "@/features/events/public-types";
import { APP_TIME_ZONE, getWeekRange } from "@/lib/dates";

export function WeekPanel({
  events,
  now = new Date(),
  onEventSelect,
}: {
  events: PublicCalendarEvent[];
  now?: Date;
  onEventSelect?: (eventId: string, trigger: HTMLElement) => void;
}) {
  const groups = groupEventsByCurrentWeek(events, now);
  const weekEvents = groups.flatMap((group) => group.events);
  const fallbackEvents = weekEvents.length === 0 ? events : [];
  const visibleEvents = weekEvents.length > 0 ? weekEvents : fallbackEvents;
  const [nextEvent, ...laterEvents] = visibleEvents;
  const displayWeek =
    weekEvents.length > 0
      ? { start: groups[0]?.date ?? now, end: groups[6]?.date ?? now }
      : nextEvent
        ? getWeekRange(new Date(nextEvent.start))
        : { start: now, end: now };
  return (
    <aside
      className="grid max-h-[calc(100svh-7rem)] grid-rows-[auto_minmax(0,1fr)] gap-4"
      aria-labelledby="week-panel-title"
    >
      <div className="sticky top-0 z-10 bg-background pb-1">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-orange">
          ESTA SEMANA
        </p>
        <h2
          className="mt-1 font-display text-2xl font-black"
          id="week-panel-title"
        >
          {formatWeekRange(displayWeek.start, displayWeek.end)}
        </h2>
      </div>

      {visibleEvents.length === 0 ? (
        <EmptyState
          description="Quando houver eventos na semana atual, eles aparecerao aqui em ordem cronologica."
          icon={<CalendarClock aria-hidden="true" className="size-5" />}
          title="Nenhum evento nesta semana"
        />
      ) : (
        <div className="grid min-h-0 content-start gap-4">
          <section className="grid gap-2">
            <h3 className="text-sm font-bold text-text-secondary">
              Proximo evento
            </h3>
            <WeekEventCard event={nextEvent} onEventSelect={onEventSelect} />
          </section>

          {laterEvents.length > 0 ? (
            <section className="grid min-h-0 gap-2">
              <h3 className="text-sm font-bold text-text-secondary">Depois</h3>
              <div className="grid max-h-[52svh] overflow-y-auto rounded-md border border-border bg-surface">
                {laterEvents.map((event) => (
                  <WeekEventRow
                    event={event}
                    key={event.id}
                    onEventSelect={onEventSelect}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </aside>
  );
}

function WeekEventCard({
  event,
  onEventSelect,
}: {
  event: PublicCalendarEvent;
  onEventSelect?: (eventId: string, trigger: HTMLElement) => void;
}) {
  const projectSummary = getProjectSummary(event);

  return (
    <article className="grid gap-3 rounded-md border border-border bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
            {formatShortDate(event)} - {formatEventTime(event)}
          </p>
          <button
            className="titans-line-clamp-2 mt-1 max-w-full text-left font-display text-lg font-bold text-text-primary transition duration-normal hover:text-brand-orange focus-visible:outline-focus"
            onClick={(clickEvent) =>
              onEventSelect?.(event.id, clickEvent.currentTarget)
            }
            title={event.title}
            type="button"
          >
            {event.title}
          </button>
        </div>
        {event.changeNotice ? (
          <AlertCircle
            aria-label="Evento alterado"
            className="size-4 shrink-0 text-info"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        <EventTypeIndicator type={event.type} />
        <StatusBadge status={event.status} />
        {projectSummary ? <Badge>{projectSummary}</Badge> : null}
      </div>
    </article>
  );
}

function WeekEventRow({
  event,
  onEventSelect,
}: {
  event: PublicCalendarEvent;
  onEventSelect?: (eventId: string, trigger: HTMLElement) => void;
}) {
  const projectSummary = getProjectSummary(event);

  return (
    <button
      className="grid gap-0.5 border-b border-border px-3 py-2.5 text-left transition duration-normal last:border-b-0 hover:bg-surface-muted focus-visible:outline-focus"
      onClick={(clickEvent) =>
        onEventSelect?.(event.id, clickEvent.currentTarget)
      }
      title={event.title}
      type="button"
    >
      <span className="text-[0.68rem] font-semibold uppercase tracking-[0.07em] text-text-muted">
        {formatShortDate(event)} - {formatEventTime(event)}
      </span>
      <span className="titans-line-clamp-2 font-display text-sm font-bold leading-snug text-text-primary">
        {event.title}
      </span>
      <span className="flex min-w-0 items-center gap-2 text-xs text-text-secondary">
        <span className="truncate">{projectSummary ?? "Geral"}</span>
        <span
          aria-hidden="true"
          className="size-1 rounded-full bg-brand-orange"
        />
        <span className="truncate">{formatStatus(event.status)}</span>
      </span>
    </button>
  );
}

function formatWeekRange(start: Date, end: Date) {
  const startDay = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    timeZone: APP_TIME_ZONE,
  }).format(start);
  const endLabel = new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    timeZone: APP_TIME_ZONE,
  }).format(end);

  return `${startDay}-${endLabel}`;
}

function formatShortDate(event: PublicCalendarEvent) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: APP_TIME_ZONE,
  })
    .format(new Date(event.start))
    .replace(".", "")
    .toUpperCase();
}

function formatStatus(status: PublicCalendarEvent["status"]) {
  const labels = {
    cancelled: "Cancelado",
    changed: "Alterado",
    completed: "Concluido",
    confirmed: "Confirmado",
    pending: "Pendente",
  };

  return labels[status];
}

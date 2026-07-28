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
  const hasEvents = events.length > 0;
  const groupedEventCount = groups.reduce(
    (total, group) => total + group.events.length,
    0,
  );
  const fallbackEvents = hasEvents && groupedEventCount === 0 ? events : [];

  return (
    <aside
      className="grid content-start gap-4"
      aria-labelledby="week-panel-title"
    >
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-orange">
          Segunda a domingo
        </p>
        <h2
          className="mt-2 font-display text-2xl font-black"
          id="week-panel-title"
        >
          Esta semana
        </h2>
      </div>
      {!hasEvents ? (
        <EmptyState
          description="Quando houver eventos na semana atual, eles aparecerão aqui em ordem cronológica."
          icon={<CalendarClock aria-hidden="true" className="size-5" />}
          title="Nenhum evento nesta semana"
        />
      ) : fallbackEvents.length > 0 ? (
        <section className="grid gap-2">
          <h3 className="text-sm font-bold text-text-secondary">
            Próximo evento
          </h3>
          <div className="grid gap-2">
            {fallbackEvents.map((event) => (
              <WeekEventCard
                event={event}
                key={event.id}
                onEventSelect={onEventSelect}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="grid gap-3">
          {groups.map((group) => (
            <section className="grid gap-2" key={group.label}>
              <h3 className="text-sm font-bold capitalize text-text-secondary">
                {group.label}
              </h3>
              {group.events.length === 0 ? (
                <p className="rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text-muted">
                  Sem eventos
                </p>
              ) : (
                <div className="grid gap-2">
                  {group.events.map((event) => (
                    <WeekEventCard
                      event={event}
                      key={event.id}
                      onEventSelect={onEventSelect}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
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
    <article className="grid gap-3 rounded-md border border-border bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-muted">
            {formatEventTime(event)}
          </p>
          <button
            className="mt-1 block max-w-full truncate text-left font-display text-base font-bold text-text-primary transition duration-normal hover:text-brand-orange focus-visible:outline-focus"
            onClick={(clickEvent) =>
              onEventSelect?.(event.id, clickEvent.currentTarget)
            }
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
      {event.changeNotice ? (
        <p className="text-sm leading-6 text-info">{event.changeNotice}</p>
      ) : null}
    </article>
  );
}

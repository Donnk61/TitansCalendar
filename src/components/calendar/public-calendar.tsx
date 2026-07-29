"use client";

import {
  type ReactNode,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type {
  DatesSetArg,
  EventClickArg,
  EventContentArg,
} from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { eventStatusConfig } from "@/features/events/event-status";
import { eventTypeConfig } from "@/features/events/event-type-config";
import type {
  FullCalendarPublicEvent,
  PublicSemester,
} from "@/features/events/public-types";
import type { EventStatus } from "@/types/domain";

type CalendarView = "timeGridWeek" | "dayGridMonth" | "multiMonthYear";

type PublicCalendarProps = {
  events: FullCalendarPublicEvent[];
  eventCount?: number;
  filtersSlot?: ReactNode;
  onEventSelect?: (eventId: string, trigger: HTMLElement) => void;
  semester: PublicSemester;
};

const STORAGE_KEY = "titans-calendar-view";

const viewItems = [
  { label: "Semana", value: "timeGridWeek" },
  { label: "Mes", value: "dayGridMonth" },
  { label: "Semestre", value: "multiMonthYear" },
];

export function PublicCalendar({
  events,
  eventCount = events.length,
  filtersSlot,
  onEventSelect,
  semester,
}: PublicCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const view = useStoredCalendarView();
  const initialDate = useMemo(() => getInitialDate(semester), [semester]);
  const [periodTitle, setPeriodTitle] = useState(() =>
    formatPeriodTitle(new Date(`${initialDate}T00:00:00`), view),
  );

  function changeView(nextView: string) {
    if (!isCalendarView(nextView)) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, nextView);
    window.dispatchEvent(new Event("titans-calendar-view-change"));
  }

  function navigate(direction: "previous" | "next") {
    const api = calendarRef.current?.getApi();

    if (!api) {
      return;
    }

    if (direction === "previous") {
      api.prev();
    } else {
      api.next();
    }
  }

  function goToday() {
    calendarRef.current?.getApi().today();
  }

  function updateVisibleDates(arg: DatesSetArg) {
    setPeriodTitle(formatPeriodTitle(arg.view.currentStart, arg.view.type));
  }

  return (
    <section className="grid gap-2" aria-label="Calendario publico">
      <div className="flex flex-col gap-3 rounded-md border border-border bg-surface px-3 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-xs border border-border bg-background px-2.5 py-1 text-xs font-semibold text-text-secondary">
            {eventCount} eventos
          </span>
          {filtersSlot}
        </div>
        <SegmentedControl
          ariaLabel="Visualizacao do calendario"
          items={viewItems}
          onValueChange={changeView}
          value={view}
        />
      </div>

      <div className="flex flex-col gap-3 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <IconButton
            className="size-8"
            icon={<ChevronLeft aria-hidden="true" className="size-4" />}
            label="Periodo anterior"
            onClick={() => navigate("previous")}
          />
          <h2 className="min-w-0 font-display text-lg font-black text-text-primary sm:text-xl">
            {periodTitle}
          </h2>
          <IconButton
            className="size-8"
            icon={<ChevronRight aria-hidden="true" className="size-4" />}
            label="Proximo periodo"
            onClick={() => navigate("next")}
          />
        </div>
        <button
          className="inline-flex min-h-8 w-fit items-center rounded-sm border border-border bg-surface px-3 text-sm font-semibold text-text-secondary transition duration-normal hover:border-brand-orange hover:text-text-primary focus-visible:outline-focus"
          onClick={goToday}
          type="button"
        >
          Hoje
        </button>
      </div>

      <div className="titans-calendar overflow-hidden rounded-md border border-border bg-surface">
        <FullCalendar
          allDayText="Dia inteiro"
          buttonText={{
            month: "Mes",
            week: "Semana",
            year: "Semestre",
          }}
          datesSet={updateVisibleDates}
          dayMaxEvents={2}
          displayEventEnd={false}
          eventClassNames={(arg) => [
            `event-status-${arg.event.extendedProps.status}`,
            arg.event.extendedProps.isImportant
              ? "event-important"
              : "event-normal",
          ]}
          eventClick={(arg) => handleEventClick(arg, onEventSelect)}
          eventContent={renderEventContent}
          events={events}
          firstDay={1}
          headerToolbar={false}
          height="auto"
          initialDate={initialDate}
          initialView={view}
          key={view}
          locale={ptBrLocale}
          moreLinkClassNames="titans-more-link"
          moreLinkContent={(arg) => `+${arg.num} eventos`}
          multiMonthMaxColumns={2}
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            multiMonthPlugin,
            interactionPlugin,
          ]}
          ref={calendarRef}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
          }}
          validRange={{
            start: semester.startsOn,
            end: addExclusiveSemesterEnd(semester.endsOn),
          }}
          views={{
            multiMonthYear: {
              duration: { months: getSemesterMonthCount(semester) },
              multiMonthMinWidth: 280,
              titleFormat: { month: "long", year: "numeric" },
            },
            timeGridWeek: {
              dayHeaderFormat: {
                weekday: "short",
                day: "2-digit",
                month: "2-digit",
              },
            },
          }}
        />
      </div>
    </section>
  );
}

function handleEventClick(
  arg: EventClickArg,
  onEventSelect: PublicCalendarProps["onEventSelect"],
) {
  arg.jsEvent.preventDefault();
  onEventSelect?.(arg.event.id, arg.el);
}

function renderEventContent(arg: EventContentArg) {
  const event = arg.event;
  const type = event.extendedProps.type as string;
  const status = event.extendedProps.status as EventStatus;
  const typeConfig = eventTypeConfig[type as keyof typeof eventTypeConfig];
  const statusConfig = eventStatusConfig[status];

  return (
    <div
      className="flex min-w-0 items-center gap-1.5 px-1.5 py-1 text-sm leading-tight"
      title={event.title}
    >
      <span
        aria-hidden="true"
        className="size-2 shrink-0 rounded-full"
        style={{ background: typeConfig?.token ?? "var(--brand-orange)" }}
      />
      {arg.timeText ? (
        <span className="shrink-0 font-semibold tabular-nums">
          {formatCompactTime(arg.timeText)}
        </span>
      ) : null}
      <span className="min-w-0 truncate font-medium">{event.title}</span>
      <CompactStatusIcon label={statusConfig?.label} status={status} />
    </div>
  );
}

function CompactStatusIcon({
  label,
  status,
}: {
  label?: string;
  status: EventStatus;
}) {
  if (status === "confirmed" || status === "completed") {
    return (
      <Check
        aria-label={label}
        className="ml-auto size-3.5 shrink-0 text-success"
      />
    );
  }

  if (status === "pending" || status === "cancelled" || status === "changed") {
    return (
      <span className="ml-auto shrink-0 rounded-xs border border-current px-1 py-0.5 text-[0.65rem] font-bold">
        {label}
      </span>
    );
  }

  return null;
}

function formatCompactTime(timeText: string) {
  return timeText.replace(":00", "h");
}

function isCalendarView(value: string | null): value is CalendarView {
  return (
    value === "timeGridWeek" ||
    value === "dayGridMonth" ||
    value === "multiMonthYear"
  );
}

function useStoredCalendarView(): CalendarView {
  return useSyncExternalStore(
    subscribeToCalendarView,
    getStoredCalendarView,
    () => "dayGridMonth",
  );
}

function subscribeToCalendarView(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("titans-calendar-view-change", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("titans-calendar-view-change", onStoreChange);
  };
}

function getStoredCalendarView(): CalendarView {
  const storedView = window.localStorage.getItem(STORAGE_KEY);
  return isCalendarView(storedView) ? storedView : "dayGridMonth";
}

function getInitialDate(semester: PublicSemester): string {
  const today = new Date();
  const start = new Date(`${semester.startsOn}T00:00:00`);
  const end = new Date(`${semester.endsOn}T23:59:59`);

  if (today < start) {
    return semester.startsOn;
  }

  if (today > end) {
    return semester.endsOn;
  }

  return today.toISOString().slice(0, 10);
}

function addExclusiveSemesterEnd(endsOn: string): string {
  const date = new Date(`${endsOn}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getSemesterMonthCount(semester: PublicSemester): number {
  const start = new Date(`${semester.startsOn}T00:00:00`);
  const end = new Date(`${semester.endsOn}T00:00:00`);
  return Math.max(
    1,
    (end.getFullYear() - start.getFullYear()) * 12 +
      end.getMonth() -
      start.getMonth() +
      1,
  );
}

function formatPeriodTitle(date: Date, viewType: string) {
  if (viewType === "timeGridWeek") {
    return "Semana selecionada";
  }

  if (viewType === "multiMonthYear") {
    return "Semestre";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  })
    .format(date)
    .replace(/^\p{Ll}/u, (letter) => letter.toUpperCase());
}

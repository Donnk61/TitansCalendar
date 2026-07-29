"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import type { EventClickArg, EventContentArg } from "@fullcalendar/core";
import ptBrLocale from "@fullcalendar/core/locales/pt-br";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { eventStatusConfig } from "@/features/events/event-status";
import { eventTypeConfig } from "@/features/events/event-type-config";
import type {
  FullCalendarPublicEvent,
  PublicSemester,
} from "@/features/events/public-types";

type CalendarView = "timeGridWeek" | "dayGridMonth" | "multiMonthYear";

type PublicCalendarProps = {
  events: FullCalendarPublicEvent[];
  onEventSelect?: (eventId: string, trigger: HTMLElement) => void;
  semester: PublicSemester;
};

const STORAGE_KEY = "titans-calendar-view";

const viewItems = [
  { label: "Semana", value: "timeGridWeek" },
  { label: "Mês", value: "dayGridMonth" },
  { label: "Semestre", value: "multiMonthYear" },
];

export function PublicCalendar({
  events,
  onEventSelect,
  semester,
}: PublicCalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const view = useStoredCalendarView();
  const initialDate = useMemo(() => getInitialDate(semester), [semester]);

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

  return (
    <section className="grid gap-2" aria-label="Calendário público">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SegmentedControl
          ariaLabel="Visualização do calendário"
          items={viewItems}
          onValueChange={changeView}
          value={view}
        />
        <div className="flex items-center gap-2">
          <IconButton
            icon={<ChevronLeft aria-hidden="true" className="size-4" />}
            label="Período anterior"
            onClick={() => navigate("previous")}
          />
          <IconButton
            icon={<ChevronRight aria-hidden="true" className="size-4" />}
            label="Próximo período"
            onClick={() => navigate("next")}
          />
        </div>
      </div>
      <div className="titans-calendar overflow-hidden rounded-md border border-border bg-surface">
        <FullCalendar
          allDayText="Dia inteiro"
          buttonText={{
            month: "Mês",
            week: "Semana",
            year: "Semestre",
          }}
          dayMaxEvents={3}
          displayEventEnd
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
  const status = event.extendedProps.status as keyof typeof eventStatusConfig;
  const typeConfig = eventTypeConfig[type as keyof typeof eventTypeConfig];
  const statusConfig = eventStatusConfig[status];
  const projectSummary = getProjectSummaryFromExtendedProps(
    event.extendedProps as FullCalendarPublicEvent["extendedProps"],
  );
  const Icon = typeConfig?.icon;

  return (
    <div className="flex min-w-0 items-start gap-1.5 px-1 py-0.5 text-[0.78rem] leading-tight">
      <span
        aria-hidden="true"
        className="mt-0.5 h-3.5 w-1 shrink-0 rounded-full"
        style={{ background: typeConfig?.token ?? "var(--brand-orange)" }}
      />
      <span className="grid min-w-0 gap-0.5">
        <span className="flex min-w-0 items-center gap-1">
          {Icon ? (
            <Icon aria-hidden="true" className="size-3 shrink-0" />
          ) : null}
          {arg.timeText ? (
            <span className="font-semibold tabular-nums">{arg.timeText}</span>
          ) : null}
          <span className="truncate font-semibold">{event.title}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1 text-[0.7rem] text-text-secondary">
          {projectSummary ? (
            <span className="truncate">{projectSummary}</span>
          ) : null}
          {statusConfig ? (
            <span className="truncate">{statusConfig.label}</span>
          ) : null}
        </span>
      </span>
    </div>
  );
}

function getProjectSummaryFromExtendedProps(
  props: FullCalendarPublicEvent["extendedProps"],
): string | null {
  if (props.projects.length === 0) {
    return null;
  }

  if (props.projects.length === 1) {
    return props.projects[0].name;
  }

  return `${props.projects[0].name} +${props.projects.length - 1}`;
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

"use client";

import {
  createContext,
  type ReactNode,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  Filter,
  MapPin,
  Users,
  X,
} from "lucide-react";
import { WeekPanel } from "@/components/calendar/week-panel";
import { EventTypeIndicator } from "@/components/events/event-type-indicator";
import { ProjectTag } from "@/components/events/project-tag";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Label, Select } from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/features/events/event-status";
import { eventTypeConfig } from "@/features/events/event-type-config";
import {
  formatEventTime,
  getProjectSummary,
} from "@/features/events/calendar-display";
import {
  emptyPublicEventFilters,
  filterPublicEvents,
  getVisibleAnnouncements,
  hasActivePublicFilters,
  isSafeExternalUrl,
  type PublicEventFilters,
} from "@/features/events/public-filters";
import { toFullCalendarEvent } from "@/features/events/public-adapter";
import type {
  PublicAnnouncement,
  PublicCalendarEvent,
  PublicEventType,
  PublicProject,
  PublicSemester,
} from "@/features/events/public-types";
import { APP_TIME_ZONE } from "@/lib/dates";

const DesktopPublicCalendar = dynamic(
  () =>
    import("@/components/calendar/public-calendar").then(
      (module) => module.PublicCalendar,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[520px] rounded-md border border-border bg-surface p-5">
        <div className="h-6 w-48 rounded-sm bg-surface-muted" />
        <div className="mt-5 grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <div
              className="h-20 rounded-sm border border-border bg-surface-muted"
              key={index}
            />
          ))}
        </div>
      </div>
    ),
  },
);

type ExperienceState = {
  filters: PublicEventFilters;
  selectedEventId: string | null;
};

type ExperienceActions = {
  clearFilters: () => void;
  dismissAnnouncement: (id: string) => void;
  selectEvent: (eventId: string, trigger: HTMLElement | null) => void;
  setFilters: (filters: PublicEventFilters) => void;
  closeDetails: () => void;
};

type ExperienceMeta = {
  announcements: PublicAnnouncement[];
  dismissedAnnouncementIds: Set<string>;
  eventTypes: PublicEventType[];
  events: PublicCalendarEvent[];
  filteredEvents: PublicCalendarEvent[];
  projects: PublicProject[];
  semester: PublicSemester;
  triggerRef: { current: HTMLElement | null };
};

type ExperienceContextValue = {
  state: ExperienceState;
  actions: ExperienceActions;
  meta: ExperienceMeta;
};

const ExperienceContext = createContext<ExperienceContextValue | null>(null);

export function PublicCalendarExperience({
  announcements,
  events,
  eventTypes,
  projects,
  semester,
}: {
  announcements: PublicAnnouncement[];
  events: PublicCalendarEvent[];
  eventTypes: PublicEventType[];
  projects: PublicProject[];
  semester: PublicSemester;
}) {
  const [filters, setFilters] = useState(emptyPublicEventFilters);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [dismissedAnnouncementIds, setDismissedAnnouncementIds] = useState<
    Set<string>
  >(() => readDismissedAnnouncements());
  const triggerRef = useRef<HTMLElement | null>(null);
  const isDesktop = useIsDesktop();
  const filteredEvents = useMemo(
    () => filterPublicEvents(events, filters),
    [events, filters],
  );

  const clearFilters = useCallback(() => {
    setFilters(emptyPublicEventFilters);
  }, []);
  const dismissAnnouncement = useCallback((id: string) => {
    setDismissedAnnouncementIds((current) => {
      const next = new Set(current);
      next.add(id);
      writeDismissedAnnouncements(next);
      return next;
    });
  }, []);
  const selectEvent = useCallback(
    (eventId: string, trigger: HTMLElement | null) => {
      triggerRef.current = trigger;
      setSelectedEventId(eventId);
    },
    [],
  );
  const closeDetails = useCallback(() => {
    setSelectedEventId(null);
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);
  const actions = useMemo<ExperienceActions>(
    () => ({
      clearFilters,
      closeDetails,
      dismissAnnouncement,
      selectEvent,
      setFilters,
    }),
    [clearFilters, closeDetails, dismissAnnouncement, selectEvent],
  );

  return (
    <ExperienceContext
      value={{
        state: { filters, selectedEventId },
        actions,
        meta: {
          announcements,
          dismissedAnnouncementIds,
          eventTypes,
          events,
          filteredEvents,
          projects,
          semester,
          triggerRef,
        },
      }}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 content-start gap-3">
          <ImportantAnnouncements />
          <EventFilters />
          <AppliedFilterChips />
          {filteredEvents.length > 0 && !isDesktop ? (
            <MobileCalendarAgenda />
          ) : null}
          {isDesktop ? (
            <DesktopPublicCalendar
              events={filteredEvents.map(toFullCalendarEvent)}
              onEventSelect={actions.selectEvent}
              semester={semester}
            />
          ) : null}
          {filteredEvents.length === 0 ? (
            <EmptyState
              description="Ajuste ou limpe os filtros para voltar ao cronograma completo do semestre."
              icon={<Filter aria-hidden="true" className="size-5" />}
              title="Nenhum evento encontrado"
            />
          ) : null}
          <EventDetailsOverlay />
        </div>
        {isDesktop ? <PublicWeekPanelExperience /> : null}
      </div>
    </ExperienceContext>
  );
}

export function PublicWeekPanelExperience() {
  const {
    actions,
    meta: { filteredEvents },
  } = useExperience();

  return (
    <WeekPanel events={filteredEvents} onEventSelect={actions.selectEvent} />
  );
}

function EventFilters() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const {
    meta: { filteredEvents },
    state: { filters },
  } = useExperience();
  const activeFilters = hasActivePublicFilters(filters);

  return (
    <section className="grid gap-2" aria-label="Filtros de eventos">
      <button
        aria-controls="public-calendar-filters"
        aria-expanded={drawerOpen}
        className="inline-flex min-h-8 w-fit items-center gap-1.5 rounded-sm border border-border bg-surface px-2.5 text-xs font-semibold text-text-secondary transition duration-normal hover:border-brand-orange hover:text-text-primary focus-visible:outline-focus"
        onClick={() => setDrawerOpen((open) => !open)}
        type="button"
      >
        <Filter aria-hidden="true" className="size-4" />
        Filtros
        {activeFilters ? (
          <span className="rounded-xs bg-brand-orange px-1.5 py-0.5 text-[0.68rem] font-black text-background">
            ativos
          </span>
        ) : null}
        <span className="text-[0.72rem] text-text-muted">
          {filteredEvents.length} eventos
        </span>
        {drawerOpen ? (
          <ChevronUp aria-hidden="true" className="size-4" />
        ) : (
          <ChevronDown aria-hidden="true" className="size-4" />
        )}
      </button>
      <div className="hidden md:block" id="public-calendar-filters">
        {drawerOpen ? <FilterControls layout="desktop" /> : null}
      </div>
      <div className="md:hidden">
        {drawerOpen ? (
          <FilterDrawer onClose={() => setDrawerOpen(false)}>
            <FilterControls layout="mobile" />
          </FilterDrawer>
        ) : null}
      </div>
    </section>
  );
}

function FilterControls({ layout }: { layout: "desktop" | "mobile" }) {
  const {
    actions,
    meta: { eventTypes, filteredEvents, projects },
    state: { filters },
  } = useExperience();

  return (
    <div
      className={
        layout === "desktop"
          ? "flex max-w-full flex-nowrap items-end gap-2 rounded-md border border-border bg-surface p-3"
          : "grid gap-4"
      }
    >
      <QuickFilters />
      <Field className={layout === "desktop" ? "w-28 shrink-0" : undefined}>
        <Label htmlFor={`${layout}-project`}>Projeto</Label>
        <Select
          id={`${layout}-project`}
          name="project"
          onChange={(event) =>
            actions.setFilters({ ...filters, projectSlug: event.target.value })
          }
          value={filters.projectSlug}
        >
          <option value="all">Todos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.slug}>
              {project.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field className={layout === "desktop" ? "w-32 shrink-0" : undefined}>
        <Label htmlFor={`${layout}-type`}>Tipo</Label>
        <Select
          id={`${layout}-type`}
          name="type"
          onChange={(event) =>
            actions.setFilters({ ...filters, typeSlug: event.target.value })
          }
          value={filters.typeSlug}
        >
          <option value="all">Todos</option>
          {eventTypes.map((type) => (
            <option key={type.slug} value={type.slug}>
              {type.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field className={layout === "desktop" ? "w-28 shrink-0" : undefined}>
        <Label htmlFor={`${layout}-status`}>Status</Label>
        <Select
          id={`${layout}-status`}
          name="status"
          onChange={(event) =>
            actions.setFilters({
              ...filters,
              status: event.target.value as PublicEventFilters["status"],
            })
          }
          value={filters.status}
        >
          <option value="all">Todos</option>
          <option value="confirmed">Confirmado</option>
          <option value="pending">Pendente</option>
          <option value="cancelled">Cancelado</option>
        </Select>
      </Field>
      <div className="flex shrink-0 items-center gap-2">
        {layout === "mobile" ? (
          <p className="text-sm text-text-muted">
            {filteredEvents.length} eventos
          </p>
        ) : null}
        {layout === "mobile" && hasActivePublicFilters(filters) ? (
          <Button onClick={actions.clearFilters} size="sm" variant="ghost">
            Limpar filtros
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function QuickFilters() {
  const {
    actions,
    state: { filters },
  } = useExperience();
  const items: Array<{
    label: string;
    value: PublicEventFilters["quickFilter"];
  }> = [
    { label: "Todos", value: "all" },
    { label: "Reuniões", value: "meetings" },
    { label: "Competições", value: "competitions" },
    { label: "Prazos", value: "deadlines" },
  ];

  return (
    <div className="flex flex-nowrap gap-2" role="group" aria-label="Atalhos">
      {items.map((item) => {
        const selected = filters.quickFilter === item.value;

        return (
          <button
            aria-pressed={selected}
            className={
              selected
                ? "min-h-9 shrink-0 rounded-sm border border-brand-orange bg-brand-orange px-2.5 text-sm font-semibold text-background transition duration-normal focus-visible:outline-focus"
                : "min-h-9 shrink-0 rounded-sm border border-border bg-surface px-2.5 text-sm font-semibold text-text-secondary transition duration-normal hover:border-brand-orange hover:text-text-primary focus-visible:outline-focus"
            }
            key={item.value}
            onClick={() =>
              actions.setFilters({ ...filters, quickFilter: item.value })
            }
            type="button"
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

function AppliedFilterChips() {
  const {
    actions,
    meta: { eventTypes, projects },
    state: { filters },
  } = useExperience();

  if (!hasActivePublicFilters(filters)) {
    return null;
  }

  const chips = [
    filters.quickFilter !== "all"
      ? {
          label: quickFilterLabel[filters.quickFilter],
          onRemove: () =>
            actions.setFilters({ ...filters, quickFilter: "all" }),
        }
      : null,
    filters.projectSlug !== "all"
      ? {
          label:
            projects.find((project) => project.slug === filters.projectSlug)
              ?.name ?? filters.projectSlug,
          onRemove: () =>
            actions.setFilters({ ...filters, projectSlug: "all" }),
        }
      : null,
    filters.typeSlug !== "all"
      ? {
          label:
            eventTypes.find((type) => type.slug === filters.typeSlug)?.label ??
            filters.typeSlug,
          onRemove: () => actions.setFilters({ ...filters, typeSlug: "all" }),
        }
      : null,
    filters.status !== "all"
      ? {
          label: statusFilterLabel[filters.status],
          onRemove: () => actions.setFilters({ ...filters, status: "all" }),
        }
      : null,
  ].filter((chip): chip is { label: string; onRemove: () => void } =>
    Boolean(chip),
  );

  return (
    <div className="flex flex-wrap gap-2" aria-label="Filtros aplicados">
      {chips.map((chip) => (
        <button
          className="inline-flex min-h-8 items-center gap-2 rounded-sm border border-border bg-surface px-2.5 text-sm font-semibold text-text-secondary transition duration-normal hover:border-brand-orange hover:text-text-primary focus-visible:outline-focus"
          key={chip.label}
          onClick={chip.onRemove}
          type="button"
        >
          {chip.label}
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ))}
      <Button onClick={actions.clearFilters} size="sm" variant="ghost">
        Limpar filtros
      </Button>
    </div>
  );
}

function MobileCalendarAgenda() {
  const {
    actions,
    meta: { filteredEvents, semester },
  } = useExperience();
  const initialMonth = useMemo(
    () => getInitialMobileMonth(semester),
    [semester],
  );
  const [visibleMonth, setVisibleMonth] = useState(initialMonth);
  const dayRefs = useRef(new Map<string, HTMLDivElement>());
  const monthDays = useMemo(
    () => getMonthGridDays(visibleMonth),
    [visibleMonth],
  );
  const eventsByDay = useMemo(
    () => groupEventsByDay(filteredEvents),
    [filteredEvents],
  );
  const agendaDays = useMemo(
    () =>
      [...eventsByDay.entries()]
        .filter(
          ([date]) => date >= semester.startsOn && date <= semester.endsOn,
        )
        .sort(([first], [second]) => first.localeCompare(second)),
    [eventsByDay, semester.endsOn, semester.startsOn],
  );

  function moveMonth(direction: -1 | 1) {
    const next = new Date(visibleMonth);
    next.setMonth(next.getMonth() + direction);
    setVisibleMonth(next);
  }

  function focusAgendaDay(date: string) {
    const target = dayRefs.current.get(date);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.focus();
  }

  return (
    <section className="grid gap-4" aria-labelledby="mobile-calendar-title">
      <div className="flex items-center justify-between gap-3">
        <h2
          className="font-display text-xl font-black"
          id="mobile-calendar-title"
        >
          Mês
        </h2>
        <div className="flex items-center gap-2">
          <IconButton
            icon={<ChevronLeft aria-hidden="true" className="size-4" />}
            label="Mês anterior"
            onClick={() => moveMonth(-1)}
          />
          <IconButton
            icon={<ChevronRight aria-hidden="true" className="size-4" />}
            label="Próximo mês"
            onClick={() => moveMonth(1)}
          />
        </div>
      </div>
      <div className="rounded-sm border border-border bg-surface p-3">
        <p className="mb-3 text-center font-display text-lg font-semibold capitalize text-text-primary">
          {formatMonthLabel(visibleMonth)}
        </p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-text-muted">
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {monthDays.map((day) => {
            const date = toDateKey(day);
            const dayEvents = eventsByDay.get(date) ?? [];
            const inMonth = day.getMonth() === visibleMonth.getMonth();
            const insideSemester =
              date >= semester.startsOn && date <= semester.endsOn;

            return (
              <button
                aria-label={`${formatDayLabel(day)}${dayEvents.length ? `, ${dayEvents.length} eventos` : ""}`}
                className={
                  inMonth && insideSemester
                    ? "grid min-h-11 place-items-center rounded-sm border border-border bg-background text-sm font-semibold text-text-primary transition duration-normal hover:border-brand-orange focus-visible:outline-focus"
                    : "grid min-h-11 place-items-center rounded-sm border border-transparent text-sm text-text-muted opacity-45"
                }
                disabled={!insideSemester || dayEvents.length === 0}
                key={date}
                onClick={() => focusAgendaDay(date)}
                type="button"
              >
                <span className="tabular-nums">{day.getDate()}</span>
                {dayEvents.length > 0 ? (
                  <span className="mt-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-orange px-1 text-[0.65rem] font-black text-background">
                    {dayEvents.length}
                  </span>
                ) : (
                  <span className="h-4" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <section className="grid gap-3" aria-labelledby="mobile-agenda-title">
        <h2
          className="font-display text-xl font-black"
          id="mobile-agenda-title"
        >
          Agenda
        </h2>
        {agendaDays.length > 0 ? (
          agendaDays.map(([date, dayEvents]) => (
            <div
              className="scroll-mt-24 rounded-sm border border-border bg-surface p-3 focus-visible:outline-focus"
              key={date}
              ref={(node) => {
                if (node) {
                  dayRefs.current.set(date, node);
                } else {
                  dayRefs.current.delete(date);
                }
              }}
              tabIndex={-1}
            >
              <h3 className="text-sm font-bold capitalize text-text-secondary">
                {formatAgendaDate(date)}
              </h3>
              <div className="mt-3 grid gap-2">
                {dayEvents.map((event) => (
                  <MobileAgendaEvent
                    event={event}
                    key={event.id}
                    onSelect={actions.selectEvent}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            description="Ajuste os filtros ou aguarde novos eventos publicados."
            icon={<CalendarDays aria-hidden="true" className="size-5" />}
            title="Agenda sem eventos"
          />
        )}
      </section>
    </section>
  );
}

function MobileAgendaEvent({
  event,
  onSelect,
}: {
  event: PublicCalendarEvent;
  onSelect: (eventId: string, trigger: HTMLElement | null) => void;
}) {
  const projectSummary = getProjectSummary(event);

  return (
    <article className="grid gap-2 rounded-sm border border-border bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text-muted">
            {formatEventTime(event)}
          </p>
          <button
            className="mt-1 max-w-full text-left font-display text-base font-bold text-text-primary transition duration-normal hover:text-brand-orange focus-visible:outline-focus"
            onClick={(clickEvent) =>
              onSelect(event.id, clickEvent.currentTarget)
            }
            type="button"
          >
            {event.title}
          </button>
        </div>
        <StatusBadge status={event.status} />
      </div>
      <div className="flex flex-wrap gap-2">
        <EventTypeIndicator type={event.type} />
        {projectSummary ? <ProjectTag name={projectSummary} /> : null}
      </div>
      {event.changeNotice ? (
        <p className="text-sm leading-6 text-info">{event.changeNotice}</p>
      ) : null}
    </article>
  );
}

function ImportantAnnouncements() {
  const {
    actions,
    meta: { announcements, dismissedAnnouncementIds, events },
  } = useExperience();
  const visible = getVisibleAnnouncements(announcements).filter(
    (announcement) => !dismissedAnnouncementIds.has(announcement.id),
  );

  if (visible.length === 0) {
    return null;
  }

  return (
    <section className="grid gap-3" aria-label="Avisos importantes">
      {visible.map((announcement) => {
        const relatedEvent = announcement.relatedEventId
          ? events.find((event) => event.id === announcement.relatedEventId)
          : null;

        return (
          <div className="relative" key={announcement.id}>
            <InlineAlert
              title={announcement.title}
              tone={
                announcement.severity === "critical"
                  ? "danger"
                  : announcement.severity
              }
            >
              <span>{announcement.body}</span>
              {relatedEvent ? (
                <button
                  className="ml-2 font-semibold text-text-primary underline decoration-brand-orange underline-offset-4 transition duration-normal hover:text-brand-orange focus-visible:outline-focus"
                  onClick={(event) =>
                    actions.selectEvent(relatedEvent.id, event.currentTarget)
                  }
                  type="button"
                >
                  Ver evento relacionado
                </button>
              ) : null}
            </InlineAlert>
            <IconButton
              className="absolute right-3 top-3 size-8"
              icon={<X aria-hidden="true" className="size-4" />}
              label={`Recolher aviso ${announcement.title}`}
              onClick={() => actions.dismissAnnouncement(announcement.id)}
            />
          </div>
        );
      })}
    </section>
  );
}

function EventDetailsOverlay() {
  const {
    actions,
    meta: { events },
    state: { selectedEventId },
  } = useExperience();
  const event = events.find((item) => item.id === selectedEventId);

  useEffect(() => {
    if (!event) {
      return;
    }

    function onKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        actions.closeDetails();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions, event]);

  if (!event) {
    return null;
  }

  const typeConfig = eventTypeConfig[event.type];
  const TypeIcon = typeConfig.icon;
  const safeMeetingUrl =
    event.meetingUrl && isSafeExternalUrl(event.meetingUrl)
      ? event.meetingUrl
      : null;
  const safeLinks = event.links.filter((link) => isSafeExternalUrl(link.url));

  return (
    <div
      aria-labelledby="event-detail-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end bg-background/80 px-3 py-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Fechar detalhes"
        className="absolute inset-0 cursor-default"
        onClick={actions.closeDetails}
        type="button"
      />
      <article className="relative max-h-[88svh] w-full overflow-y-auto overscroll-contain rounded-t-md border border-border bg-surface p-5 shadow-soft sm:max-w-2xl sm:rounded-md">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <EventTypeIndicator type={event.type} />
              <StatusBadge status={event.status} />
            </div>
            <h2
              className="mt-3 text-pretty font-display text-2xl font-black"
              id="event-detail-title"
            >
              {event.title}
            </h2>
          </div>
          <IconButton
            icon={<X aria-hidden="true" className="size-4" />}
            label="Fechar detalhes"
            onClick={actions.closeDetails}
          />
        </div>
        <div className="grid gap-5 py-5">
          <DetailRow
            icon={<CalendarDays aria-hidden="true" className="size-4" />}
            label="Data e horário"
          >
            {formatEventDateTime(event)}
          </DetailRow>
          <DetailRow
            icon={<TypeIcon aria-hidden="true" className="size-4" />}
            label="Tipo"
          >
            {typeConfig.label}
          </DetailRow>
          {event.projects.length > 0 ? (
            <DetailRow
              icon={<Users aria-hidden="true" className="size-4" />}
              label="Projetos"
            >
              <span className="flex flex-wrap gap-2">
                {event.projects.map((project) => (
                  <ProjectTag key={project.id} name={project.name} />
                ))}
              </span>
            </DetailRow>
          ) : null}
          {event.location ? (
            <DetailRow
              icon={<MapPin aria-hidden="true" className="size-4" />}
              label="Local"
            >
              {event.location}
            </DetailRow>
          ) : null}
          {event.responsible ? (
            <DetailRow label="Responsável">{event.responsible}</DetailRow>
          ) : null}
          <DetailRow label="Situação">
            {statusDescription[event.status]}
          </DetailRow>
          {event.description ? (
            <DetailRow label="Descrição">{event.description}</DetailRow>
          ) : null}
          {event.changeNotice ? (
            <InlineAlert title="Evento alterado" tone="info">
              {event.changeNotice}
            </InlineAlert>
          ) : null}
          {safeMeetingUrl || safeLinks.length > 0 ? (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold text-text-primary">Links</h3>
              <div className="flex flex-wrap gap-2">
                {safeMeetingUrl ? (
                  <ExternalAnchor href={safeMeetingUrl}>
                    Abrir link do Meet
                  </ExternalAnchor>
                ) : null}
                {safeLinks.map((link) => (
                  <ExternalAnchor href={link.url} key={link.id}>
                    {link.label}
                  </ExternalAnchor>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function DetailRow({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon?: ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-1 text-sm leading-6 sm:grid-cols-[140px_minmax(0,1fr)]">
      <div className="flex items-center gap-2 font-semibold text-text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 break-words text-text-primary">{children}</div>
    </div>
  );
}

function ExternalAnchor({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <a
      className="inline-flex min-h-9 items-center gap-2 rounded-sm border border-border bg-surface-elevated px-3 text-sm font-semibold text-text-primary transition duration-normal hover:border-brand-orange hover:text-brand-orange focus-visible:outline-focus"
      href={href}
      rel="noreferrer noopener"
      target="_blank"
    >
      {children}
      <ExternalLink aria-hidden="true" className="size-3.5" />
    </a>
  );
}

function FilterDrawer({
  children,
  onClose,
}: {
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(keyboardEvent: KeyboardEvent) {
      if (keyboardEvent.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      aria-labelledby="filters-drawer-title"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-end bg-background/80 px-3 py-3 backdrop-blur-sm"
      role="dialog"
    >
      <button
        aria-label="Fechar filtros"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative max-h-[88svh] w-full overflow-y-auto overscroll-contain rounded-t-md border border-border bg-surface p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-border pb-4">
          <h2
            className="font-display text-xl font-bold"
            id="filters-drawer-title"
          >
            Filtros
          </h2>
          <IconButton
            icon={<X aria-hidden="true" className="size-4" />}
            label="Fechar filtros"
            onClick={onClose}
          />
        </div>
        {children}
      </div>
    </div>
  );
}

function useExperience(): ExperienceContextValue {
  const context = use(ExperienceContext);

  if (!context) {
    throw new Error("PublicCalendarExperience context is missing.");
  }

  return context;
}

function useIsDesktop() {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");

    function updateMatches() {
      setMatches(mediaQuery.matches);
    }

    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);
    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, []);

  return matches;
}

function readDismissedAnnouncements(): Set<string> {
  if (typeof window === "undefined") {
    return new Set();
  }

  const value = window.sessionStorage.getItem("titans-dismissed-announcements");
  return new Set(value ? JSON.parse(value) : []);
}

function writeDismissedAnnouncements(ids: Set<string>) {
  window.sessionStorage.setItem(
    "titans-dismissed-announcements",
    JSON.stringify([...ids]),
  );
}

function formatEventDateTime(event: PublicCalendarEvent): string {
  const start = new Date(event.start);
  const end = event.end ? new Date(event.end) : null;
  const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: APP_TIME_ZONE,
  });
  const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: APP_TIME_ZONE,
  });

  if (event.allDay) {
    return end
      ? `${dateFormatter.format(start)} a ${dateFormatter.format(end)}`
      : `${dateFormatter.format(start)}, dia inteiro`;
  }

  return end
    ? `${dateFormatter.format(start)}, ${timeFormatter.format(start)} a ${timeFormatter.format(end)}`
    : `${dateFormatter.format(start)}, ${timeFormatter.format(start)}`;
}

function getInitialMobileMonth(semester: PublicSemester): Date {
  const today = new Date();
  const start = new Date(`${semester.startsOn}T00:00:00`);
  const end = new Date(`${semester.endsOn}T23:59:59`);

  if (today < start) {
    return start;
  }

  if (today > end) {
    return end;
  }

  return today;
}

function getMonthGridDays(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const mondayOffset = (first.getDay() + 6) % 7;
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(cursor);
    day.setDate(cursor.getDate() + index);
    return day;
  });
}

function groupEventsByDay(events: PublicCalendarEvent[]) {
  return events.reduce((groups, event) => {
    const key = event.start.slice(0, 10);
    const current = groups.get(key) ?? [];
    current.push(event);
    groups.set(key, current);
    return groups;
  }, new Map<string, PublicCalendarEvent[]>());
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: APP_TIME_ZONE,
    year: "numeric",
  }).format(date);
}

function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: APP_TIME_ZONE,
  }).format(date);
}

function formatAgendaDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(`${date}T00:00:00-03:00`));
}

const quickFilterLabel: Record<PublicEventFilters["quickFilter"], string> = {
  all: "Todos",
  meetings: "Reuniões",
  competitions: "Competições",
  deadlines: "Prazos",
};

const statusFilterLabel = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
};

const statusDescription = {
  confirmed: "Confirmado pela equipe responsável.",
  pending: "Pendente: aguardando confirmação da equipe responsável.",
  changed: "Alterado: confira a nota de mudança deste evento.",
  cancelled: "Cancelado e mantido visível para evitar dúvidas.",
  completed: "Concluído, exibido com baixa prioridade visual.",
};

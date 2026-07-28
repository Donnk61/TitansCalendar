import type { EventStatus, EventTypeSlug } from "@/types/domain";

export type PublicProject = {
  id: string;
  slug: string;
  name: string;
};

export type PublicEventLink = {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
};

export type PublicEventType = {
  slug: EventTypeSlug;
  label: string;
  colorToken: string;
  iconKey: string;
  sortOrder: number;
};

export type PublicAnnouncement = {
  id: string;
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  startsAt: string;
  endsAt: string | null;
  relatedEventId: string | null;
};

export type PublicSemester = {
  id: string;
  name: string;
  startsOn: string;
  endsOn: string;
};

export type PublicCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end: string | null;
  allDay: boolean;
  type: EventTypeSlug;
  status: EventStatus;
  projects: PublicProject[];
  location: string | null;
  meetingUrl: string | null;
  responsible: string | null;
  description: string | null;
  links: PublicEventLink[];
  isImportant: boolean;
  changeNotice: string | null;
  seriesId: string | null;
};

export type FullCalendarPublicEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  classNames: string[];
  extendedProps: {
    type: EventTypeSlug;
    status: EventStatus;
    projects: PublicProject[];
    location: string | null;
    meetingUrl: string | null;
    responsible: string | null;
    description: string | null;
    links: PublicEventLink[];
    isImportant: boolean;
    changeNotice: string | null;
    seriesId: string | null;
  };
};

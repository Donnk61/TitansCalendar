import { z } from "zod";

export const eventStatusSchema = z.enum([
  "confirmed",
  "pending",
  "changed",
  "cancelled",
  "completed",
]);

export type EventStatus = z.infer<typeof eventStatusSchema>;

export const eventTypeSlugSchema = z.enum([
  "general-meeting",
  "leaders-meeting",
  "deadline",
  "competition",
  "external-event",
  "selection-process",
  "fundraising",
  "milestone",
]);

export type EventTypeSlug = z.infer<typeof eventTypeSlugSchema>;

export const editorRoleSchema = z.enum(["admin", "editor"]);
export type EditorRole = z.infer<typeof editorRoleSchema>;

export const announcementSeveritySchema = z.enum([
  "info",
  "warning",
  "critical",
]);

export type AnnouncementSeverity = z.infer<typeof announcementSeveritySchema>;

export const recurrenceFrequencySchema = z.enum(["weekly", "biweekly"]);
export type RecurrenceFrequency = z.infer<typeof recurrenceFrequencySchema>;

const uuidSchema = z.uuid();
const postgresDateSchema = z.iso.date();
const postgresTimestampSchema = z.iso.datetime({ offset: true });
const optionalTextSchema = z.string().trim().min(1).max(280).nullable();

export const semesterSchema = z
  .object({
    id: uuidSchema,
    name: z.string().trim().min(1).max(80),
    startsOn: postgresDateSchema,
    endsOn: postgresDateSchema,
    isActive: z.boolean(),
    archivedAt: postgresTimestampSchema.nullable(),
    createdAt: postgresTimestampSchema,
    updatedAt: postgresTimestampSchema,
  })
  .refine((semester) => semester.startsOn <= semester.endsOn, {
    message: "A data final do semestre deve ser posterior ou igual ao inicio.",
    path: ["endsOn"],
  });

export type Semester = z.infer<typeof semesterSchema>;

export const projectSchema = z.object({
  id: uuidSchema,
  slug: z.string().trim().min(1).max(80),
  name: z.string().trim().min(1).max(80),
  isActive: z.boolean(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: postgresTimestampSchema,
  updatedAt: postgresTimestampSchema,
});

export type Project = z.infer<typeof projectSchema>;

export const eventTypeSchema = z.object({
  slug: eventTypeSlugSchema,
  label: z.string().trim().min(1).max(80),
  colorToken: z.string().trim().min(1).max(80),
  iconKey: z.string().trim().min(1).max(80),
  sortOrder: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

export type EventType = z.infer<typeof eventTypeSchema>;

export const eventLinkSchema = z.object({
  id: uuidSchema,
  eventId: uuidSchema,
  label: z.string().trim().min(1).max(80),
  url: z
    .url()
    .refine((url) => url.startsWith("http://") || url.startsWith("https://"), {
      message: "Use um link HTTP ou HTTPS.",
    }),
  sortOrder: z.number().int().nonnegative(),
});

export type EventLink = z.infer<typeof eventLinkSchema>;

export const recurrenceRuleSchema = z.object({
  schemaVersion: z.literal(1),
  frequency: recurrenceFrequencySchema,
  startsOn: postgresDateSchema,
  endsOn: postgresDateSchema,
  intervalWeeks: z.union([z.literal(1), z.literal(2)]),
});

export type RecurrenceRule = z.infer<typeof recurrenceRuleSchema>;

export const eventSchema = z
  .object({
    id: uuidSchema,
    semesterId: uuidSchema,
    seriesId: uuidSchema.nullable(),
    occurrenceIndex: z.number().int().nonnegative().nullable(),
    title: z.string().trim().min(1).max(120),
    startsAt: postgresTimestampSchema,
    endsAt: postgresTimestampSchema.nullable(),
    allDay: z.boolean(),
    typeSlug: eventTypeSlugSchema,
    status: eventStatusSchema,
    locationName: optionalTextSchema,
    meetingUrl: z
      .url()
      .refine(
        (url) => url.startsWith("http://") || url.startsWith("https://"),
        {
          message: "Use um link HTTP ou HTTPS.",
        },
      )
      .nullable(),
    responsible: optionalTextSchema,
    description: z.string().trim().max(1_000).nullable(),
    changeNote: optionalTextSchema,
    changeVisibleUntil: postgresTimestampSchema.nullable(),
    isImportant: z.boolean(),
    createdByEmail: z.email(),
    updatedByEmail: z.email(),
    createdAt: postgresTimestampSchema,
    updatedAt: postgresTimestampSchema,
  })
  .refine((event) => event.endsAt === null || event.endsAt >= event.startsAt, {
    message: "O termino do evento nao pode ser anterior ao inicio.",
    path: ["endsAt"],
  });

export type CalendarEvent = z.infer<typeof eventSchema>;

export const announcementSchema = z
  .object({
    id: uuidSchema,
    semesterId: uuidSchema,
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(1_000),
    severity: announcementSeveritySchema,
    startsAt: postgresTimestampSchema,
    endsAt: postgresTimestampSchema.nullable(),
    relatedEventId: uuidSchema.nullable(),
    isPublished: z.boolean(),
    createdByEmail: z.email(),
    updatedByEmail: z.email(),
    createdAt: postgresTimestampSchema,
    updatedAt: postgresTimestampSchema,
  })
  .refine(
    (announcement) =>
      announcement.endsAt === null ||
      announcement.endsAt >= announcement.startsAt,
    {
      message: "O termino do aviso nao pode ser anterior ao inicio.",
      path: ["endsAt"],
    },
  );

export type Announcement = z.infer<typeof announcementSchema>;

export const editorProfileSchema = z.object({
  id: uuidSchema,
  email: z.email(),
  displayName: z.string().trim().min(1).max(120).nullable(),
  role: editorRoleSchema,
  isActive: z.boolean(),
  createdAt: postgresTimestampSchema,
  updatedAt: postgresTimestampSchema,
});

export type EditorProfile = z.infer<typeof editorProfileSchema>;

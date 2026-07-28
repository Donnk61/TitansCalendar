import { z } from "zod";
import { eventStatusSchema, eventTypeSlugSchema } from "@/types/domain";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((value) => (value.length > 0 ? value : null));

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .pipe(
    z
      .url()
      .refine((url) => url.startsWith("http://") || url.startsWith("https://"))
      .nullable(),
  );

export const adminEventFormSchema = z
  .object({
    allDay: z.boolean(),
    changeNote: optionalText(280),
    changeVisibleUntilDate: z.string().optional(),
    description: optionalText(1_000),
    endsOn: z.iso.date().optional(),
    endTime: z.string().optional(),
    isImportant: z.boolean(),
    linkLabels: z.array(z.string().trim().max(80)),
    linkUrls: z.array(z.string().trim()),
    locationName: optionalText(280),
    meetingUrl: optionalUrl,
    originalUpdatedAt: z.string().optional(),
    projectIds: z.array(z.uuid()),
    recurrence: z.enum(["none", "weekly", "biweekly"]),
    repeatUntil: z.string().optional(),
    responsible: optionalText(280),
    startsOn: z.iso.date(),
    startTime: z.string().optional(),
    status: eventStatusSchema,
    title: z.string().trim().min(1).max(120),
    typeSlug: eventTypeSlugSchema,
  })
  .superRefine((event, context) => {
    if (!event.allDay && !event.startTime) {
      context.addIssue({
        code: "custom",
        message: "Informe o horário inicial.",
        path: ["startTime"],
      });
    }

    if (event.recurrence !== "none" && !event.repeatUntil) {
      context.addIssue({
        code: "custom",
        message: "Informe até quando repetir.",
        path: ["repeatUntil"],
      });
    }

    event.linkUrls.forEach((url, index) => {
      const label = event.linkLabels[index]?.trim();

      if (!url && !label) {
        return;
      }

      if (!label) {
        context.addIssue({
          code: "custom",
          message: "Informe o rótulo do link.",
          path: ["linkLabels", index],
        });
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        context.addIssue({
          code: "custom",
          message: "Use URL HTTP ou HTTPS.",
          path: ["linkUrls", index],
        });
      }
    });
  });

export type AdminEventFormInput = z.infer<typeof adminEventFormSchema>;

export function parseEventFormData(formData: FormData): AdminEventFormInput {
  return adminEventFormSchema.parse({
    allDay: formData.get("allDay") === "on",
    changeNote: formData.get("changeNote") ?? "",
    changeVisibleUntilDate: formData.get("changeVisibleUntilDate") || undefined,
    description: formData.get("description") ?? "",
    endsOn: formData.get("endsOn") || undefined,
    endTime: formData.get("endTime") || undefined,
    isImportant: formData.get("isImportant") === "on",
    linkLabels: formData.getAll("linkLabel").map(String),
    linkUrls: formData.getAll("linkUrl").map(String),
    locationName: formData.get("locationName") ?? "",
    meetingUrl: formData.get("meetingUrl") ?? "",
    originalUpdatedAt: formData.get("originalUpdatedAt") || undefined,
    projectIds: formData.getAll("projectIds").map(String),
    recurrence: formData.get("recurrence") || "none",
    repeatUntil: formData.get("repeatUntil") || undefined,
    responsible: formData.get("responsible") ?? "",
    startsOn: formData.get("startsOn"),
    startTime: formData.get("startTime") || undefined,
    status: formData.get("status") || "confirmed",
    title: formData.get("title"),
    typeSlug: formData.get("typeSlug"),
  });
}

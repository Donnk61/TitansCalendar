"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { addDays, parseISO } from "date-fns";
import { z } from "zod";
import {
  generateOccurrences,
  getRecurrenceRule,
} from "@/features/events/recurrence";
import {
  getEventConflictWarnings,
  validateEventInsideSemester,
} from "@/features/events/admin-rules";
import { revalidatePublicCalendar } from "@/server/actions/revalidate-public-calendar";
import { requireAdmin, requireEditor } from "@/server/authorization/access";
import { getAdminEventOptions } from "@/server/queries/admin-events";
import { parseEventFormData } from "@/server/validation/event-form";

export type EventActionState = {
  status: "idle" | "success" | "error";
  message: string;
  eventId?: string;
  conflicts?: string[];
};

const initialRedirect = "/admin/events";

export async function createAdminEvent(
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const input = parseEventFormData(formData);
    const { supabase, user } = await requireEditor();
    const options = await getAdminEventOptions();

    if (!options.semester) {
      return {
        status: "error",
        message: "Ative um semestre antes de criar eventos.",
      };
    }

    const timing = buildEventTiming(input);
    const semesterRangeError = validateEventInsideSemester(timing, {
      endsOn: options.semester.ends_on,
      startsOn: options.semester.starts_on,
    });

    if (semesterRangeError) {
      return { status: "error", message: semesterRangeError };
    }

    const repeatUntil =
      input.recurrence === "none"
        ? null
        : (input.repeatUntil ?? options.semester.ends_on);
    const occurrences = generateOccurrences({
      allDay: input.allDay,
      endsAt: timing.endsAt,
      frequency: input.recurrence,
      repeatUntil,
      semesterEndsOn: options.semester.ends_on,
      startsAt: timing.startsAt,
    });

    const conflicts = await findConflicts({
      endsAt: timing.endsAt,
      startsAt: timing.startsAt,
      supabase,
      title: input.title,
    });

    let seriesId: string | null = null;

    if (input.recurrence !== "none") {
      const { data: series, error: seriesError } = await supabase
        .from("event_series")
        .insert({
          created_by_email: user.email ?? "",
          rule: getRecurrenceRule({
            endsOn: repeatUntil ?? options.semester.ends_on,
            frequency: input.recurrence,
            startsOn: input.startsOn,
          }),
          semester_id: options.semester.id,
          title_snapshot: input.title,
        })
        .select("id")
        .single();

      if (seriesError) {
        console.error("Failed to create event series", seriesError);

        return {
          status: "error",
          message: "Não foi possível criar a série recorrente.",
        };
      }

      seriesId = series.id;
    }

    const eventRows = occurrences.map((occurrence) => ({
      ...toEventInsert(input, {
        createdByEmail: user.email ?? "",
        semesterId: options.semester?.id ?? "",
        startsAt: occurrence.startsAt,
        endsAt: occurrence.endsAt,
      }),
      occurrence_index: seriesId ? occurrence.index : null,
      series_id: seriesId,
    }));

    const { data: events, error: eventError } = await supabase
      .from("events")
      .insert(eventRows)
      .select("id");

    if (eventError || !events?.[0]) {
      console.error("Failed to create admin event", eventError);

      return { status: "error", message: "Não foi possível salvar o evento." };
    }

    await replaceEventRelations({
      eventIds: events.map((event) => event.id),
      form: input,
      supabase,
    });
    await revalidatePublicCalendar();
    revalidatePath("/admin");
    revalidatePath("/admin/events");

    return {
      status: "success",
      conflicts,
      eventId: events[0].id,
      message:
        occurrences.length > 1
          ? `${occurrences.length} ocorrências criadas.`
          : "Evento criado com sucesso.",
    };
  } catch (error) {
    console.error("Unexpected admin event creation failure", error);

    return {
      status: "error",
      message: getEventActionErrorMessage(error),
    };
  }
}

export async function updateAdminEvent(
  eventId: string,
  _previousState: EventActionState,
  formData: FormData,
): Promise<EventActionState> {
  try {
    const input = parseEventFormData(formData);
    const { supabase, user } = await requireEditor();
    const options = await getAdminEventOptions();

    if (!options.semester) {
      return { status: "error", message: "Nenhum semestre ativo encontrado." };
    }

    const timing = buildEventTiming(input);
    const semesterRangeError = validateEventInsideSemester(timing, {
      endsOn: options.semester.ends_on,
      startsOn: options.semester.starts_on,
    });

    if (semesterRangeError) {
      return { status: "error", message: semesterRangeError };
    }

    if (!input.originalUpdatedAt) {
      return {
        status: "error",
        message: "Recarregue o evento antes de salvar alterações.",
      };
    }

    const { data, error } = await supabase
      .from("events")
      .update(
        toEventUpdate(input, {
          endsAt: timing.endsAt,
          startsAt: timing.startsAt,
          updatedByEmail: user.email ?? "",
        }),
      )
      .eq("id", eventId)
      .eq("updated_at", input.originalUpdatedAt)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Failed to update admin event", error);

      return {
        status: "error",
        message: "Não foi possível atualizar o evento.",
      };
    }

    if (!data) {
      return {
        status: "error",
        message:
          "Este evento mudou desde que você abriu a tela. Recarregue antes de salvar.",
      };
    }

    await replaceEventRelations({ eventIds: [eventId], form: input, supabase });
    await revalidatePublicCalendar();
    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${eventId}`);

    return {
      status: "success",
      eventId,
      message: "Evento atualizado com sucesso.",
    };
  } catch (error) {
    console.error("Unexpected admin event update failure", error);

    return {
      status: "error",
      message: getEventActionErrorMessage(error),
    };
  }
}

function getEventActionErrorMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0];

    return firstIssue?.message
      ? `Revise o campo: ${firstIssue.message}`
      : "Revise os campos obrigatÃ³rios e tente novamente.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Revise os campos e tente salvar novamente.";
}

export async function cancelAdminEvent(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const { supabase, user } = await requireEditor();

  const { error } = await supabase
    .from("events")
    .update({
      change_note:
        String(formData.get("changeNote") ?? "").trim() || "Evento cancelado.",
      change_visible_until:
        String(formData.get("changeVisibleUntil") || "") || null,
      status: "cancelled",
      updated_by_email: user.email ?? "",
    })
    .eq("id", eventId);

  if (error) {
    throw new Error("Não foi possível cancelar o evento.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/events");
  redirect(initialRedirect);
}

export async function deleteAdminEventPermanently(formData: FormData) {
  const eventId = String(formData.get("eventId") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  const { supabase } = await requireAdmin();

  if (confirmation !== "EXCLUIR") {
    throw new Error("Confirmação inválida.");
  }

  const { error } = await supabase.from("events").delete().eq("id", eventId);

  if (error) {
    throw new Error("Não foi possível excluir o evento.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/events");
  redirect(initialRedirect);
}

function buildEventTiming(input: ReturnType<typeof parseEventFormData>) {
  const startsAt = parseISO(
    input.allDay
      ? `${input.startsOn}T00:00:00-03:00`
      : `${input.startsOn}T${input.startTime}:00-03:00`,
  );
  const endsAt = getEndDate(input);

  if (endsAt && endsAt < startsAt) {
    throw new Error("Fim anterior ao início.");
  }

  return { startsAt, endsAt };
}

function getEndDate(input: ReturnType<typeof parseEventFormData>) {
  if (input.allDay) {
    const endDate = input.endsOn || input.startsOn;
    return parseISO(`${endDate}T00:00:00-03:00`);
  }

  if (!input.endsOn && !input.endTime) {
    return null;
  }

  return parseISO(
    `${input.endsOn || input.startsOn}T${input.endTime || input.startTime}:00-03:00`,
  );
}

function toEventInsert(
  input: ReturnType<typeof parseEventFormData>,
  context: {
    createdByEmail: string;
    endsAt: Date | null;
    semesterId: string;
    startsAt: Date;
  },
) {
  return {
    all_day: input.allDay,
    change_note: input.changeNote,
    change_visible_until: input.changeVisibleUntilDate
      ? `${input.changeVisibleUntilDate}T23:59:59-03:00`
      : null,
    created_by_email: context.createdByEmail,
    description: input.description,
    ends_at: context.endsAt ? context.endsAt.toISOString() : null,
    is_important: input.isImportant,
    location_name: input.locationName,
    meeting_url: input.meetingUrl,
    responsible: input.responsible,
    semester_id: context.semesterId,
    starts_at: context.startsAt.toISOString(),
    status: input.status,
    title: input.title,
    type_slug: input.typeSlug,
    updated_by_email: context.createdByEmail,
  };
}

function toEventUpdate(
  input: ReturnType<typeof parseEventFormData>,
  context: {
    endsAt: Date | null;
    startsAt: Date;
    updatedByEmail: string;
  },
) {
  return {
    all_day: input.allDay,
    change_note: input.changeNote,
    change_visible_until: input.changeVisibleUntilDate
      ? `${input.changeVisibleUntilDate}T23:59:59-03:00`
      : null,
    description: input.description,
    ends_at: context.endsAt ? context.endsAt.toISOString() : null,
    is_important: input.isImportant,
    location_name: input.locationName,
    meeting_url: input.meetingUrl,
    responsible: input.responsible,
    starts_at: context.startsAt.toISOString(),
    status: input.status,
    title: input.title,
    type_slug: input.typeSlug,
    updated_by_email: context.updatedByEmail,
  };
}

async function replaceEventRelations(input: {
  eventIds: string[];
  form: ReturnType<typeof parseEventFormData>;
  supabase: Awaited<ReturnType<typeof requireEditor>>["supabase"];
}) {
  const links = input.form.linkUrls
    .map((url, index) => ({
      label: input.form.linkLabels[index]?.trim() ?? "",
      sort_order: index,
      url: url.trim(),
    }))
    .filter((link) => link.label && link.url);

  await Promise.all(
    input.eventIds.map(async (eventId) => {
      await Promise.all([
        input.supabase.from("event_projects").delete().eq("event_id", eventId),
        input.supabase.from("event_links").delete().eq("event_id", eventId),
      ]);

      const projectRows = input.form.projectIds.map((projectId) => ({
        event_id: eventId,
        project_id: projectId,
      }));
      const linkRows = links.map((link) => ({ ...link, event_id: eventId }));

      await Promise.all([
        projectRows.length > 0
          ? input.supabase.from("event_projects").insert(projectRows)
          : Promise.resolve({ error: null }),
        linkRows.length > 0
          ? input.supabase.from("event_links").insert(linkRows)
          : Promise.resolve({ error: null }),
      ]);
    }),
  );
}

async function findConflicts(input: {
  endsAt: Date | null;
  startsAt: Date;
  supabase: Awaited<ReturnType<typeof requireEditor>>["supabase"];
  title: string;
}) {
  const startsAt = input.startsAt.toISOString();
  const endsAt = (input.endsAt ?? addDays(input.startsAt, 1)).toISOString();
  const { data } = await input.supabase
    .from("events")
    .select("id,title,starts_at,ends_at")
    .lt("starts_at", endsAt)
    .or(`ends_at.is.null,ends_at.gte.${startsAt}`)
    .limit(5);

  return getEventConflictWarnings(
    {
      endsAt: input.endsAt,
      startsAt: input.startsAt,
      title: input.title,
    },
    (data ?? []).map((event) => ({
      id: event.id,
      endsAt: event.ends_at ? new Date(event.ends_at) : null,
      startsAt: new Date(event.starts_at),
      title: event.title,
    })),
  ).slice(0, 3);
}

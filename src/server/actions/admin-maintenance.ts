"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidatePublicCalendar } from "@/server/actions/revalidate-public-calendar";
import { requireAdmin, requireEditor } from "@/server/authorization/access";

const uuidSchema = z.uuid();
const semesterSchema = z
  .object({
    endsOn: z.iso.date(),
    name: z.string().trim().min(1).max(80),
    startsOn: z.iso.date(),
  })
  .refine((semester) => semester.startsOn <= semester.endsOn, {
    message: "A data final precisa ser posterior ao início.",
  });

const projectSchema = z.object({
  id: z.uuid().optional(),
  isActive: z.boolean(),
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sortOrder: z.coerce.number().int().nonnegative(),
});

const eventTypeSchema = z.object({
  colorToken: z.string().trim().min(1).max(80),
  iconKey: z.string().trim().min(1).max(80),
  isActive: z.boolean(),
  label: z.string().trim().min(1).max(80),
  slug: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().nonnegative(),
});

const announcementSchema = z
  .object({
    body: z.string().trim().min(1).max(1_000),
    endsAt: z.string().optional(),
    id: z.uuid().optional(),
    isPublished: z.boolean(),
    relatedEventId: z.string().optional(),
    severity: z.enum(["info", "warning", "critical"]),
    startsAt: z.string().min(1),
    title: z.string().trim().min(1).max(120),
  })
  .refine(
    (announcement) =>
      !announcement.endsAt || announcement.endsAt >= announcement.startsAt,
    {
      message: "O fim do aviso não pode ser anterior ao início.",
    },
  );

export async function createSemester(formData: FormData) {
  const input = semesterSchema.parse({
    endsOn: formData.get("endsOn"),
    name: formData.get("name"),
    startsOn: formData.get("startsOn"),
  });
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("semesters").insert({
    ends_on: input.endsOn,
    is_active: false,
    name: input.name,
    starts_on: input.startsOn,
  });

  if (error) {
    throw new Error("Não foi possível criar o semestre.");
  }

  revalidatePath("/admin/semester");
}

export async function updateActiveSemester(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const input = semesterSchema.parse({
    endsOn: formData.get("endsOn"),
    name: formData.get("name"),
    startsOn: formData.get("startsOn"),
  });
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("semesters")
    .update({
      ends_on: input.endsOn,
      name: input.name,
      starts_on: input.startsOn,
    })
    .eq("id", id)
    .eq("is_active", true)
    .is("archived_at", null);

  if (error) {
    throw new Error("Não foi possível atualizar o semestre ativo.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/semester");
}

export async function activateSemester(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const { supabase } = await requireAdmin();
  const { data: targetSemester, error: targetError } = await supabase
    .from("semesters")
    .select("id")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle();

  if (targetError || !targetSemester) {
    throw new Error("Nao foi possivel ativar o semestre.");
  }

  const { error: deactivateError } = await supabase
    .from("semesters")
    .update({ is_active: false })
    .eq("is_active", true);

  if (deactivateError) {
    throw new Error("Nao foi possivel ativar o semestre.");
  }

  const { error: activateError } = await supabase
    .from("semesters")
    .update({
      archived_at: null,
      is_active: true,
    })
    .eq("id", id);

  if (activateError) {
    throw new Error("Nao foi possivel ativar o semestre.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/semester");
}

export async function archiveActiveSemester(formData: FormData) {
  const id = uuidSchema.parse(formData.get("id"));
  const confirmation = String(formData.get("confirmation") ?? "");
  const { supabase } = await requireAdmin();

  if (confirmation !== "ARQUIVAR") {
    throw new Error("Digite ARQUIVAR para confirmar.");
  }

  const { data, error } = await supabase
    .from("semesters")
    .update({
      archived_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id)
    .eq("is_active", true)
    .is("archived_at", null)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error("Nao foi possivel arquivar o semestre.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/semester");
}

export async function upsertProject(formData: FormData) {
  const input = projectSchema.parse({
    id: formData.get("id") || undefined,
    isActive: formData.get("isActive") === "on",
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  const { supabase } = await requireAdmin();
  const payload = {
    is_active: input.isActive,
    name: input.name,
    slug: input.slug,
    sort_order: input.sortOrder,
  };
  const { error } = input.id
    ? await supabase.from("projects").update(payload).eq("id", input.id)
    : await supabase.from("projects").insert(payload);

  if (error) {
    throw new Error("Não foi possível salvar o projeto.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/semester");
}

export async function updateEventType(formData: FormData) {
  const input = eventTypeSchema.parse({
    colorToken: formData.get("colorToken"),
    iconKey: formData.get("iconKey"),
    isActive: formData.get("isActive") === "on",
    label: formData.get("label"),
    slug: formData.get("slug"),
    sortOrder: formData.get("sortOrder") || 0,
  });
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("event_types")
    .update({
      color_token: input.colorToken,
      icon_key: input.iconKey,
      is_active: input.isActive,
      label: input.label,
      sort_order: input.sortOrder,
    })
    .eq("slug", input.slug);

  if (error) {
    throw new Error("Não foi possível salvar o tipo.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/semester");
}

export async function upsertAnnouncement(formData: FormData) {
  const input = announcementSchema.parse({
    body: formData.get("body"),
    endsAt: formData.get("endsAt") || undefined,
    id: formData.get("id") || undefined,
    isPublished: formData.get("isPublished") === "on",
    relatedEventId: formData.get("relatedEventId") || undefined,
    severity: formData.get("severity"),
    startsAt: formData.get("startsAt"),
    title: formData.get("title"),
  });
  const { supabase, user } = await requireEditor();
  const { data: semester } = await supabase
    .from("semesters")
    .select("id")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (!semester) {
    throw new Error("Ative um semestre antes de salvar avisos.");
  }

  const payload = {
    body: input.body,
    ends_at: input.endsAt || null,
    is_published: input.isPublished,
    related_event_id: input.relatedEventId || null,
    semester_id: semester.id,
    severity: input.severity,
    starts_at: input.startsAt,
    title: input.title,
    updated_by_email: user.email ?? "",
  };
  const { error } = input.id
    ? await supabase.from("announcements").update(payload).eq("id", input.id)
    : await supabase.from("announcements").insert({
        ...payload,
        created_by_email: user.email ?? "",
      });

  if (error) {
    throw new Error("Não foi possível salvar o aviso.");
  }

  await revalidatePublicCalendar();
  revalidatePath("/admin/announcements");
}

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type SemesterSummary = {
  announcements: number;
  events: number;
  series: number;
};

export type AdminMaintenanceData = {
  activeSemester: Pick<
    Database["public"]["Tables"]["semesters"]["Row"],
    "ends_on" | "id" | "name" | "starts_on"
  > | null;
  semesters: Database["public"]["Tables"]["semesters"]["Row"][];
  summary: SemesterSummary;
  projects: Database["public"]["Tables"]["projects"]["Row"][];
  eventTypes: Database["public"]["Tables"]["event_types"]["Row"][];
};

export async function getAdminMaintenanceData(): Promise<AdminMaintenanceData> {
  const supabase = await createSupabaseServerClient();
  const [semestersResult, projectsResult, eventTypesResult] = await Promise.all(
    [
      supabase
        .from("semesters")
        .select("*")
        .order("starts_on", { ascending: false }),
      supabase
        .from("projects")
        .select("*")
        .order("is_active", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("event_types")
        .select("*")
        .order("sort_order", { ascending: true }),
    ],
  );

  const error =
    semestersResult.error ?? projectsResult.error ?? eventTypesResult.error;

  if (error) {
    throw new Error("Falha ao carregar manutenção administrativa.");
  }

  const activeSemester =
    semestersResult.data?.find(
      (semester) => semester.is_active && !semester.archived_at,
    ) ?? null;
  const summary = activeSemester
    ? await getSemesterSummary(activeSemester.id)
    : { announcements: 0, events: 0, series: 0 };

  return {
    activeSemester,
    eventTypes: eventTypesResult.data ?? [],
    projects: projectsResult.data ?? [],
    semesters: semestersResult.data ?? [],
    summary,
  };
}

export async function getSemesterSummary(
  semesterId: string,
): Promise<SemesterSummary> {
  const supabase = await createSupabaseServerClient();
  const [events, series, announcements] = await Promise.all([
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId),
    supabase
      .from("event_series")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId),
    supabase
      .from("announcements")
      .select("id", { count: "exact", head: true })
      .eq("semester_id", semesterId),
  ]);

  const error = events.error ?? series.error ?? announcements.error;

  if (error) {
    throw new Error("Falha ao contar dados do semestre.");
  }

  return {
    announcements: announcements.count ?? 0,
    events: events.count ?? 0,
    series: series.count ?? 0,
  };
}

export type AdminAnnouncementRow =
  Database["public"]["Tables"]["announcements"]["Row"] & {
    events?: { id: string; title: string } | null;
  };

export async function listAdminAnnouncements(): Promise<
  AdminAnnouncementRow[]
> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
        *,
        events (
          id,
          title
        )
      `,
    )
    .order("starts_at", { ascending: false });

  if (error) {
    throw new Error("Falha ao carregar avisos.");
  }

  return data ?? [];
}

export async function listActiveSemesterEventChoices(): Promise<
  Array<{ id: string; title: string }>
> {
  const supabase = await createSupabaseServerClient();
  const { data: semester, error: semesterError } = await supabase
    .from("semesters")
    .select("id")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (semesterError || !semester) {
    return [];
  }

  const { data, error } = await supabase
    .from("events")
    .select("id,title")
    .eq("semester_id", semester.id)
    .order("starts_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Falha ao carregar eventos para avisos.");
  }

  return data ?? [];
}

import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

export type AdminEventListFilters = {
  period?: string;
  projectId?: string;
  query?: string;
  status?: string;
  typeSlug?: string;
};

export type AdminEventListItem =
  Database["public"]["Tables"]["events"]["Row"] & {
    event_projects?: Array<{
      projects: { id: string; name: string; slug: string } | null;
    }> | null;
  };

export type AdminEventOptions = {
  eventTypes: Database["public"]["Tables"]["event_types"]["Row"][];
  projects: Database["public"]["Tables"]["projects"]["Row"][];
  semester: Pick<
    Database["public"]["Tables"]["semesters"]["Row"],
    "id" | "name" | "starts_on" | "ends_on"
  > | null;
};

export async function getAdminEventOptions(): Promise<AdminEventOptions> {
  const supabase = await createSupabaseServerClient();
  const [semesterResult, projectsResult, eventTypesResult] = await Promise.all([
    supabase
      .from("semesters")
      .select("id,name,starts_on,ends_on")
      .eq("is_active", true)
      .is("archived_at", null)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id,slug,name,is_active,sort_order,created_at,updated_at")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("event_types")
      .select("slug,label,color_token,icon_key,sort_order,is_active")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const error =
    semesterResult.error ?? projectsResult.error ?? eventTypesResult.error;

  if (error) {
    throw new Error("Falha ao carregar opções de evento.");
  }

  return {
    eventTypes: eventTypesResult.data ?? [],
    projects: projectsResult.data ?? [],
    semester: semesterResult.data,
  };
}

export async function listAdminEvents(
  filters: AdminEventListFilters,
): Promise<AdminEventListItem[]> {
  const supabase = await createSupabaseServerClient();
  const options = await getAdminEventOptions();

  if (!options.semester) {
    return [];
  }

  let query = supabase
    .from("events")
    .select(
      `
        *,
        event_projects (
          projects (
            id,
            slug,
            name
          )
        )
      `,
    )
    .eq("semester_id", options.semester.id)
    .order("starts_at", { ascending: true });

  if (filters.query) {
    query = query.ilike("title", `%${filters.query}%`);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.typeSlug) {
    query = query.eq("type_slug", filters.typeSlug);
  }

  if (filters.period === "future") {
    query = query.gte("starts_at", new Date().toISOString());
  }

  if (filters.period === "past") {
    query = query.lt("starts_at", new Date().toISOString());
  }

  if (filters.projectId) {
    query = query.eq("event_projects.project_id", filters.projectId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error("Falha ao carregar eventos.");
  }

  return data ?? [];
}

export async function getAdminEventById(id: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(
      `
        *,
        event_links (
          id,
          label,
          url,
          sort_order
        ),
        event_projects (
          project_id,
          projects (
            id,
            slug,
            name
          )
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Falha ao carregar evento.");
  }

  return data;
}

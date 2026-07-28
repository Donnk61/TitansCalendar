import "server-only";

import { toPostgresTimestamp } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type SemesterRow = Database["public"]["Tables"]["semesters"]["Row"];
type EventRow = Pick<
  Database["public"]["Tables"]["events"]["Row"],
  "id" | "title" | "starts_at" | "status" | "type_slug" | "updated_at"
>;
type AnnouncementRow = Pick<
  Database["public"]["Tables"]["announcements"]["Row"],
  "id" | "title" | "severity" | "starts_at" | "ends_at"
>;

export type AdminDashboardData = {
  activeSemester: Pick<
    SemesterRow,
    "id" | "name" | "starts_on" | "ends_on"
  > | null;
  upcomingEvents: EventRow[];
  pendingEvents: EventRow[];
  recentChanges: EventRow[];
  currentAnnouncements: AnnouncementRow[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createSupabaseServerClient();
  const now = toPostgresTimestamp(new Date());

  const { data: activeSemester, error: semesterError } = await supabase
    .from("semesters")
    .select("id,name,starts_on,ends_on")
    .eq("is_active", true)
    .is("archived_at", null)
    .maybeSingle();

  if (semesterError) {
    throw new Error("Falha ao carregar semestre ativo.");
  }

  if (!activeSemester) {
    return {
      activeSemester: null,
      upcomingEvents: [],
      pendingEvents: [],
      recentChanges: [],
      currentAnnouncements: [],
    };
  }

  const eventSelect = "id,title,starts_at,status,type_slug,updated_at";
  const [
    upcomingEventsResult,
    pendingEventsResult,
    recentChangesResult,
    announcementsResult,
  ] = await Promise.all([
    supabase
      .from("events")
      .select(eventSelect)
      .eq("semester_id", activeSemester.id)
      .gte("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("events")
      .select(eventSelect)
      .eq("semester_id", activeSemester.id)
      .eq("status", "pending")
      .order("starts_at", { ascending: true })
      .limit(5),
    supabase
      .from("events")
      .select(eventSelect)
      .eq("semester_id", activeSemester.id)
      .in("status", ["changed", "cancelled"])
      .order("updated_at", { ascending: false })
      .limit(5),
    supabase
      .from("announcements")
      .select("id,title,severity,starts_at,ends_at")
      .eq("semester_id", activeSemester.id)
      .eq("is_published", true)
      .lte("starts_at", now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order("starts_at", { ascending: false })
      .limit(5),
  ]);

  const firstError =
    upcomingEventsResult.error ??
    pendingEventsResult.error ??
    recentChangesResult.error ??
    announcementsResult.error;

  if (firstError) {
    throw new Error("Falha ao carregar dados do painel.");
  }

  return {
    activeSemester,
    upcomingEvents: upcomingEventsResult.data ?? [],
    pendingEvents: pendingEventsResult.data ?? [],
    recentChanges: recentChangesResult.data ?? [],
    currentAnnouncements: announcementsResult.data ?? [],
  };
}

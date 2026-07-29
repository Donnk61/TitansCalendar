import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import type { EditorAccess } from "@/server/auth/admin-session";

export async function listEditorAccess(): Promise<EditorAccess[]> {
  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("editor_access")
    .select("id,email,display_name,role,is_active,created_at,updated_at")
    .order("is_active", { ascending: false })
    .order("role", { ascending: true })
    .order("email", { ascending: true });

  if (error) {
    throw new Error("Falha ao carregar acessos administrativos.");
  }

  return data ?? [];
}

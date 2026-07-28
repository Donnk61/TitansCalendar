import "server-only";

import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";
export { getSafeAdminNextPath } from "@/server/auth/safe-next";

export type EditorAccess = Database["public"]["Tables"]["editor_access"]["Row"];

export type AdminSessionState =
  | { status: "unconfigured"; message: string }
  | { status: "unauthenticated" }
  | { status: "unauthorized"; user: User }
  | { status: "authorized"; user: User; access: EditorAccess };

export async function getAdminSessionState(): Promise<AdminSessionState> {
  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      status: "unconfigured",
      message:
        "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para ativar o login administrativo.",
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { status: "unauthenticated" };
  }

  const { data, error } = await supabase
    .from("editor_access")
    .select("id,email,display_name,role,is_active,created_at,updated_at")
    .eq("email", user.email.toLowerCase())
    .maybeSingle();

  if (error || !data || !data.is_active) {
    return { status: "unauthorized", user };
  }

  return {
    status: "authorized",
    user,
    access: data,
  };
}

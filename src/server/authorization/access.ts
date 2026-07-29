import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import {
  getAdminSessionState,
  getStaticAdminUser,
} from "@/server/auth/admin-session";

export class AuthorizationError extends Error {
  constructor(message = "Acesso negado.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedUser() {
  const state = await getAdminSessionState();

  if (state.status !== "authorized") {
    throw new AuthorizationError("Sessao administrativa obrigatoria.");
  }

  return {
    supabase: createSupabaseServiceRoleClient(),
    user: getStaticAdminUser(),
  };
}

export async function requireEditor() {
  return requireAuthenticatedUser();
}

export async function requireAdmin() {
  const context = await requireAuthenticatedUser();

  return context;
}

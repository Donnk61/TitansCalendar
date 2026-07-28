import { createSupabaseServerClient } from "@/lib/supabase/server";

export class AuthorizationError extends Error {
  constructor(message = "Acesso negado.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.email) {
    throw new AuthorizationError("Sessão autenticada obrigatória.");
  }

  return { supabase, user };
}

export async function requireEditor() {
  const context = await requireAuthenticatedUser();
  const { data, error } = await context.supabase.rpc("is_editor");

  if (error || data !== true) {
    throw new AuthorizationError("Editor autorizado obrigatório.");
  }

  return context;
}

export async function requireAdmin() {
  const context = await requireAuthenticatedUser();
  const { data, error } = await context.supabase.rpc("is_admin");

  if (error || data !== true) {
    throw new AuthorizationError("Administrador obrigatório.");
  }

  return context;
}

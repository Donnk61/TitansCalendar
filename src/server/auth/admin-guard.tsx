import "server-only";

import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { signOutAdmin } from "@/server/actions/admin-auth";
import {
  getAdminSessionState,
  type EditorAccess,
} from "@/server/auth/admin-session";

export type AuthorizedAdminState = {
  access: EditorAccess;
};

export async function requireAdminPageAccess(
  nextPath: string,
): Promise<AuthorizedAdminState> {
  const state = await getAdminSessionState();

  if (state.status === "unauthenticated") {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (state.status === "authorized") {
    return { access: state.access };
  }

  throw state;
}

export async function requireAdminOnlyPageAccess(
  nextPath: string,
): Promise<AuthorizedAdminState> {
  const state = await getAdminSessionState();

  if (state.status === "unauthenticated") {
    redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  }

  if (state.status === "authorized" && state.access.role === "admin") {
    return { access: state.access };
  }

  throw state;
}

export function AdminAccessProblem({
  nextPath = "/admin",
  reason,
}: {
  nextPath?: string;
  reason: "unconfigured" | "unauthorized" | "admin-only";
}) {
  if (reason === "unconfigured") {
    return (
      <InlineAlert title="Supabase nao configurado" tone="warning">
        Configure as variaveis do Supabase, incluindo
        `SUPABASE_SERVICE_ROLE_KEY`, para ativar o painel administrativo.
      </InlineAlert>
    );
  }

  if (reason === "admin-only") {
    return (
      <InlineAlert title="Acesso restrito a administradores" tone="danger">
        Esta area gerencia quem pode editar o cronograma. Entre com a credencial
        administrativa para continuar.
      </InlineAlert>
    );
  }

  return (
    <section className="grid gap-4">
      <InlineAlert title="Acesso nao autorizado" tone="danger">
        Sua sessao esta ativa, mas nao tem permissao administrativa.
      </InlineAlert>
      <form action={signOutAdmin}>
        <input name="next" type="hidden" value={nextPath} />
        <Button type="submit" variant="secondary">
          Sair
        </Button>
      </form>
    </section>
  );
}

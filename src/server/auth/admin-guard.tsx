import "server-only";

import { redirect } from "next/navigation";
import { InlineAlert } from "@/components/ui/inline-alert";
import { Button } from "@/components/ui/button";
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
      <InlineAlert title="Supabase não configurado" tone="warning">
        Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
        para ativar login, sessão e consultas do painel administrativo.
      </InlineAlert>
    );
  }

  if (reason === "admin-only") {
    return (
      <InlineAlert title="Acesso restrito a administradores" tone="danger">
        Esta área gerencia quem pode editar o cronograma. Entre com uma conta
        administradora para continuar.
      </InlineAlert>
    );
  }

  return (
    <section className="grid gap-4">
      <InlineAlert title="Acesso não autorizado" tone="danger">
        Sua sessão está ativa, mas o e-mail não está habilitado na allowlist
        administrativa.
      </InlineAlert>
      <form action={signOutAdmin}>
        <input name="next" type="hidden" value={nextPath} />
        <Button type="submit" variant="secondary">
          Sair e trocar e-mail
        </Button>
      </form>
    </section>
  );
}

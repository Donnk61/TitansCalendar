import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { signOutAdmin } from "@/server/actions/admin-auth";
import {
  getAdminSessionState,
  getSafeAdminNextPath,
} from "@/server/auth/admin-session";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};
  const rawNext = typeof params.next === "string" ? params.next : null;
  const next = getSafeAdminNextPath(rawNext);
  const error = typeof params.error === "string" ? params.error : null;
  const state = await getAdminSessionState();

  if (state.status === "authorized") {
    redirect(next);
  }

  return (
    <main className="min-h-svh bg-background px-[var(--space-shell-x)] py-10 text-text-primary">
      <section className="mx-auto grid max-w-md gap-6">
        <div className="grid gap-3">
          <span className="grid size-11 place-items-center rounded-sm border border-brand-orange/45 bg-surface text-brand-orange">
            <ShieldCheck aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
              Area administrativa
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-normal">
              Login restrito
            </h1>
          </div>
          <p className="text-sm leading-6 text-text-secondary">
            Entre com o usuario e a senha administrativos para acessar o painel
            do cronograma.
          </p>
        </div>

        {state.status === "unconfigured" ? (
          <InlineAlert title="Supabase nao configurado" tone="warning">
            Configure as variaveis do Supabase, incluindo a service role, para
            ativar o painel administrativo.
          </InlineAlert>
        ) : null}

        {state.status === "unauthorized" ? (
          <section className="grid gap-4">
            <InlineAlert title="Sessao sem permissao" tone="danger">
              A sessao atual nao tem permissao para acessar o painel.
            </InlineAlert>
            <form action={signOutAdmin}>
              <Button type="submit" variant="secondary">
                Sair
              </Button>
            </form>
          </section>
        ) : (
          <div className="rounded-sm border border-border bg-surface p-5">
            <LoginForm next={next} />
          </div>
        )}

        {error === "expired" ? (
          <InlineAlert title="Sessao expirada" tone="warning">
            Entre novamente para continuar.
          </InlineAlert>
        ) : null}
        {error === "config" ? (
          <InlineAlert title="Configuracao incompleta" tone="danger">
            Nao foi possivel concluir o login porque o Supabase nao esta
            configurado corretamente.
          </InlineAlert>
        ) : null}
      </section>
    </main>
  );
}

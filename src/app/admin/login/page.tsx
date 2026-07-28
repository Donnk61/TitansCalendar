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
              Área administrativa
            </p>
            <h1 className="mt-2 font-display text-3xl font-black tracking-normal">
              Login restrito
            </h1>
          </div>
          <p className="text-sm leading-6 text-text-secondary">
            Receba um Magic Link no e-mail autorizado para acessar o painel do
            cronograma.
          </p>
        </div>

        {state.status === "unconfigured" ? (
          <InlineAlert title="Supabase não configurado" tone="warning">
            Configure as variáveis públicas do Supabase para ativar o envio de
            Magic Link.
          </InlineAlert>
        ) : null}

        {state.status === "unauthorized" ? (
          <section className="grid gap-4">
            <InlineAlert title="E-mail sem permissão" tone="danger">
              A sessão atual existe, mas o e-mail não está ativo na allowlist
              administrativa.
            </InlineAlert>
            <form action={signOutAdmin}>
              <Button type="submit" variant="secondary">
                Sair e usar outro e-mail
              </Button>
            </form>
          </section>
        ) : (
          <div className="rounded-sm border border-border bg-surface p-5">
            <LoginForm next={next} />
          </div>
        )}

        {error === "expired" ? (
          <InlineAlert title="Link expirado" tone="warning">
            Solicite um novo Magic Link para continuar. Links antigos podem
            expirar ou ser usados apenas uma vez.
          </InlineAlert>
        ) : null}
        {error === "config" ? (
          <InlineAlert title="Configuração incompleta" tone="danger">
            Não foi possível concluir o login porque o Supabase não está
            configurado corretamente.
          </InlineAlert>
        ) : null}
      </section>
    </main>
  );
}

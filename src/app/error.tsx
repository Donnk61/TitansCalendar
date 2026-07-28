"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/ui/inline-alert";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-[var(--space-shell-x)] py-10 text-text-primary">
      <section className="grid max-w-lg gap-5">
        <span className="grid size-11 place-items-center rounded-sm border border-danger/45 bg-danger/10 text-danger">
          <AlertTriangle aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-black tracking-normal">
            Não foi possível carregar esta tela
          </h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Tente novamente. Se o problema continuar, verifique os logs do
            deployment e as variáveis do Supabase.
          </p>
        </div>
        <InlineAlert title="Erro tratado" tone="warning">
          Nenhum segredo é exibido na interface. Os detalhes técnicos ficam nos
          logs do servidor.
        </InlineAlert>
        <div>
          <Button onClick={reset} type="button">
            Tentar novamente
          </Button>
        </div>
      </section>
    </main>
  );
}

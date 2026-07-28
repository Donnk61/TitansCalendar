import type { ReactNode } from "react";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-svh bg-background text-text-primary">
      <a
        className="sr-only z-50 rounded-sm bg-brand-orange px-3 py-2 font-semibold text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#conteudo"
      >
        Pular para o conteúdo
      </a>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,var(--brand-red),var(--brand-orange),var(--brand-amber))]"
      />
      <header className="border-b border-border bg-background/95 px-[var(--space-shell-x)] pt-1">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center justify-between gap-4 sm:min-h-16">
          <BrandMark />
          <div className="hidden items-center gap-3 text-sm text-text-secondary sm:flex">
            <span className="rounded-xs border border-border bg-surface px-3 py-1.5">
              Semestre ativo: 2026.2
            </span>
          </div>
        </div>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="border-t border-border px-[var(--space-shell-x)] py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>TITANS Cronograma</p>
          <Link
            className="inline-flex w-fit items-center gap-2 rounded-xs px-2 py-1 font-semibold text-text-muted transition duration-normal hover:bg-surface hover:text-text-primary"
            href="/admin"
          >
            <LockKeyhole aria-hidden="true" className="size-4" />
            Acesso administrativo
          </Link>
        </div>
      </footer>
    </div>
  );
}

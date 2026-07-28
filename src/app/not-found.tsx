import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export default function NotFoundPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-[var(--space-shell-x)] py-10 text-text-primary">
      <EmptyState
        action={
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-sm border border-brand-orange bg-brand-orange px-4 text-sm font-semibold text-background transition duration-normal hover:bg-brand-amber focus-visible:outline-focus"
            href="/"
          >
            Voltar ao cronograma
          </Link>
        }
        description="A página solicitada não existe ou foi movida."
        icon={<CalendarDays aria-hidden="true" className="size-5" />}
        title="Página não encontrada"
      />
    </main>
  );
}

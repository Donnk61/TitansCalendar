import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { signOutAdmin } from "@/server/actions/admin-auth";
import type { EditorAccess } from "@/server/auth/admin-session";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";

const adminNavigation = [
  { href: "/admin", label: "Calendário", icon: CalendarDays },
  { href: "/admin/events", label: "Eventos", icon: ClipboardList },
  { href: "/admin/announcements", label: "Avisos", icon: Megaphone },
  { href: "/admin/semester", label: "Semestre", icon: Settings2 },
];

export function AdminShell({
  access,
  children,
}: {
  access?: EditorAccess | null;
  children: ReactNode;
}) {
  const navigation =
    access?.role === "admin"
      ? [
          ...adminNavigation,
          { href: "/admin/access", label: "Acessos", icon: ShieldCheck },
        ]
      : adminNavigation;

  return (
    <div className="min-h-svh overflow-x-hidden bg-background text-text-primary">
      <a
        className="sr-only z-50 rounded-sm bg-brand-orange px-3 py-2 font-semibold text-background focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        href="#conteudo-admin"
      >
        Pular para o conteúdo
      </a>
      <header className="border-b border-border bg-surface px-[var(--space-shell-x)]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <BrandMark />
            <span className="hidden h-6 w-px bg-border sm:block" />
            <p className="hidden text-sm font-semibold text-text-secondary sm:block">
              Administração
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              aria-label="Avisos administrativos"
              className="grid size-10 place-items-center rounded-sm border border-border bg-surface-muted text-text-secondary transition duration-normal hover:text-text-primary focus-visible:outline-focus"
              type="button"
            >
              <Bell aria-hidden="true" className="size-4" />
            </button>
            {access ? (
              <>
                <div className="hidden border-l border-border pl-3 text-right sm:block">
                  <p className="text-sm font-semibold text-text-primary">
                    {access.display_name ?? access.email}
                  </p>
                  <p className="text-xs capitalize text-text-muted">
                    {access.role}
                  </p>
                </div>
                <form action={signOutAdmin}>
                  <Button size="sm" type="submit" variant="ghost">
                    Sair
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-4 px-[var(--space-shell-x)] py-4 sm:gap-6 sm:py-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <nav
            aria-label="Navegação administrativa"
            className="flex gap-2 overflow-x-auto lg:grid"
          >
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-sm border border-border bg-surface px-3 text-sm font-semibold text-text-secondary transition duration-normal hover:border-brand-orange hover:text-text-primary focus-visible:outline-focus"
                  href={item.href}
                  key={item.href}
                >
                  <Icon aria-hidden="true" className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 overflow-x-hidden" id="conteudo-admin">
          {children}
        </main>
      </div>
    </div>
  );
}

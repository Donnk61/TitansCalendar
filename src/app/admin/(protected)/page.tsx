import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarPlus,
  Clock3,
  Megaphone,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/features/events/event-status";
import { formatInAppLocale } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import { getAdminDashboardData } from "@/server/queries/admin-dashboard";
import { eventStatusSchema, type EventStatus } from "@/types/domain";

export default async function AdminDashboardPage() {
  const state = await getAdminSessionState();

  if (state.status === "unconfigured") {
    return <AdminAccessProblem reason="unconfigured" />;
  }

  if (state.status === "unauthorized") {
    return <AdminAccessProblem reason="unauthorized" />;
  }

  if (state.status !== "authorized") {
    return null;
  }

  let data: Awaited<ReturnType<typeof getAdminDashboardData>>;

  try {
    data = await getAdminDashboardData();
  } catch {
    return (
      <InlineAlert title="Painel indisponível" tone="danger">
        Não foi possível carregar os dados administrativos agora. Verifique a
        conexão com o Supabase e as políticas de acesso.
      </InlineAlert>
    );
  }

  return (
    <section className="grid min-w-0 gap-6 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Área administrativa
          </p>
          <h1 className="mt-3 break-words font-display text-3xl font-black tracking-normal text-text-primary">
            Painel do cronograma
          </h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-text-secondary">
            Acompanhe o semestre ativo, pendências editoriais e avisos vigentes
            antes de publicar novas alterações.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-2 sm:flex sm:flex-row">
          <AdminActionLink
            href="/admin/events/new"
            icon={<CalendarPlus aria-hidden="true" className="size-4" />}
            variant="secondary"
          >
            Novo evento
          </AdminActionLink>
          <AdminActionLink
            href="/admin/announcements"
            icon={<Megaphone aria-hidden="true" className="size-4" />}
          >
            Novo aviso
          </AdminActionLink>
        </div>
      </div>

      <div className="grid min-w-0 gap-4 md:grid-cols-3">
        <MetricCard
          label="Semestre ativo"
          value={data.activeSemester?.name ?? "Sem semestre"}
        />
        <MetricCard
          label="Próximos eventos"
          value={data.upcomingEvents.length}
        />
        <MetricCard
          badge={<StatusBadge status="pending" />}
          label="Eventos pendentes"
          value={data.pendingEvents.length}
        />
      </div>

      {!data.activeSemester ? (
        <EmptyState
          description="Ative um semestre para começar a listar eventos, avisos e alterações no painel."
          icon={<Clock3 aria-hidden="true" className="size-5" />}
          title="Nenhum semestre ativo"
        />
      ) : (
        <div className="grid min-w-0 gap-4 xl:grid-cols-2">
          <AdminList
            empty="Nenhum evento futuro encontrado."
            icon={<CalendarPlus aria-hidden="true" className="size-4" />}
            items={data.upcomingEvents.map((event) => ({
              href: `/admin/events/${event.id}`,
              meta: formatInAppLocale(new Date(event.starts_at)),
              status: parseEventStatus(event.status),
              title: event.title,
            }))}
            title="Próximos eventos"
          />
          <AdminList
            empty="Nenhuma pendência editorial."
            icon={<AlertTriangle aria-hidden="true" className="size-4" />}
            items={data.pendingEvents.map((event) => ({
              href: `/admin/events/${event.id}`,
              meta: formatInAppLocale(new Date(event.starts_at)),
              status: parseEventStatus(event.status),
              title: event.title,
            }))}
            title="Eventos pendentes"
          />
          <AdminList
            empty="Nenhuma alteração recente."
            icon={<RefreshCw aria-hidden="true" className="size-4" />}
            items={data.recentChanges.map((event) => ({
              href: `/admin/events/${event.id}`,
              meta: formatInAppLocale(new Date(event.updated_at)),
              status: parseEventStatus(event.status),
              title: event.title,
            }))}
            title="Alterações recentes"
          />
          <AdminList
            empty="Nenhum aviso vigente."
            icon={<Megaphone aria-hidden="true" className="size-4" />}
            items={data.currentAnnouncements.map((announcement) => ({
              href: "/admin/announcements",
              meta: formatInAppLocale(new Date(announcement.starts_at)),
              tone: announcement.severity === "critical" ? "danger" : "neutral",
              title: announcement.title,
            }))}
            title="Avisos vigentes"
          />
        </div>
      )}
    </section>
  );
}

function AdminActionLink({
  children,
  href,
  icon,
  variant = "primary",
}: {
  children: ReactNode;
  href: string;
  icon: ReactNode;
  variant?: "primary" | "secondary";
}) {
  return (
    <Link
      className={cn(
        "inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-sm border px-4 text-sm font-semibold transition duration-normal focus-visible:outline-focus",
        variant === "primary"
          ? "border-brand-orange bg-brand-orange text-background hover:bg-brand-amber"
          : "border-border-strong bg-surface-elevated text-text-primary hover:border-brand-orange",
      )}
      href={href}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}

function MetricCard({
  badge,
  label,
  value,
}: {
  badge?: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-sm border border-border bg-surface p-3 sm:p-5">
      <p className="break-words text-sm text-text-muted">{label}</p>
      <div className="mt-3 flex min-w-0 items-center justify-between gap-3">
        <p className="min-w-0 break-words font-display text-2xl font-bold text-text-primary">
          {value}
        </p>
        <span className="shrink-0">{badge}</span>
      </div>
    </div>
  );
}

function AdminList({
  empty,
  icon,
  items,
  title,
}: {
  empty: string;
  icon: ReactNode;
  items: Array<{
    href: string;
    meta: string;
    status?: EventStatus;
    title: string;
    tone?: "danger" | "neutral";
  }>;
  title: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-sm border border-border bg-surface">
      <div className="flex min-h-14 min-w-0 items-center gap-2 border-b border-border px-4">
        <span className="shrink-0 text-brand-orange">{icon}</span>
        <h2 className="min-w-0 break-words font-display text-lg font-semibold text-text-primary">
          {title}
        </h2>
      </div>
      {items.length > 0 ? (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={`${item.href}-${item.title}`}>
              <Link
                className="grid min-w-0 gap-2 px-4 py-3 transition duration-normal hover:bg-surface-muted focus-visible:outline-focus"
                href={item.href}
              >
                <span className="break-words font-semibold text-text-primary">
                  {item.title}
                </span>
                <span className="flex flex-wrap items-center gap-2 text-sm text-text-muted">
                  {item.meta}
                  {item.status ? <StatusBadge status={item.status} /> : null}
                  {item.tone === "danger" ? (
                    <Badge tone="danger">Crítico</Badge>
                  ) : null}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-4 py-5 text-sm leading-6 text-text-muted">{empty}</p>
      )}
    </section>
  );
}

function parseEventStatus(status: string): EventStatus {
  return eventStatusSchema.catch("pending").parse(status);
}

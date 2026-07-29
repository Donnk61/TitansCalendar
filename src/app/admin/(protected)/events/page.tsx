import Link from "next/link";
import { CalendarPlus, Pencil, RefreshCw, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/inline-alert";
import { StatusBadge } from "@/features/events/event-status";
import { formatInAppLocale } from "@/lib/dates";
import { cn } from "@/lib/utils/cn";
import { cancelAdminEvent } from "@/server/actions/admin-events";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import {
  getAdminEventOptions,
  listAdminEvents,
} from "@/server/queries/admin-events";
import { eventStatusSchema } from "@/types/domain";

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
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

  const params = searchParams ? await searchParams : {};
  const filters = {
    period: getParam(params.period),
    projectId: getParam(params.project),
    query: getParam(params.q),
    status: getParam(params.status),
    typeSlug: getParam(params.type),
  };
  const [options, events] = await Promise.all([
    getAdminEventOptions(),
    listAdminEvents(filters),
  ]);

  return (
    <section className="grid min-w-0 gap-6 overflow-hidden">
      <div className="flex min-w-0 flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            Eventos
          </p>
          <h1 className="mt-3 break-words font-display text-3xl font-black tracking-normal text-text-primary">
            Lista Administrativa
          </h1>
          <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-text-secondary">
            Busque, filtre, edite e cancele eventos do semestre ativo.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-2 rounded-sm border border-brand-orange bg-brand-orange px-4 text-sm font-semibold text-background transition duration-normal hover:bg-brand-amber focus-visible:outline-focus"
          href="/admin/events/new"
        >
          <CalendarPlus aria-hidden="true" className="size-4 shrink-0" />
          <span className="min-w-0 truncate">Novo Evento</span>
        </Link>
      </div>

      {!options.semester ? (
        <InlineAlert title="Nenhum semestre ativo" tone="warning">
          Ative um semestre antes de gerenciar eventos.
        </InlineAlert>
      ) : null}

      <form className="grid min-w-0 grid-cols-1 gap-4 rounded-sm border border-border bg-surface p-3 sm:p-5 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
        <Field>
          <Label htmlFor="q">Busca</Label>
          <Input
            autoComplete="off"
            defaultValue={filters.query}
            id="q"
            name="q"
            placeholder="Título do evento…"
          />
        </Field>
        <Field>
          <Label htmlFor="period">Período</Label>
          <Select defaultValue={filters.period} id="period" name="period">
            <option value="">Todos</option>
            <option value="future">Futuros</option>
            <option value="past">Passados</option>
          </Select>
        </Field>
        <Field>
          <Label htmlFor="type">Tipo</Label>
          <Select defaultValue={filters.typeSlug} id="type" name="type">
            <option value="">Todos</option>
            {options.eventTypes.map((type) => (
              <option key={type.slug} value={type.slug}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="project">Projeto</Label>
          <Select defaultValue={filters.projectId} id="project" name="project">
            <option value="">Todos</option>
            {options.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field>
          <Label htmlFor="status">Status</Label>
          <Select defaultValue={filters.status} id="status" name="status">
            <option value="">Todos</option>
            <option value="confirmed">Confirmado</option>
            <option value="pending">Pendente</option>
            <option value="changed">Alterado</option>
            <option value="cancelled">Cancelado</option>
            <option value="completed">Concluído</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button className="w-full" type="submit" variant="secondary">
            Filtrar
          </Button>
        </div>
      </form>

      <div className="max-w-full min-w-0 overflow-x-auto rounded-sm border border-border bg-surface">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead className="bg-surface-muted text-left text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold">Data</th>
              <th className="px-4 py-3 font-semibold">Evento</th>
              <th className="px-4 py-3 font-semibold">Projetos</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {events.map((event) => (
              <tr key={event.id}>
                <td className="px-4 py-3 text-text-secondary">
                  {formatInAppLocale(new Date(event.starts_at))}
                </td>
                <td className="px-4 py-3">
                  <div className="grid gap-1">
                    <span className="font-semibold text-text-primary">
                      {event.title}
                    </span>
                    <span className="flex flex-wrap gap-2">
                      {event.series_id ? (
                        <Badge
                          icon={<RefreshCw className="size-3" />}
                          tone="info"
                        >
                          Série Recorrente
                        </Badge>
                      ) : null}
                      {event.is_important ? (
                        <Badge tone="orange">Importante</Badge>
                      ) : null}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {event.event_projects
                    ?.flatMap((item) =>
                      item.projects ? [item.projects.name] : [],
                    )
                    .join(", ") || "Todos"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge
                    status={eventStatusSchema
                      .catch("pending")
                      .parse(event.status)}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link
                      className={cn(
                        "inline-flex min-h-9 items-center justify-center gap-2 rounded-sm border border-border-strong bg-surface-elevated px-3 text-sm font-semibold text-text-primary transition duration-normal hover:border-brand-orange focus-visible:outline-focus",
                      )}
                      href={`/admin/events/${event.id}`}
                    >
                      <Pencil aria-hidden="true" className="size-4" />
                      Editar
                    </Link>
                    <form action={cancelAdminEvent}>
                      <input name="eventId" type="hidden" value={event.id} />
                      <input
                        name="changeNote"
                        type="hidden"
                        value="Evento cancelado."
                      />
                      <Button
                        disabled={event.status === "cancelled"}
                        leadingIcon={
                          <XCircle aria-hidden="true" className="size-4" />
                        }
                        size="sm"
                        type="submit"
                        variant="danger"
                      >
                        Cancelar
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-text-muted"
                  colSpan={5}
                >
                  Nenhum evento encontrado com os filtros atuais.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

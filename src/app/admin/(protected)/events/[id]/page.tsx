import { notFound } from "next/navigation";
import { EventForm, type EventFormValues } from "@/components/admin/event-form";
import {
  deleteAdminEventPermanently,
  updateAdminEvent,
} from "@/server/actions/admin-events";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import {
  getAdminEventById,
  getAdminEventOptions,
} from "@/server/queries/admin-events";
import { Button } from "@/components/ui/button";
import { Field, Input, Label } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/inline-alert";

export default async function EditAdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;
  const [options, event] = await Promise.all([
    getAdminEventOptions(),
    getAdminEventById(id),
  ]);

  if (!event || !options.semester) {
    notFound();
  }

  const updateAction = updateAdminEvent.bind(null, event.id);
  const initialValues = toFormValues(event);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Eventos
        </p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-normal text-text-primary">
          Editar Evento
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Alterações usam controle de concorrência pelo horário original de
          atualização.
        </p>
      </div>

      {event.series_id ? (
        <InlineAlert title="Ocorrência de série" tone="info">
          Esta ocorrência está ligada a uma série recorrente. Nesta etapa, a
          edição salva apenas este evento físico; os escopos “próximos” e “toda
          a série” ficam modelados para a evolução da spec.
        </InlineAlert>
      ) : null}

      <EventForm
        action={updateAction}
        eventTypes={options.eventTypes.map((type) => ({
          label: type.label,
          value: type.slug,
        }))}
        initialValues={initialValues}
        mode="edit"
        projects={options.projects.map((project) => ({
          label: project.name,
          value: project.id,
        }))}
        semester={options.semester}
      />

      {state.access.role === "admin" ? (
        <form
          action={deleteAdminEventPermanently}
          className="grid gap-4 rounded-sm border border-danger/45 bg-danger/10 p-5"
        >
          <input name="eventId" type="hidden" value={event.id} />
          <div>
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Exclusão Definitiva
            </h2>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Use apenas quando cancelar não for suficiente. Digite EXCLUIR para
              confirmar.
            </p>
          </div>
          <Field>
            <Label htmlFor="confirmation">Confirmação</Label>
            <Input
              autoComplete="off"
              id="confirmation"
              name="confirmation"
              placeholder="EXCLUIR…"
            />
          </Field>
          <div>
            <Button type="submit" variant="danger">
              Excluir Definitivamente
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function toFormValues(
  event: Awaited<ReturnType<typeof getAdminEventById>>,
): EventFormValues {
  if (!event) {
    throw new Error("Evento ausente.");
  }

  const start = new Date(event.starts_at);
  const end = event.ends_at ? new Date(event.ends_at) : null;

  return {
    allDay: event.all_day,
    changeNote: event.change_note ?? "",
    changeVisibleUntilDate: event.change_visible_until?.slice(0, 10) ?? "",
    description: event.description ?? "",
    endsOn: end ? end.toISOString().slice(0, 10) : "",
    endTime: end ? end.toISOString().slice(11, 16) : "",
    id: event.id,
    isImportant: event.is_important,
    links:
      event.event_links
        ?.toSorted((a, b) => a.sort_order - b.sort_order)
        .map((link) => ({ label: link.label, url: link.url })) ?? [],
    locationName: event.location_name ?? "",
    meetingUrl: event.meeting_url ?? "",
    originalUpdatedAt: event.updated_at,
    projectIds:
      event.event_projects?.map((project) => project.project_id) ?? [],
    responsible: event.responsible ?? "",
    startsOn: start.toISOString().slice(0, 10),
    startTime: start.toISOString().slice(11, 16),
    status: event.status,
    title: event.title,
    typeSlug: event.type_slug,
  };
}

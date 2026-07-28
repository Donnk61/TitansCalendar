import { EventForm } from "@/components/admin/event-form";
import { createAdminEvent } from "@/server/actions/admin-events";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import { getAdminEventOptions } from "@/server/queries/admin-events";

export default async function NewAdminEventPage() {
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

  const options = await getAdminEventOptions();

  if (!options.semester) {
    return <AdminAccessProblem reason="unconfigured" />;
  }

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Eventos
        </p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-normal text-text-primary">
          Novo Evento
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Crie evento simples ou recorrente dentro do semestre ativo.
        </p>
      </div>
      <EventForm
        action={createAdminEvent}
        eventTypes={options.eventTypes.map((type) => ({
          label: type.label,
          value: type.slug,
        }))}
        mode="create"
        projects={options.projects.map((project) => ({
          label: project.name,
          value: project.id,
        }))}
        semester={options.semester}
      />
    </section>
  );
}

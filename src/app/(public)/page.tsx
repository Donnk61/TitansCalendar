import { CalendarDays, DatabaseZap } from "lucide-react";
import { PublicCalendarExperience } from "@/components/calendar/public-calendar-experience";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicCalendarHomeData } from "@/server/queries/public-home";

export default async function PublicHomePage() {
  const data = await getPublicCalendarHomeData();

  if (!data.semester) {
    return (
      <section className="px-[var(--space-shell-x)] py-10">
        <div className="mx-auto max-w-6xl">
          <EmptyState
            description={
              data.status === "connection-error"
                ? "Não foi possível carregar o cronograma agora. Tente novamente em alguns instantes."
                : "O cronograma do próximo semestre será publicado em breve."
            }
            icon={<CalendarDays aria-hidden="true" className="size-5" />}
            title={
              data.status === "connection-error"
                ? "Falha ao carregar o calendário"
                : "Semestre em preparação"
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-[var(--space-shell-x)] py-8 sm:py-10">
      <div className="mx-auto grid max-w-7xl gap-8">
        <div className="min-w-0">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Badge tone="orange">Semestre ativo: {data.semester.name}</Badge>
            <Badge>{data.events.length} eventos publicados</Badge>
            {data.source === "demo" ? (
              <Badge icon={<DatabaseZap className="size-3.5" />} tone="info">
                Dados de demonstração
              </Badge>
            ) : null}
          </div>
          <h1 className="font-display text-4xl font-black leading-tight tracking-normal text-text-primary sm:text-6xl">
            Calendário do semestre
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-text-secondary">
            Veja o mês, a semana e os marcos do semestre ativo da equipe TITANS.
          </p>
          <div className="mt-8">
            {data.status === "empty-semester" ? (
              <EmptyState
                description="Os eventos aparecerão aqui assim que forem publicados por um editor autorizado."
                icon={<CalendarDays aria-hidden="true" className="size-5" />}
                title="Sem eventos publicados"
              />
            ) : (
              <PublicCalendarExperience
                announcements={data.announcements}
                events={data.events}
                eventTypes={data.eventTypes}
                projects={data.projects}
                semester={data.semester}
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

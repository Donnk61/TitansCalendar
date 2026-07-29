import { CalendarDays, DatabaseZap } from "lucide-react";
import { PublicCalendarExperience } from "@/components/calendar/public-calendar-experience";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getPublicCalendarHomeData } from "@/server/queries/public-home";

export const dynamic = "force-dynamic";

export default async function PublicHomePage() {
  const data = await getPublicCalendarHomeData();

  if (!data.semester) {
    return (
      <section className="px-[var(--space-shell-x)] py-10">
        <div className="mx-auto max-w-6xl">
          <EmptyState
            description={
              data.status === "connection-error"
                ? "Nao foi possivel carregar o cronograma agora. Tente novamente em alguns instantes."
                : "O cronograma do proximo semestre sera publicado em breve."
            }
            icon={<CalendarDays aria-hidden="true" className="size-5" />}
            title={
              data.status === "connection-error"
                ? "Falha ao carregar o calendario"
                : "Semestre em preparacao"
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="px-[var(--space-shell-x)] py-4 sm:py-5">
      <div className="mx-auto grid max-w-7xl gap-4">
        <div className="min-w-0">
          {data.source === "demo" ? (
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <Badge icon={<DatabaseZap className="size-3.5" />} tone="info">
                Dados de demonstracao
              </Badge>
            </div>
          ) : null}

          <h1 className="font-display text-2xl font-black leading-tight tracking-normal text-text-primary sm:text-3xl">
            Calendario do semestre
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
            Reunioes, prazos e eventos da equipe TITANS.
          </p>

          <div className="mt-4">
            {data.status === "empty-semester" ? (
              <EmptyState
                description="Os eventos aparecerao aqui assim que forem publicados por um editor autorizado."
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

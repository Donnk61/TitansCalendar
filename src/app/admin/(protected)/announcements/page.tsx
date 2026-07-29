import { upsertAnnouncement } from "@/server/actions/admin-maintenance";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import {
  listActiveSemesterEventChoices,
  listAdminAnnouncements,
} from "@/server/queries/admin-maintenance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Label, Select, Textarea } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";

export default async function AdminAnnouncementsPage() {
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

  const [announcements, eventChoices] = await Promise.all([
    listAdminAnnouncements(),
    listActiveSemesterEventChoices(),
  ]);

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Avisos
        </p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-normal text-text-primary">
          Avisos do Calendário
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Publique avisos com vigência automática e relacionamento opcional com
          eventos.
        </p>
      </div>

      <AnnouncementForm events={eventChoices} />

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <section
            className="grid gap-4 rounded-sm border border-border bg-surface p-5"
            key={announcement.id}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold text-text-primary">
                  {announcement.title}
                </h2>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {announcement.body}
                </p>
              </div>
              <div className="flex gap-2">
                <Badge>{announcement.severity}</Badge>
                <Badge tone={announcement.is_published ? "success" : "neutral"}>
                  {announcement.is_published ? "Publicado" : "Rascunho"}
                </Badge>
              </div>
            </div>
            <AnnouncementForm
              announcement={{
                body: announcement.body,
                endsAt: announcement.ends_at?.slice(0, 16) ?? "",
                id: announcement.id,
                isPublished: announcement.is_published,
                relatedEventId: announcement.related_event_id ?? "",
                severity: announcement.severity,
                startsAt: announcement.starts_at.slice(0, 16),
                title: announcement.title,
              }}
              events={eventChoices}
            />
          </section>
        ))}
        {announcements.length === 0 ? (
          <p className="rounded-sm border border-border bg-surface p-5 text-sm text-text-muted">
            Nenhum aviso cadastrado.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function AnnouncementForm({
  announcement,
  events,
}: {
  announcement?: {
    body: string;
    endsAt: string;
    id: string;
    isPublished: boolean;
    relatedEventId: string;
    severity: "info" | "warning" | "critical";
    startsAt: string;
    title: string;
  };
  events: Array<{ id: string; title: string }>;
}) {
  return (
    <form
      action={upsertAnnouncement}
      className="grid gap-4 rounded-sm border border-border bg-surface p-5"
    >
      {announcement ? (
        <input name="id" type="hidden" value={announcement.id} />
      ) : null}
      <div className="grid gap-4 md:grid-cols-[2fr_180px_160px]">
        <Field>
          <Label htmlFor={`title-${announcement?.id ?? "new"}`}>Título</Label>
          <Input
            defaultValue={announcement?.title}
            id={`title-${announcement?.id ?? "new"}`}
            maxLength={120}
            name="title"
            required
            placeholder="Aviso importante…"
          />
        </Field>
        <Field>
          <Label htmlFor={`severity-${announcement?.id ?? "new"}`}>
            Severidade
          </Label>
          <Select
            defaultValue={announcement?.severity ?? "info"}
            id={`severity-${announcement?.id ?? "new"}`}
            name="severity"
          >
            <option value="info">Info</option>
            <option value="warning">Atenção</option>
            <option value="critical">Crítico</option>
          </Select>
        </Field>
        <Checkbox
          defaultChecked={announcement?.isPublished}
          label="Publicado"
          name="isPublished"
        />
      </div>
      <Field>
        <Label htmlFor={`body-${announcement?.id ?? "new"}`}>Texto</Label>
        <Textarea
          defaultValue={announcement?.body}
          id={`body-${announcement?.id ?? "new"}`}
          maxLength={1000}
          name="body"
          required
          placeholder="Mensagem exibida no calendário público…"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field>
          <Label htmlFor={`starts-${announcement?.id ?? "new"}`}>Início</Label>
          <Input
            defaultValue={announcement?.startsAt}
            id={`starts-${announcement?.id ?? "new"}`}
            name="startsAt"
            required
            type="datetime-local"
          />
        </Field>
        <Field>
          <Label htmlFor={`ends-${announcement?.id ?? "new"}`}>Fim</Label>
          <Input
            defaultValue={announcement?.endsAt}
            id={`ends-${announcement?.id ?? "new"}`}
            name="endsAt"
            type="datetime-local"
          />
        </Field>
      </div>
      <Field>
        <Label htmlFor={`related-${announcement?.id ?? "new"}`}>
          Evento Relacionado
        </Label>
        <Select
          defaultValue={announcement?.relatedEventId}
          id={`related-${announcement?.id ?? "new"}`}
          name="relatedEventId"
        >
          <option value="">Nenhum</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.title}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button type="submit" variant={announcement ? "secondary" : "primary"}>
          {announcement ? "Salvar Aviso" : "Criar Aviso"}
        </Button>
      </div>
    </form>
  );
}

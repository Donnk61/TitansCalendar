"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarCheck, Save } from "lucide-react";
import { generateOccurrences } from "@/features/events/recurrence";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MultiSelect } from "@/components/ui/multi-select";
import type { EventActionState } from "@/server/actions/admin-events";
import type { Database } from "@/types/supabase";
import { cn } from "@/lib/utils/cn";

type EventFormOption = {
  label: string;
  value: string;
};

export type EventFormValues = {
  allDay: boolean;
  changeNote: string;
  changeVisibleUntilDate: string;
  description: string;
  endsOn: string;
  endTime: string;
  id?: string;
  isImportant: boolean;
  links: Array<{ label: string; url: string }>;
  locationName: string;
  meetingUrl: string;
  originalUpdatedAt?: string;
  projectIds: string[];
  responsible: string;
  startsOn: string;
  startTime: string;
  status: string;
  title: string;
  typeSlug: string;
};

const initialState: EventActionState = {
  status: "idle",
  message: "",
};

export function EventForm({
  action,
  eventTypes,
  initialValues,
  mode,
  projects,
  semester,
}: {
  action: (
    previousState: EventActionState,
    formData: FormData,
  ) => Promise<EventActionState>;
  eventTypes: EventFormOption[];
  initialValues?: EventFormValues;
  mode: "create" | "edit";
  projects: EventFormOption[];
  semester: Pick<
    Database["public"]["Tables"]["semesters"]["Row"],
    "ends_on" | "starts_on"
  >;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [allDay, setAllDay] = useState(initialValues?.allDay ?? false);
  const [recurrence, setRecurrence] = useState("none");
  const [startsOn, setStartsOn] = useState(initialValues?.startsOn ?? "");
  const [endsOn, setEndsOn] = useState(initialValues?.endsOn ?? "");
  const [startTime, setStartTime] = useState(
    initialValues?.startTime ?? "19:00",
  );
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? "20:00");
  const [repeatUntil, setRepeatUntil] = useState(semester.ends_on);
  const recurrencePreview = useMemo(() => {
    if (!startsOn || recurrence === "none") {
      return [];
    }

    const start = new Date(
      allDay
        ? `${startsOn}T00:00:00-03:00`
        : `${startsOn}T${startTime}:00-03:00`,
    );
    const endDate = endsOn || startsOn;
    const end = allDay
      ? new Date(`${endDate}T00:00:00-03:00`)
      : new Date(`${endDate}T${endTime || startTime}:00-03:00`);

    return generateOccurrences({
      allDay,
      endsAt: end,
      frequency: recurrence as "weekly" | "biweekly",
      repeatUntil,
      semesterEndsOn: semester.ends_on,
      startsAt: start,
    }).slice(0, 16);
  }, [
    allDay,
    endsOn,
    endTime,
    recurrence,
    repeatUntil,
    semester.ends_on,
    startsOn,
    startTime,
  ]);

  return (
    <form action={formAction} className="grid gap-6">
      {initialValues?.originalUpdatedAt ? (
        <input
          name="originalUpdatedAt"
          type="hidden"
          value={initialValues.originalUpdatedAt}
        />
      ) : null}

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <Field>
            <Label htmlFor="title">Título</Label>
            <Input
              autoComplete="off"
              defaultValue={initialValues?.title}
              id="title"
              maxLength={120}
              name="title"
              placeholder="Reunião geral…"
            />
          </Field>
          <Field>
            <Label htmlFor="typeSlug">Tipo</Label>
            <Select
              defaultValue={initialValues?.typeSlug ?? eventTypes[0]?.value}
              id="typeSlug"
              name="typeSlug"
            >
              {eventTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field>
            <Label htmlFor="status">Status</Label>
            <Select
              defaultValue={initialValues?.status ?? "confirmed"}
              id="status"
              name="status"
            >
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="changed">Alterado</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Concluído</option>
            </Select>
          </Field>
        </div>

        <Checkbox
          defaultChecked={allDay}
          description="Use para prazos e eventos que ocupam o dia todo."
          label="Evento de dia inteiro"
          name="allDay"
          onChange={(event) => setAllDay(event.currentTarget.checked)}
        />

        <div className="grid gap-4 md:grid-cols-4">
          <Field>
            <Label htmlFor="startsOn">Data Inicial</Label>
            <Input
              defaultValue={initialValues?.startsOn}
              id="startsOn"
              max={semester.ends_on}
              min={semester.starts_on}
              name="startsOn"
              onChange={(event) => setStartsOn(event.currentTarget.value)}
              type="date"
            />
          </Field>
          <Field>
            <Label htmlFor="startTime">Horário Inicial</Label>
            <Input
              defaultValue={initialValues?.startTime ?? "19:00"}
              disabled={allDay}
              id="startTime"
              name="startTime"
              onChange={(event) => setStartTime(event.currentTarget.value)}
              type="time"
            />
          </Field>
          <Field>
            <Label htmlFor="endsOn">Data Final</Label>
            <Input
              defaultValue={initialValues?.endsOn}
              id="endsOn"
              max={semester.ends_on}
              min={semester.starts_on}
              name="endsOn"
              onChange={(event) => setEndsOn(event.currentTarget.value)}
              type="date"
            />
          </Field>
          <Field>
            <Label htmlFor="endTime">Horário Final</Label>
            <Input
              defaultValue={initialValues?.endTime ?? "20:00"}
              disabled={allDay}
              id="endTime"
              name="endTime"
              onChange={(event) => setEndTime(event.currentTarget.value)}
              type="time"
            />
          </Field>
        </div>

        {mode === "create" ? (
          <div className="grid gap-4 rounded-sm border border-border bg-surface-muted p-4">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <Field>
                <Label htmlFor="recurrence">Repetir</Label>
                <Select
                  id="recurrence"
                  name="recurrence"
                  onChange={(event) => setRecurrence(event.currentTarget.value)}
                  value={recurrence}
                >
                  <option value="none">Não Repetir</option>
                  <option value="weekly">Toda Semana</option>
                  <option value="biweekly">A Cada 2 Semanas</option>
                </Select>
              </Field>
              <Field>
                <Label htmlFor="repeatUntil">Repetir Até</Label>
                <Input
                  disabled={recurrence === "none"}
                  id="repeatUntil"
                  max={semester.ends_on}
                  min={startsOn || semester.starts_on}
                  name="repeatUntil"
                  onChange={(event) =>
                    setRepeatUntil(event.currentTarget.value)
                  }
                  type="date"
                  value={repeatUntil}
                />
              </Field>
            </div>
            {recurrencePreview.length > 0 ? (
              <div className="grid gap-2" aria-live="polite">
                <p className="text-sm font-semibold text-text-primary">
                  Datas Geradas
                </p>
                <div className="flex flex-wrap gap-2">
                  {recurrencePreview.map((occurrence) => (
                    <span
                      className="rounded-xs border border-border bg-surface px-2 py-1 text-xs text-text-secondary"
                      key={occurrence.index}
                    >
                      {format(occurrence.startsAt, "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <input name="recurrence" type="hidden" value="none" />
        )}
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <MultiSelect
          legend="Projetos"
          name="projectIds"
          options={projects}
          selectedValues={initialValues?.projectIds}
        />
        <div className="grid gap-4 md:grid-cols-3">
          <Field>
            <Label htmlFor="locationName">Local</Label>
            <Input
              autoComplete="off"
              defaultValue={initialValues?.locationName}
              id="locationName"
              maxLength={280}
              name="locationName"
              placeholder="Sala TITANS…"
            />
          </Field>
          <Field>
            <Label htmlFor="meetingUrl">Link do Meet</Label>
            <Input
              autoComplete="off"
              defaultValue={initialValues?.meetingUrl}
              id="meetingUrl"
              inputMode="url"
              name="meetingUrl"
              placeholder="https://meet.google.com/…"
              type="url"
            />
          </Field>
          <Field>
            <Label htmlFor="responsible">Responsável</Label>
            <Input
              autoComplete="off"
              defaultValue={initialValues?.responsible}
              id="responsible"
              maxLength={280}
              name="responsible"
              placeholder="Diretoria…"
            />
          </Field>
        </div>
        <Field>
          <Label htmlFor="description">Descrição Curta</Label>
          <Textarea
            defaultValue={initialValues?.description}
            id="description"
            maxLength={1000}
            name="description"
            placeholder="Contexto visível para a equipe…"
          />
        </Field>
        <Checkbox
          defaultChecked={initialValues?.isImportant}
          label="Marcar como importante"
          name="isImportant"
        />
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Links Externos
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Adicione até 3 links com rótulo e URL HTTP/HTTPS.
          </p>
        </div>
        {[0, 1, 2].map((index) => (
          <div className="grid gap-4 md:grid-cols-[1fr_2fr]" key={index}>
            <Field>
              <Label htmlFor={`linkLabel-${index}`}>Rótulo</Label>
              <Input
                autoComplete="off"
                defaultValue={initialValues?.links[index]?.label}
                id={`linkLabel-${index}`}
                maxLength={80}
                name="linkLabel"
                placeholder="Pauta…"
              />
            </Field>
            <Field>
              <Label htmlFor={`linkUrl-${index}`}>URL</Label>
              <Input
                autoComplete="off"
                defaultValue={initialValues?.links[index]?.url}
                id={`linkUrl-${index}`}
                inputMode="url"
                name="linkUrl"
                placeholder="https://…"
                type="url"
              />
            </Field>
          </div>
        ))}
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-primary">
            Mudança Recente
          </h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">
            Use quando data, horário, local ou status relevante mudar.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
          <Field>
            <Label htmlFor="changeNote">Nota Curta</Label>
            <Input
              autoComplete="off"
              defaultValue={initialValues?.changeNote}
              id="changeNote"
              maxLength={280}
              name="changeNote"
              placeholder="Novo horário: 19h…"
            />
            <FieldHint>
              Para avisar no calendário público, use status Alterado.
            </FieldHint>
          </Field>
          <Field>
            <Label htmlFor="changeVisibleUntilDate">Visível Até</Label>
            <Input
              defaultValue={initialValues?.changeVisibleUntilDate}
              id="changeVisibleUntilDate"
              name="changeVisibleUntilDate"
              type="date"
            />
          </Field>
        </div>
      </section>

      {state.status === "error" ? (
        <FieldError>{state.message}</FieldError>
      ) : null}
      {state.status === "success" ? (
        <InlineAlert title="Evento salvo" tone="success">
          <span className="grid gap-2">
            <span>{state.message}</span>
            {state.conflicts?.length ? (
              <span>
                Atenção: {state.conflicts.join(" ")} O evento foi mantido como
                solicitado.
              </span>
            ) : null}
            {state.eventId ? (
              <Link
                className="inline-flex font-semibold text-brand-orange hover:text-brand-amber focus-visible:outline-focus"
                href={`/admin/events/${state.eventId}`}
              >
                Abrir evento criado
              </Link>
            ) : null}
          </span>
        </InlineAlert>
      ) : null}

      <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-border bg-background/95 py-3 backdrop-blur-sm sm:flex-row sm:justify-end">
        <Link
          className={cn(
            "inline-flex min-h-10 items-center justify-center rounded-sm border border-transparent px-4 text-sm font-semibold text-text-secondary transition duration-normal hover:bg-surface-muted hover:text-text-primary focus-visible:outline-focus",
          )}
          href="/admin/events"
        >
          Voltar
        </Link>
        <Button
          isLoading={isPending}
          leadingIcon={
            mode === "create" ? (
              <CalendarCheck aria-hidden="true" className="size-4" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )
          }
          type="submit"
        >
          {mode === "create" ? "Criar Evento" : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}

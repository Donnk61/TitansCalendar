import { notFound } from "next/navigation";
import {
  CalendarDays,
  Filter,
  Save,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Field,
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/field";
import { IconButton } from "@/components/ui/icon-button";
import { InlineAlert } from "@/components/ui/inline-alert";
import { MultiSelect } from "@/components/ui/multi-select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip } from "@/components/ui/tooltip";
import { EventTypeIndicator } from "@/components/events/event-type-indicator";
import { ProjectTag } from "@/components/events/project-tag";
import { StatusBadge } from "@/features/events/event-status";

export default function UiPlaygroundPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <main className="min-h-svh bg-background px-[var(--space-shell-x)] py-10 text-text-primary">
      <div className="mx-auto grid max-w-6xl gap-10">
        <header className="border-b border-border pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            TITANS UI
          </p>
          <h1 className="mt-3 font-display text-4xl font-black">
            Playground interno
          </h1>
        </header>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-bold">Ações</h2>
          <div className="flex flex-wrap gap-3">
            <Button leadingIcon={<Save className="size-4" />}>Salvar</Button>
            <Button variant="secondary">Editar</Button>
            <Button variant="ghost">Cancelar</Button>
            <Button variant="danger">Excluir</Button>
            <Button isLoading>Salvando</Button>
            <IconButton icon={<Search className="size-4" />} label="Buscar" />
            <Tooltip content="Abrir filtros do calendário">
              <IconButton
                icon={<Filter className="size-4" />}
                label="Filtros"
              />
            </Tooltip>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-bold">Formulários</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="title">Título do evento</Label>
              <Input id="title" placeholder="Reunião geral..." />
              <FieldHint>
                Use nomes curtos para leitura no calendário.
              </FieldHint>
            </Field>
            <Field>
              <Label htmlFor="type">Tipo</Label>
              <Select id="type" defaultValue="deadline">
                <option value="general-meeting">Reunião geral</option>
                <option value="deadline">Prazo</option>
                <option value="competition">Competição</option>
              </Select>
              <FieldError>Escolha um tipo aprovado.</FieldError>
            </Field>
            <Field className="md:col-span-2">
              <Label htmlFor="description">Descrição curta</Label>
              <Textarea
                id="description"
                placeholder="Contexto essencial para o evento..."
              />
            </Field>
          </div>
          <Checkbox
            description="Eventos importantes recebem destaque moderado no calendário."
            label="Marcar como importante"
          />
          <MultiSelect
            legend="Projetos"
            name="projects"
            options={[
              { label: "Rover", value: "rover" },
              { label: "VSSS", value: "vsss" },
              { label: "Seguidor de Linha", value: "seguidor" },
              { label: "Sumô", value: "sumo" },
            ]}
            selectedValues={["rover", "vsss"]}
          />
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-bold">Identificação</h2>
          <div className="flex flex-wrap gap-3">
            <Badge>Neutro</Badge>
            <ProjectTag name="Rover" />
            <StatusBadge status="confirmed" />
            <StatusBadge status="pending" />
            <StatusBadge status="changed" />
            <StatusBadge status="cancelled" />
            <EventTypeIndicator type="general-meeting" />
            <EventTypeIndicator type="leaders-meeting" />
            <EventTypeIndicator type="deadline" />
            <EventTypeIndicator type="competition" />
            <EventTypeIndicator type="external-event" />
            <EventTypeIndicator type="selection-process" />
            <EventTypeIndicator type="fundraising" />
            <EventTypeIndicator type="milestone" />
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="font-display text-2xl font-bold">Calendário</h2>
          <SegmentedControl
            ariaLabel="Visualizacao"
            items={[
              {
                label: "Semana",
                value: "week",
                icon: <CalendarDays className="size-4" />,
              },
              {
                label: "Mês",
                value: "month",
                icon: <CalendarDays className="size-4" />,
              },
              {
                label: "Semestre",
                value: "semester",
                icon: <CalendarDays className="size-4" />,
              },
            ]}
            value="month"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <InlineAlert title="Aviso informativo">
            A publicação de avisos será conectada ao banco nas próximas specs.
          </InlineAlert>
          <InlineAlert title="Erro de validação" tone="danger">
            Revise os campos destacados antes de salvar.
          </InlineAlert>
          <EmptyState
            description="Crie o primeiro evento quando o CRUD administrativo estiver disponível."
            title="Nenhum evento cadastrado"
          />
          <div className="grid gap-3 rounded-md border border-border bg-surface p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Dialog
            className="static m-0 block max-h-none w-full"
            description="Prévia visual do componente de desktop."
            open
            title="Detalhes do evento"
          >
            <p className="text-sm leading-6 text-text-secondary">
              Conteúdo do evento, links e avisos de alteração entram nas
              próximas specs.
            </p>
          </Dialog>
          <Sheet
            className="static m-0 block h-auto max-h-none w-full rounded-md"
            description="Prévia visual do painel mobile."
            open
            side="bottom"
            title="Filtros"
          >
            <Button
              leadingIcon={<Settings2 className="size-4" />}
              variant="secondary"
            >
              Aplicar filtros
            </Button>
          </Sheet>
        </section>

        <ConfirmDialog
          body="Exclusão destrutiva será reservada para administradores nas specs futuras."
          confirmLabel="Excluir"
          title="Confirmar ação"
        />

        <div className="hidden">
          <Trash2 aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}

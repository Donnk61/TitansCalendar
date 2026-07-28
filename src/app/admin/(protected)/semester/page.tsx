import {
  activateSemester,
  archiveActiveSemester,
  createSemester,
  updateActiveSemester,
  updateEventType,
  upsertProject,
} from "@/server/actions/admin-maintenance";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import { getAdminMaintenanceData } from "@/server/queries/admin-maintenance";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input, Label } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { InlineAlert } from "@/components/ui/inline-alert";

export default async function AdminSemesterPage() {
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

  if (state.access.role !== "admin") {
    return <AdminAccessProblem reason="admin-only" />;
  }

  const data = await getAdminMaintenanceData();

  return (
    <section className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Manutenção
        </p>
        <h1 className="mt-3 font-display text-3xl font-black tracking-normal text-text-primary">
          Ciclo do Semestre
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
          Arquive períodos encerrados, prepare o próximo semestre e mantenha
          cadastros usados pelo calendário.
        </p>
      </div>

      {data.activeSemester ? (
        <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-text-primary">
                Semestre Ativo
              </h2>
              <p className="mt-1 text-sm text-text-secondary">
                {data.summary.events} eventos, {data.summary.series} séries e{" "}
                {data.summary.announcements} avisos serão preservados ao
                arquivar.
              </p>
            </div>
            <Badge tone="success">{data.activeSemester.name}</Badge>
          </div>
          <form
            action={updateActiveSemester}
            className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]"
          >
            <input name="id" type="hidden" value={data.activeSemester.id} />
            <Field>
              <Label htmlFor="active-name">Nome</Label>
              <Input
                defaultValue={data.activeSemester.name}
                id="active-name"
                name="name"
              />
            </Field>
            <Field>
              <Label htmlFor="active-starts">Início</Label>
              <Input
                defaultValue={data.activeSemester.starts_on}
                id="active-starts"
                name="startsOn"
                type="date"
              />
            </Field>
            <Field>
              <Label htmlFor="active-ends">Fim</Label>
              <Input
                defaultValue={data.activeSemester.ends_on}
                id="active-ends"
                name="endsOn"
                type="date"
              />
            </Field>
            <div className="flex items-end">
              <Button className="w-full" type="submit" variant="secondary">
                Salvar
              </Button>
            </div>
          </form>
          <form action={archiveActiveSemester} className="grid gap-3">
            <input name="id" type="hidden" value={data.activeSemester.id} />
            <InlineAlert title="Arquivamento Protegido" tone="warning">
              Arquivar remove o semestre da leitura pública e mantém todos os
              dados para auditoria interna.
            </InlineAlert>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                autoComplete="off"
                name="confirmation"
                placeholder="Digite ARQUIVAR…"
              />
              <Button type="submit" variant="danger">
                Arquivar Semestre
              </Button>
            </div>
          </form>
        </section>
      ) : (
        <InlineAlert title="Sem semestre ativo" tone="warning">
          A página pública exibirá a mensagem institucional até um semestre ser
          ativado.
        </InlineAlert>
      )}

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Criar Próximo Semestre
        </h2>
        <form
          action={createSemester}
          className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <Field>
            <Label htmlFor="semester-name">Nome</Label>
            <Input id="semester-name" name="name" placeholder="2027.1…" />
          </Field>
          <Field>
            <Label htmlFor="semester-starts">Início</Label>
            <Input id="semester-starts" name="startsOn" type="date" />
          </Field>
          <Field>
            <Label htmlFor="semester-ends">Fim</Label>
            <Input id="semester-ends" name="endsOn" type="date" />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" type="submit">
              Criar
            </Button>
          </div>
          <div className="md:col-span-4">
            <Checkbox
              defaultChecked
              description="Projetos e tipos são cadastros globais do MVP; eventos e avisos não são copiados."
              label="Manter projetos ativos e tipos configurados"
              name="copyCatalog"
            />
          </div>
        </form>
        <p className="text-sm leading-6 text-text-muted">
          Eventos e avisos não são copiados para o novo semestre.
        </p>
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Semestres
        </h2>
        <div className="grid gap-2">
          {data.semesters.map((semester) => (
            <form
              action={activateSemester}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border py-3 last:border-b-0"
              key={semester.id}
            >
              <input name="id" type="hidden" value={semester.id} />
              <div>
                <p className="font-semibold text-text-primary">
                  {semester.name}
                </p>
                <p className="text-sm text-text-muted">
                  {semester.starts_on} até {semester.ends_on}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {semester.is_active ? (
                  <Badge tone="success">Ativo</Badge>
                ) : null}
                {semester.archived_at ? <Badge>Arquivado</Badge> : null}
                <Button
                  disabled={semester.is_active || Boolean(semester.archived_at)}
                  size="sm"
                  type="submit"
                  variant="secondary"
                >
                  Ativar
                </Button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Projetos
        </h2>
        <form
          action={upsertProject}
          className="grid gap-4 rounded-sm border border-border bg-surface-muted p-4 md:grid-cols-[1fr_1fr_120px_auto]"
        >
          <Field>
            <Label htmlFor="project-name">Nome</Label>
            <Input id="project-name" name="name" placeholder="Novo projeto…" />
          </Field>
          <Field>
            <Label htmlFor="project-slug">Slug</Label>
            <Input
              autoComplete="off"
              id="project-slug"
              name="slug"
              placeholder="novo-projeto…"
            />
          </Field>
          <Field>
            <Label htmlFor="project-order">Ordem</Label>
            <Input
              defaultValue={100}
              id="project-order"
              min={0}
              name="sortOrder"
              type="number"
            />
          </Field>
          <div className="flex items-end">
            <Button className="w-full" type="submit">
              Adicionar
            </Button>
          </div>
          <input name="isActive" type="hidden" value="on" />
        </form>
        <div className="grid gap-3">
          {data.projects.map((project) => (
            <form
              action={upsertProject}
              className="grid gap-3 rounded-sm border border-border bg-background p-3 md:grid-cols-[1fr_1fr_120px_160px_auto]"
              key={project.id}
            >
              <input name="id" type="hidden" value={project.id} />
              <Input
                aria-label={`Nome de ${project.name}`}
                defaultValue={project.name}
                name="name"
              />
              <Input
                aria-label={`Slug de ${project.name}`}
                defaultValue={project.slug}
                name="slug"
              />
              <Input
                aria-label={`Ordem de ${project.name}`}
                defaultValue={project.sort_order}
                min={0}
                name="sortOrder"
                type="number"
              />
              <Checkbox
                defaultChecked={project.is_active}
                label="Ativo"
                name="isActive"
              />
              <Button type="submit" variant="secondary">
                Salvar
              </Button>
            </form>
          ))}
        </div>
      </section>

      <section className="grid gap-4 rounded-sm border border-border bg-surface p-5">
        <h2 className="font-display text-xl font-semibold text-text-primary">
          Tipos de Evento
        </h2>
        <div className="grid gap-3">
          {data.eventTypes.map((type) => (
            <form
              action={updateEventType}
              className="grid gap-3 rounded-sm border border-border bg-background p-3 md:grid-cols-[1fr_1fr_1fr_120px_160px_auto]"
              key={type.slug}
            >
              <input name="slug" type="hidden" value={type.slug} />
              <Input
                aria-label={`Rótulo de ${type.label}`}
                defaultValue={type.label}
                name="label"
              />
              <Input
                aria-label={`Ícone de ${type.label}`}
                defaultValue={type.icon_key}
                name="iconKey"
              />
              <Input
                aria-label={`Token de cor de ${type.label}`}
                defaultValue={type.color_token}
                name="colorToken"
              />
              <Input
                aria-label={`Ordem de ${type.label}`}
                defaultValue={type.sort_order}
                min={0}
                name="sortOrder"
                type="number"
              />
              <Checkbox
                defaultChecked={type.is_active}
                label="Ativo"
                name="isActive"
              />
              <Button type="submit" variant="secondary">
                Salvar
              </Button>
            </form>
          ))}
        </div>
      </section>
    </section>
  );
}

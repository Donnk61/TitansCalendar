import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Input, Label, Select } from "@/components/ui/field";
import { InlineAlert } from "@/components/ui/inline-alert";
import {
  createEditorAccess,
  deactivateEditorAccess,
  updateEditorRole,
} from "@/server/actions/admin-access";
import { getAdminSessionState } from "@/server/auth/admin-session";
import { AdminAccessProblem } from "@/server/auth/admin-guard";
import { listEditorAccess } from "@/server/queries/admin-access";

export default async function AdminAccessPage() {
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

  const editors = await listEditorAccess();

  return (
    <section className="grid min-w-0 gap-6 overflow-hidden">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          Segurança
        </p>
        <h1 className="mt-3 break-words font-display text-3xl font-black tracking-normal text-text-primary">
          Acessos administrativos
        </h1>
        <p className="mt-3 max-w-2xl break-words text-sm leading-6 text-text-secondary">
          Gerencie quais e-mails podem editar o cronograma. As permissões são
          validadas no servidor em cada action.
        </p>
      </div>

      <form
        action={createEditorAccess}
        className="grid min-w-0 grid-cols-1 gap-4 rounded-sm border border-border bg-surface p-3 sm:p-5 md:grid-cols-[1fr_1fr_160px_auto]"
      >
        <Field>
          <Label htmlFor="access-email">E-mail</Label>
          <Input
            id="access-email"
            name="email"
            placeholder="editor@titans.com.br"
            type="email"
          />
        </Field>
        <Field>
          <Label htmlFor="access-name">Nome exibido</Label>
          <Input id="access-name" name="displayName" placeholder="Opcional" />
        </Field>
        <Field>
          <Label htmlFor="access-role">Papel</Label>
          <Select defaultValue="editor" id="access-role" name="role">
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button
            className="w-full"
            leadingIcon={<UserPlus aria-hidden="true" className="size-4" />}
            type="submit"
          >
            Adicionar
          </Button>
        </div>
      </form>

      <InlineAlert title="Proteção do último admin" tone="info">
        A regra definitiva fica no banco: a política/trigger deve impedir a
        remoção ou rebaixamento do último administrador ativo.
      </InlineAlert>

      <div className="max-w-full min-w-0 overflow-x-auto rounded-sm border border-border bg-surface">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <thead className="bg-surface-muted text-left text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">Papel</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {editors.map((editor) => (
              <tr key={editor.id}>
                <td className="px-4 py-3 font-semibold text-text-primary">
                  {editor.email}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {editor.display_name ?? "Sem nome"}
                </td>
                <td className="px-4 py-3">
                  <form action={updateEditorRole} className="flex gap-2">
                    <input name="id" type="hidden" value={editor.id} />
                    <Select
                      aria-label={`Papel de ${editor.email}`}
                      defaultValue={editor.role}
                      name="role"
                    >
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </Select>
                    <Button size="sm" type="submit" variant="secondary">
                      Salvar
                    </Button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={editor.is_active ? "success" : "neutral"}>
                    {editor.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <form
                    action={deactivateEditorAccess}
                    className="flex justify-end"
                  >
                    <input name="id" type="hidden" value={editor.id} />
                    <Button
                      disabled={!editor.is_active}
                      size="sm"
                      type="submit"
                      variant="danger"
                    >
                      Desativar
                    </Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

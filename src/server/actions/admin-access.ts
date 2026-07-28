"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/server/authorization/access";

const roleSchema = z.enum(["admin", "editor"]);

const createAccessSchema = z.object({
  email: z.email(),
  displayName: z.string().trim().max(120).optional(),
  role: roleSchema,
});

const updateAccessSchema = z.object({
  id: z.uuid(),
  role: roleSchema,
});

const idSchema = z.object({
  id: z.uuid(),
});

export async function createEditorAccess(formData: FormData) {
  const parsed = createAccessSchema.parse({
    email: formData.get("email"),
    displayName: formData.get("displayName") || undefined,
    role: formData.get("role"),
  });
  const { supabase } = await requireAdmin();

  const { error } = await supabase.from("editor_access").upsert(
    {
      email: parsed.email.toLowerCase(),
      display_name: parsed.displayName ?? null,
      role: parsed.role,
      is_active: true,
    },
    { onConflict: "email" },
  );

  if (error) {
    throw new Error("Não foi possível salvar o acesso.");
  }

  revalidatePath("/admin/access");
}

export async function updateEditorRole(formData: FormData) {
  const parsed = updateAccessSchema.parse({
    id: formData.get("id"),
    role: formData.get("role"),
  });
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("editor_access")
    .update({ role: parsed.role })
    .eq("id", parsed.id);

  if (error) {
    throw new Error("Não foi possível alterar o papel.");
  }

  revalidatePath("/admin/access");
}

export async function deactivateEditorAccess(formData: FormData) {
  const parsed = idSchema.parse({
    id: formData.get("id"),
  });
  const { supabase } = await requireAdmin();

  const { error } = await supabase
    .from("editor_access")
    .update({ is_active: false })
    .eq("id", parsed.id);

  if (error) {
    throw new Error("Não foi possível desativar o acesso.");
  }

  revalidatePath("/admin/access");
}

"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  clearAdminCredentialSession,
  createAdminCredentialSession,
  getSafeAdminNextPath,
  validateAdminCredentials,
} from "@/server/auth/admin-session";

export type LoginActionState = {
  status: "idle" | "error";
  message: string;
};

const loginSchema = z.object({
  next: z.string().optional(),
  password: z.string().min(1),
  username: z.string().min(1),
});

export async function signInAdmin(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    next: formData.get("next") ?? undefined,
    password: formData.get("password"),
    username: formData.get("username"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe o usuário e a senha do painel administrativo.",
    };
  }

  if (
    !validateAdminCredentials(parsed.data.username.trim(), parsed.data.password)
  ) {
    return {
      status: "error",
      message: "Usuário ou senha inválidos.",
    };
  }

  try {
    await createAdminCredentialSession();
  } catch {
    return {
      status: "error",
      message:
        "Não foi possível iniciar a sessão. Verifique a configuração do Supabase.",
    };
  }

  redirect(getSafeAdminNextPath(parsed.data.next ?? null));
}

export async function signOutAdmin() {
  await clearAdminCredentialSession();
  redirect("/admin/login");
}

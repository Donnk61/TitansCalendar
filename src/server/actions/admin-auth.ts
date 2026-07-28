"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServerEnv } from "@/lib/supabase/env";
import { getSafeAdminNextPath } from "@/server/auth/admin-session";

export type LoginActionState = {
  status: "idle" | "sent" | "error";
  message: string;
};

const loginSchema = z.object({
  email: z.email(),
  next: z.string().optional(),
});

export async function sendAdminMagicLink(
  _previousState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Informe um e-mail válido para receber o link de acesso.",
    };
  }

  try {
    const env = getSupabaseServerEnv();
    const supabase = await createSupabaseServerClient();
    const next = getSafeAdminNextPath(parsed.data.next ?? null);
    const emailRedirectTo = `${env.siteUrl}/admin/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      return {
        status: "error",
        message:
          "Não foi possível enviar o link agora. Verifique a configuração do Supabase e tente novamente.",
      };
    }

    return {
      status: "sent",
      message:
        "Se esse e-mail estiver autorizado, um link de acesso será enviado em instantes.",
    };
  } catch {
    return {
      status: "error",
      message:
        "O login administrativo ainda precisa das variáveis públicas do Supabase.",
    };
  }
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

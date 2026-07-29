"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
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
    getSupabaseServerEnv();
    const normalizedEmail = parsed.data.email.toLowerCase();
    const serviceRoleSupabase = createSupabaseServiceRoleClient();
    const { data: authorizedAccess, error: accessError } =
      await serviceRoleSupabase
        .from("editor_access")
        .select("id")
        .eq("email", normalizedEmail)
        .eq("is_active", true)
        .in("role", ["admin", "editor"])
        .maybeSingle();

    if (accessError) {
      return {
        status: "error",
        message:
          "NÃ£o foi possÃ­vel verificar a permissÃ£o administrativa agora.",
      };
    }

    if (!authorizedAccess) {
      return {
        status: "sent",
        message:
          "Se esse e-mail estiver autorizado, um link de acesso serÃ¡ enviado em instantes.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const next = getSafeAdminNextPath(parsed.data.next ?? null);
    const emailRedirectTo = `${await getRequestOrigin()}/admin/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
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

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return "http://localhost:3000";
  }

  return `${protocol}://${host}`;
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

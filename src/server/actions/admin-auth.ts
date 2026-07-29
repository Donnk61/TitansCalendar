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
    const env = getSupabaseServerEnv();
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

    const authUserError = await ensureAuthorizedAuthUser(
      serviceRoleSupabase,
      normalizedEmail,
    );

    if (authUserError) {
      console.error("Failed to prepare authorized auth user", authUserError);

      return {
        status: "error",
        message:
          "NÃ£o foi possÃ­vel preparar o acesso autorizado agora. Verifique a chave service role do Supabase.",
      };
    }

    const supabase = await createSupabaseServerClient();
    const next = getSafeAdminNextPath(parsed.data.next ?? null);
    const emailRedirectTo = `${await getRequestOrigin(env.siteUrl)}/admin/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: true,
      },
    });

    if (error) {
      console.error("Failed to send admin magic link", {
        code: error.code,
        message: error.message,
        name: error.name,
        status: error.status,
      });

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

async function ensureAuthorizedAuthUser(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  email: string,
) {
  const existingUserResult = await findAuthUserByEmail(supabase, email);

  if (existingUserResult.error) {
    return existingUserResult.error;
  }

  const existingUser = existingUserResult.user;

  if (!existingUser) {
    const { error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    return error;
  }

  if (existingUser.email_confirmed_at) {
    return null;
  }

  const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
    email_confirm: true,
  });

  return error;
}

async function findAuthUserByEmail(
  supabase: ReturnType<typeof createSupabaseServiceRoleClient>,
  email: string,
) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      return { error, user: null };
    }

    const user = data.users.find((item) => item.email?.toLowerCase() === email);

    if (user) {
      return { error: null, user };
    }

    if (!data.nextPage) {
      return { error: null, user: null };
    }
  }

  return {
    error: new Error("Authorized auth user lookup exceeded pagination limit."),
    user: null,
  };
}

async function getRequestOrigin(siteUrl?: string) {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";

  if (host && !isLocalhost(host)) {
    return `${protocol}://${host}`;
  }

  if (siteUrl && !isLocalhost(new URL(siteUrl).host)) {
    return siteUrl.replace(/\/$/, "");
  }

  if (host) {
    return `${protocol}://${host}`;
  }

  return "http://localhost:3000";
}

function isLocalhost(host: string) {
  return (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]")
  );
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

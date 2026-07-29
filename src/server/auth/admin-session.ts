import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getSupabaseServerEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/supabase";
export { getSafeAdminNextPath } from "@/server/auth/safe-next";

export type EditorAccess = Database["public"]["Tables"]["editor_access"]["Row"];
export type AdminSessionUser = {
  email: string;
};

export type AdminSessionState =
  | { status: "unconfigured"; message: string }
  | { status: "unauthenticated" }
  | { status: "unauthorized"; user: AdminSessionUser }
  | { status: "authorized"; user: AdminSessionUser; access: EditorAccess };

const ADMIN_SESSION_COOKIE = "titans_admin_session";
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
const ADMIN_USERNAME = "AdminTitans";
const ADMIN_PASSWORD = "admintitans2026";
const ADMIN_USER: AdminSessionUser = {
  email: "admin@titans.local",
};
const ADMIN_ACCESS: EditorAccess = {
  created_at: "2026-01-01T00:00:00+00:00",
  display_name: "AdminTitans",
  email: ADMIN_USER.email,
  id: "00000000-0000-0000-0000-000000000001",
  is_active: true,
  role: "admin",
  updated_at: "2026-01-01T00:00:00+00:00",
};

type AdminSessionPayload = {
  exp: number;
  username: string;
};

export async function getAdminSessionState(): Promise<AdminSessionState> {
  const session = await readAdminSessionPayload();

  if (!session) {
    return { status: "unauthenticated" };
  }

  try {
    createSupabaseServiceRoleClient();
  } catch {
    return {
      status: "unconfigured",
      message:
        "Configure as variáveis do Supabase, incluindo SUPABASE_SERVICE_ROLE_KEY, para ativar o painel administrativo.",
    };
  }

  return {
    status: "authorized",
    user: ADMIN_USER,
    access: ADMIN_ACCESS,
  };
}

export function validateAdminCredentials(username: string, password: string) {
  return (
    constantTimeEquals(username, ADMIN_USERNAME) &&
    constantTimeEquals(password, ADMIN_PASSWORD)
  );
}

export async function createAdminCredentialSession() {
  const cookieStore = await cookies();
  const payload: AdminSessionPayload = {
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SECONDS,
    username: ADMIN_USERNAME,
  };

  cookieStore.set(ADMIN_SESSION_COOKIE, encodeSignedPayload(payload), {
    httpOnly: true,
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminCredentialSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE);
}

export function getStaticAdminUser() {
  return ADMIN_USER;
}

async function readAdminSessionPayload() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_SESSION_COOKIE);

  if (!cookie?.value) {
    return null;
  }

  const payload = decodeSignedPayload(cookie.value);

  if (!payload || payload.username !== ADMIN_USERNAME) {
    return null;
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    await clearAdminCredentialSession();
    return null;
  }

  return payload;
}

function encodeSignedPayload(payload: AdminSessionPayload) {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url",
  );
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

function decodeSignedPayload(value: string): AdminSessionPayload | null {
  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  if (!constantTimeEquals(signature, signPayload(encodedPayload))) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;

    if (typeof parsed.exp !== "number" || typeof parsed.username !== "string") {
      return null;
    }

    return {
      exp: parsed.exp,
      username: parsed.username,
    };
  } catch {
    return null;
  }
}

function signPayload(payload: string) {
  const env = getSupabaseServerEnv();
  const secret = env.serviceRoleKey ?? env.anonKey;

  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function constantTimeEquals(first: string, second: string) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);

  if (firstBuffer.length !== secondBuffer.length) {
    return false;
  }

  return timingSafeEqual(firstBuffer, secondBuffer);
}

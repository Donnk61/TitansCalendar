import { publicEnvSchema, serverEnvSchema } from "@/lib/validation/env";

export function getSupabasePublicEnv() {
  const env = publicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return {
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    url: normalizeSupabaseProjectUrl(env.NEXT_PUBLIC_SUPABASE_URL),
  };
}

export function getSupabaseServerEnv() {
  const env = serverEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase public environment variables are missing.");
  }

  return {
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    siteUrl: env.NEXT_PUBLIC_SITE_URL,
    url: normalizeSupabaseProjectUrl(env.NEXT_PUBLIC_SUPABASE_URL),
  };
}

function normalizeSupabaseProjectUrl(url: string) {
  const parsedUrl = new URL(url);
  parsedUrl.pathname = parsedUrl.pathname.replace(/\/rest\/v1\/?$/, "");
  parsedUrl.search = "";
  parsedUrl.hash = "";

  return parsedUrl.toString().replace(/\/$/, "");
}

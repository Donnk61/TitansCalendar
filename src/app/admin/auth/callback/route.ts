import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSafeAdminNextPath } from "@/server/auth/admin-session";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeAdminNextPath(url.searchParams.get("next"));
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(
      `${origin}/admin/login?error=expired&next=${encodeURIComponent(next)}`,
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/admin/login?error=expired&next=${encodeURIComponent(next)}`,
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch {
    return NextResponse.redirect(
      `${origin}/admin/login?error=config&next=${encodeURIComponent(next)}`,
    );
  }
}

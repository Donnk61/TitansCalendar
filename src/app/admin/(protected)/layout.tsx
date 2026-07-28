import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/admin-shell";
import { getAdminSessionState } from "@/server/auth/admin-session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const state = await getAdminSessionState();

  if (state.status === "unauthenticated") {
    redirect("/admin/login?next=%2Fadmin");
  }

  const access = state.status === "authorized" ? state.access : null;

  return <AdminShell access={access}>{children}</AdminShell>;
}

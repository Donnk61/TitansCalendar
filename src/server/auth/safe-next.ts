export function getSafeAdminNextPath(value: string | null): string {
  if (!value || !value.startsWith("/admin") || value.startsWith("//")) {
    return "/admin";
  }

  if (value.includes("://")) {
    return "/admin";
  }

  if (
    value.startsWith("/admin/login") ||
    value.startsWith("/admin/auth/callback")
  ) {
    return "/admin";
  }

  return value;
}

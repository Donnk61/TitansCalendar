import { describe, expect, it } from "vitest";
import { getSafeAdminNextPath } from "@/server/auth/safe-next";

describe("getSafeAdminNextPath", () => {
  it("keeps internal admin destinations", () => {
    expect(getSafeAdminNextPath("/admin/events/new")).toBe("/admin/events/new");
  });

  it("falls back for non-admin and auth-loop destinations", () => {
    expect(getSafeAdminNextPath(null)).toBe("/admin");
    expect(getSafeAdminNextPath("/")).toBe("/admin");
    expect(getSafeAdminNextPath("/admin/login")).toBe("/admin");
    expect(getSafeAdminNextPath("/admin/auth/callback")).toBe("/admin");
    expect(getSafeAdminNextPath("https://example.com/admin")).toBe("/admin");
    expect(getSafeAdminNextPath("//example.com/admin")).toBe("/admin");
  });
});

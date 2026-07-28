import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("supabase client boundaries", () => {
  it("does not reference the service role key from browser or proxy clients", () => {
    const files = [
      "src/lib/supabase/browser.ts",
      "src/lib/supabase/proxy.ts",
      "src/proxy.ts",
    ];

    for (const file of files) {
      const contents = readFileSync(join(root, file), "utf8");

      expect(contents).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(contents).not.toContain("serviceRoleKey");
    }
  });

  it("does not reference the service role key from client components", () => {
    const files = [
      "src/components/admin/event-form.tsx",
      "src/components/admin/login-form.tsx",
      "src/components/calendar/public-calendar-experience.tsx",
      "src/components/calendar/public-calendar.tsx",
    ];

    for (const file of files) {
      const contents = readFileSync(join(root, file), "utf8");

      expect(contents).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(contents).not.toContain("serviceRoleKey");
    }
  });
});

describe("semester lifecycle migrations", () => {
  it("adds transactional semester lifecycle functions", () => {
    const migration = readFileSync(
      join(
        root,
        "supabase/migrations/20260728160000_spec08_semester_lifecycle.sql",
      ),
      "utf8",
    );

    expect(migration).toContain("function public.activate_semester");
    expect(migration).toContain("function public.archive_active_semester");
    expect(migration).toContain("if not public.is_admin()");
    expect(migration).toContain("update public.semesters");
  });

  it("keeps destructive event deletion admin-only while allowing relation cleanup", () => {
    const spec07Migration = readFileSync(
      join(
        root,
        "supabase/migrations/20260728150000_spec07_editor_link_deletes.sql",
      ),
      "utf8",
    );
    const schema = readFileSync(
      join(root, "supabase/migrations/20260728130000_spec02_schema_rls.sql"),
      "utf8",
    );

    expect(schema).toContain('create policy "admins delete events"');
    expect(spec07Migration).toContain(
      'create policy "editors delete event project links"',
    );
    expect(spec07Migration).toContain(
      'create policy "editors delete event links"',
    );
  });
});

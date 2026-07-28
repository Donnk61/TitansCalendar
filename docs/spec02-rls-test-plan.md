# SPEC 02 RLS test plan

This project includes `supabase/tests/spec02_rls_smoke.sql` as the smoke test for
the main Row Level Security scenarios.

## Test users

Seeded allowlist rows:

- `dev-admin@titans.example` with role `admin`
- `dev-editor@titans.example` with role `editor`
- `unauthorized@titans.example` is intentionally not seeded

Supabase Auth users with these emails must be created in the local or remote test
project before UI-driven auth tests can run. The SQL smoke test simulates JWT
claims directly and does not require real Auth users.

## Scenarios covered

- `anon` reads only the active semester.
- `anon` cannot insert events.
- Authenticated but unauthorized email cannot insert events.
- Authorized editor can insert an event in the active semester.
- Editor cannot manage `editor_access`.
- Admin can add an allowlist row.
- Admin can archive the active semester.

## Local execution

Docker is required for local Supabase.

```bash
pnpm supabase:start
pnpm supabase:reset
pnpm supabase:test:rls
```

## Type generation

After migrations are applied:

```bash
pnpm supabase:types
```

This writes the generated database type file to
`src/types/generated/database.types.ts`. Do not edit that file manually after
generation.

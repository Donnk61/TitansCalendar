begin;

select plan(1);

set local role anon;

do $$
begin
  if (select count(*) from public.semesters) <> 1 then
    raise exception 'anon should read exactly the active semester';
  end if;
end;
$$;

do $$
begin
  insert into public.events (
    semester_id,
    title,
    starts_at,
    all_day,
    type_slug,
    status,
    created_by_email,
    updated_by_email
  )
  values (
    '10000000-0000-4000-8000-000000000001',
    'Tentativa anônima',
    '2026-08-05 12:00:00-03',
    false,
    'general-meeting',
    'confirmed',
    'anon@titans.example',
    'anon@titans.example'
  );

  raise exception 'anon insert should have failed';
exception
  when insufficient_privilege then
    null;
  when others then
    if sqlerrm not like '%row-level security%' then
      raise;
    end if;
end;
$$;

reset role;

set local role authenticated;
set local request.jwt.claims = '{"email":"unauthorized@titans.example","sub":"00000000-0000-4000-8000-000000000099","role":"authenticated"}';

do $$
begin
  insert into public.events (
    semester_id,
    title,
    starts_at,
    all_day,
    type_slug,
    status,
    created_by_email,
    updated_by_email
  )
  values (
    '10000000-0000-4000-8000-000000000001',
    'Tentativa não autorizada',
    '2026-08-05 12:00:00-03',
    false,
    'general-meeting',
    'confirmed',
    'unauthorized@titans.example',
    'unauthorized@titans.example'
  );

  raise exception 'unauthorized insert should have failed';
exception
  when insufficient_privilege then
    null;
  when others then
    if sqlerrm not like '%row-level security%' then
      raise;
    end if;
end;
$$;

set local request.jwt.claims = '{"email":"dev-editor@titans.example","sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}';

insert into public.events (
  id,
  semester_id,
  title,
  starts_at,
  ends_at,
  all_day,
  type_slug,
  status,
  created_by_email,
  updated_by_email
)
values (
  '40000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'Evento criado por editor',
  '2026-08-06 19:00:00-03',
  '2026-08-06 20:00:00-03',
  false,
  'general-meeting',
  'confirmed',
  'dev-editor@titans.example',
  'dev-editor@titans.example'
);

do $$
begin
  update public.editor_access
  set role = 'admin'
  where email = 'dev-editor@titans.example';

  if exists (
    select 1
    from public.editor_access
    where email = 'dev-editor@titans.example'
      and role = 'admin'
  ) then
    raise exception 'editor should not manage allowlist';
  end if;
exception
  when insufficient_privilege then
    null;
  when others then
    if sqlerrm not like '%row-level security%' then
      raise;
    end if;
end;
$$;

set local request.jwt.claims = '{"email":"dev-admin@titans.example","sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';

insert into public.editor_access (email, display_name, role, is_active)
values ('new-editor@titans.example', 'Novo editor', 'editor', true);

update public.semesters
set is_active = false,
    archived_at = now()
where id = '10000000-0000-4000-8000-000000000001';

select pass('spec02 RLS smoke checks completed');
select * from finish();

rollback;

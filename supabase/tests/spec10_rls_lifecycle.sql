begin;

select plan(1);

do $$
begin
  if not exists (
    select 1
    from pg_proc
    where proname = 'activate_semester'
  ) then
    raise exception 'activate_semester function should exist';
  end if;

  if not exists (
    select 1
    from pg_proc
    where proname = 'archive_active_semester'
  ) then
    raise exception 'archive_active_semester function should exist';
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'events'
      and policyname = 'admins delete events'
  ) then
    raise exception 'events delete policy should stay admin-only';
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'event_links'
      and policyname = 'editors delete event links'
  ) then
    raise exception 'editors should be able to clean event links';
  end if;
end;
$$;

set local role authenticated;
set local request.jwt.claims = '{"email":"dev-editor@titans.example","sub":"00000000-0000-4000-8000-000000000002","role":"authenticated"}';

do $$
begin
  perform public.archive_active_semester('10000000-0000-4000-8000-000000000001');
  raise exception 'editor should not archive semester';
exception
  when others then
    if sqlerrm not like '%Only admins can archive semesters%' then
      raise;
    end if;
end;
$$;

set local request.jwt.claims = '{"email":"dev-admin@titans.example","sub":"00000000-0000-4000-8000-000000000001","role":"authenticated"}';

select public.archive_active_semester('10000000-0000-4000-8000-000000000001');

do $$
begin
  if exists (
    select 1
    from public.semesters
    where id = '10000000-0000-4000-8000-000000000001'
      and is_active = true
  ) then
    raise exception 'archived semester should no longer be active';
  end if;
end;
$$;

select pass('spec10 semester lifecycle checks completed');
select * from finish();

rollback;

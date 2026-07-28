create or replace function public.activate_semester(target_semester_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can activate semesters';
  end if;

  if not exists (
    select 1 from public.semesters where id = target_semester_id and archived_at is null
  ) then
    raise exception 'Semester not found or archived';
  end if;

  update public.semesters
  set is_active = false
  where is_active = true;

  update public.semesters
  set is_active = true,
      archived_at = null
  where id = target_semester_id;
end;
$$;

create or replace function public.archive_active_semester(target_semester_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can archive semesters';
  end if;

  update public.semesters
  set is_active = false,
      archived_at = now()
  where id = target_semester_id
    and is_active = true
    and archived_at is null;

  if not found then
    raise exception 'Active semester not found';
  end if;
end;
$$;

grant execute on function public.activate_semester(uuid) to authenticated;
grant execute on function public.archive_active_semester(uuid) to authenticated;


create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.editor_access
    where email = public.current_user_email()::extensions.citext
      and is_active = true
      and role in ('admin', 'editor')
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.editor_access
    where email = public.current_user_email()::extensions.citext
      and is_active = true
      and role = 'admin'
  );
$$;

create table public.semesters (
  id uuid primary key default extensions.gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  starts_on date not null,
  ends_on date not null,
  is_active boolean not null default false,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint semesters_valid_range check (starts_on <= ends_on),
  constraint semesters_archive_state check (archived_at is null or is_active = false)
);

create unique index semesters_one_active_idx
  on public.semesters (is_active)
  where is_active = true and archived_at is null;

create index semesters_active_lookup_idx
  on public.semesters (is_active, starts_on, ends_on)
  where is_active = true and archived_at is null;

create function public.active_semester_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id
  from public.semesters
  where is_active = true
    and archived_at is null
  limit 1;
$$;

create table public.projects (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 1 and 80),
  is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_slug_idx on public.projects (slug);
create index projects_active_sort_idx on public.projects (is_active, sort_order, name);

create table public.event_types (
  slug text primary key check (
    slug in (
      'general-meeting',
      'leaders-meeting',
      'deadline',
      'competition',
      'external-event',
      'selection-process',
      'fundraising',
      'milestone'
    )
  ),
  label text not null check (char_length(trim(label)) between 1 and 80),
  color_token text not null check (char_length(trim(color_token)) between 1 and 80),
  icon_key text not null check (char_length(trim(icon_key)) between 1 and 80),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true
);

create index event_types_active_sort_idx on public.event_types (is_active, sort_order, label);

create table public.editor_access (
  id uuid primary key default extensions.gen_random_uuid(),
  email extensions.citext not null unique,
  display_name text check (display_name is null or char_length(trim(display_name)) between 1 and 120),
  role text not null check (role in ('admin', 'editor')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint editor_access_valid_email check (email::text ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

create index editor_access_email_active_idx on public.editor_access (lower(email::text), is_active);

create function public.validate_last_active_admin()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.role = 'admin'
    and old.is_active = true
    and (tg_op = 'DELETE' or new.role <> 'admin' or new.is_active = false)
  then
    if (
      select count(*)
      from public.editor_access
      where role = 'admin'
        and is_active = true
        and id <> old.id
    ) = 0 then
      raise exception 'Cannot remove or demote the last active admin';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger editor_access_last_admin_guard
before update or delete on public.editor_access
for each row execute function public.validate_last_active_admin();

create function public.is_valid_recurrence_rule(rule jsonb)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  frequency text;
  interval_weeks integer;
begin
  if jsonb_typeof(rule) <> 'object' then
    return false;
  end if;

  if (rule ->> 'schemaVersion')::integer is distinct from 1 then
    return false;
  end if;

  frequency := rule ->> 'frequency';
  interval_weeks := (rule ->> 'intervalWeeks')::integer;

  if frequency is null or frequency not in ('weekly', 'biweekly') then
    return false;
  end if;

  if frequency = 'weekly' and interval_weeks is distinct from 1 then
    return false;
  end if;

  if frequency = 'biweekly' and interval_weeks is distinct from 2 then
    return false;
  end if;

  if (rule ->> 'startsOn') is null or (rule ->> 'endsOn') is null then
    return false;
  end if;

  if (rule ->> 'startsOn')::date > (rule ->> 'endsOn')::date then
    return false;
  end if;

  return true;
exception
  when others then
    return false;
end;
$$;

create table public.event_series (
  id uuid primary key default extensions.gen_random_uuid(),
  semester_id uuid not null references public.semesters (id) on delete restrict,
  rule jsonb not null check (public.is_valid_recurrence_rule(rule)),
  title_snapshot text not null check (char_length(trim(title_snapshot)) between 1 and 120),
  created_by_email extensions.citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index event_series_semester_idx on public.event_series (semester_id);

create table public.events (
  id uuid primary key default extensions.gen_random_uuid(),
  semester_id uuid not null references public.semesters (id) on delete restrict,
  series_id uuid references public.event_series (id) on delete set null,
  occurrence_index integer check (occurrence_index is null or occurrence_index >= 0),
  title text not null check (char_length(trim(title)) between 1 and 120),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  type_slug text not null references public.event_types (slug) on update cascade,
  status text not null check (status in ('confirmed', 'pending', 'changed', 'cancelled', 'completed')),
  location_name text check (location_name is null or char_length(trim(location_name)) <= 280),
  meeting_url text check (meeting_url is null or meeting_url ~* '^https?://'),
  responsible text check (responsible is null or char_length(trim(responsible)) <= 280),
  description text check (description is null or char_length(description) <= 1000),
  change_note text check (change_note is null or char_length(trim(change_note)) <= 280),
  change_visible_until timestamptz,
  is_important boolean not null default false,
  created_by_email extensions.citext not null,
  updated_by_email extensions.citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_valid_time_range check (ends_at is null or ends_at >= starts_at)
);

create index events_semester_starts_at_idx on public.events (semester_id, starts_at);
create index events_status_idx on public.events (status);
create index events_series_idx on public.events (series_id) where series_id is not null;
create index events_active_semester_range_idx on public.events (starts_at, ends_at, status);

create table public.event_projects (
  event_id uuid not null references public.events (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete restrict,
  primary key (event_id, project_id)
);

create index event_projects_project_idx on public.event_projects (project_id);

create table public.event_links (
  id uuid primary key default extensions.gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null check (char_length(trim(label)) between 1 and 80),
  url text not null check (url ~* '^https?://'),
  sort_order integer not null default 0 check (sort_order >= 0)
);

create index event_links_event_sort_idx on public.event_links (event_id, sort_order);

create table public.announcements (
  id uuid primary key default extensions.gen_random_uuid(),
  semester_id uuid not null references public.semesters (id) on delete restrict,
  title text not null check (char_length(trim(title)) between 1 and 120),
  body text not null check (char_length(trim(body)) between 1 and 1000),
  severity text not null check (severity in ('info', 'warning', 'critical')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  related_event_id uuid references public.events (id) on delete set null,
  is_published boolean not null default false,
  created_by_email extensions.citext not null,
  updated_by_email extensions.citext not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_valid_range check (ends_at is null or ends_at >= starts_at)
);

create index announcements_semester_vigency_idx
  on public.announcements (semester_id, is_published, starts_at, ends_at);

create function public.validate_event_semester_bounds()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  semester public.semesters%rowtype;
  effective_end timestamptz;
begin
  select *
  into semester
  from public.semesters
  where id = new.semester_id;

  if not found then
    raise exception 'Semester not found for event';
  end if;

  effective_end := coalesce(new.ends_at, new.starts_at);

  if new.starts_at::date < semester.starts_on
    or effective_end::date > semester.ends_on
  then
    raise exception 'Event must be inside its semester';
  end if;

  if new.series_id is not null and not exists (
    select 1
    from public.event_series
    where id = new.series_id
      and semester_id = new.semester_id
  ) then
    raise exception 'Event series must belong to the same semester';
  end if;

  return new;
end;
$$;

create trigger events_semester_bounds
before insert or update on public.events
for each row execute function public.validate_event_semester_bounds();

create function public.validate_announcement_semester_bounds()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  semester public.semesters%rowtype;
  effective_end timestamptz;
begin
  select *
  into semester
  from public.semesters
  where id = new.semester_id;

  if not found then
    raise exception 'Semester not found for announcement';
  end if;

  effective_end := coalesce(new.ends_at, new.starts_at);

  if new.starts_at::date < semester.starts_on
    or effective_end::date > semester.ends_on
  then
    raise exception 'Announcement must be inside its semester';
  end if;

  if new.related_event_id is not null and not exists (
    select 1
    from public.events
    where id = new.related_event_id
      and semester_id = new.semester_id
  ) then
    raise exception 'Related event must belong to the same semester';
  end if;

  return new;
end;
$$;

create trigger announcements_semester_bounds
before insert or update on public.announcements
for each row execute function public.validate_announcement_semester_bounds();

create trigger semesters_updated_at
before update on public.semesters
for each row execute function public.set_updated_at();

create trigger projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create trigger editor_access_updated_at
before update on public.editor_access
for each row execute function public.set_updated_at();

create trigger event_series_updated_at
before update on public.event_series
for each row execute function public.set_updated_at();

create trigger events_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger announcements_updated_at
before update on public.announcements
for each row execute function public.set_updated_at();

alter table public.semesters enable row level security;
alter table public.projects enable row level security;
alter table public.event_types enable row level security;
alter table public.editor_access enable row level security;
alter table public.event_series enable row level security;
alter table public.events enable row level security;
alter table public.event_projects enable row level security;
alter table public.event_links enable row level security;
alter table public.announcements enable row level security;

create policy "anon can read active semester"
on public.semesters for select
to anon
using (is_active = true and archived_at is null);

create policy "editors can read semesters"
on public.semesters for select
to authenticated
using ((is_active = true and archived_at is null) or public.is_editor());

create policy "admins manage semesters"
on public.semesters for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "anon can read active projects"
on public.projects for select
to anon
using (is_active = true);

create policy "authenticated can read active projects"
on public.projects for select
to authenticated
using (is_active = true or public.is_editor());

create policy "admins manage projects"
on public.projects for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "anon can read active event types"
on public.event_types for select
to anon
using (is_active = true);

create policy "authenticated can read active event types"
on public.event_types for select
to authenticated
using (is_active = true or public.is_editor());

create policy "admins manage event types"
on public.event_types for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "users can read own editor access"
on public.editor_access for select
to authenticated
using (email = public.current_user_email()::extensions.citext or public.is_admin());

create policy "admins manage editor access"
on public.editor_access for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "anon can read event series for active semester"
on public.event_series for select
to anon
using (semester_id = public.active_semester_id());

create policy "editors can read event series"
on public.event_series for select
to authenticated
using (semester_id = public.active_semester_id() or public.is_editor());

create policy "editors write event series"
on public.event_series for insert
to authenticated
with check (
  public.is_editor()
  and semester_id = public.active_semester_id()
  and created_by_email = public.current_user_email()::extensions.citext
);

create policy "editors update event series"
on public.event_series for update
to authenticated
using (public.is_editor() and semester_id = public.active_semester_id())
with check (public.is_editor() and semester_id = public.active_semester_id());

create policy "admins delete event series"
on public.event_series for delete
to authenticated
using (public.is_admin());

create policy "anon can read events for active semester"
on public.events for select
to anon
using (semester_id = public.active_semester_id());

create policy "editors can read events"
on public.events for select
to authenticated
using (semester_id = public.active_semester_id() or public.is_editor());

create policy "editors create events"
on public.events for insert
to authenticated
with check (
  public.is_editor()
  and semester_id = public.active_semester_id()
  and created_by_email = public.current_user_email()::extensions.citext
  and updated_by_email = public.current_user_email()::extensions.citext
);

create policy "editors update events"
on public.events for update
to authenticated
using (public.is_editor() and semester_id = public.active_semester_id())
with check (
  public.is_editor()
  and semester_id = public.active_semester_id()
  and updated_by_email = public.current_user_email()::extensions.citext
);

create policy "admins delete events"
on public.events for delete
to authenticated
using (public.is_admin());

create policy "anon can read event project links for active events"
on public.event_projects for select
to anon
using (
  exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors can read event project links"
on public.event_projects for select
to authenticated
using (
  public.is_editor()
  or exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors write event project links"
on public.event_projects for insert
to authenticated
with check (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors update event project links"
on public.event_projects for update
to authenticated
using (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
)
with check (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "admins delete event project links"
on public.event_projects for delete
to authenticated
using (public.is_admin());

create policy "anon can read event links for active events"
on public.event_links for select
to anon
using (
  exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors can read event links"
on public.event_links for select
to authenticated
using (
  public.is_editor()
  or exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors write event links"
on public.event_links for insert
to authenticated
with check (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors update event links"
on public.event_links for update
to authenticated
using (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
)
with check (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "admins delete event links"
on public.event_links for delete
to authenticated
using (public.is_admin());

create policy "anon can read published current announcements"
on public.announcements for select
to anon
using (
  semester_id = public.active_semester_id()
  and is_published = true
  and starts_at <= now()
  and (ends_at is null or ends_at >= now())
);

create policy "editors can read announcements"
on public.announcements for select
to authenticated
using (
  public.is_editor()
  or (
    semester_id = public.active_semester_id()
    and is_published = true
    and starts_at <= now()
    and (ends_at is null or ends_at >= now())
  )
);

create policy "editors create announcements"
on public.announcements for insert
to authenticated
with check (
  public.is_editor()
  and semester_id = public.active_semester_id()
  and created_by_email = public.current_user_email()::extensions.citext
  and updated_by_email = public.current_user_email()::extensions.citext
);

create policy "editors update announcements"
on public.announcements for update
to authenticated
using (public.is_editor() and semester_id = public.active_semester_id())
with check (
  public.is_editor()
  and semester_id = public.active_semester_id()
  and updated_by_email = public.current_user_email()::extensions.citext
);

create policy "admins delete announcements"
on public.announcements for delete
to authenticated
using (public.is_admin());

grant usage on schema public to anon, authenticated;
grant execute on function public.current_user_email() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.active_semester_id() to anon, authenticated;
grant select on public.semesters to anon, authenticated;
grant select on public.projects to anon, authenticated;
grant select on public.event_types to anon, authenticated;
grant select on public.editor_access to authenticated;
grant select, insert, update, delete on public.event_series to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.event_projects to authenticated;
grant select, insert, update, delete on public.event_links to authenticated;
grant select, insert, update, delete on public.announcements to authenticated;
grant select on public.event_series to anon;
grant select on public.events to anon;
grant select on public.event_projects to anon;
grant select on public.event_links to anon;
grant select on public.announcements to anon;

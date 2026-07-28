create policy "editors delete event project links"
on public.event_projects for delete
to authenticated
using (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_projects.event_id
      and events.semester_id = public.active_semester_id()
  )
);

create policy "editors delete event links"
on public.event_links for delete
to authenticated
using (
  public.is_editor()
  and exists (
    select 1
    from public.events
    where events.id = event_links.event_id
      and events.semester_id = public.active_semester_id()
  )
);


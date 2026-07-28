insert into public.semesters (id, name, starts_on, ends_on, is_active)
values (
  '10000000-0000-4000-8000-000000000001',
  '2026.2',
  '2026-08-01',
  '2026-12-20',
  true
)
on conflict (id) do update set
  name = excluded.name,
  starts_on = excluded.starts_on,
  ends_on = excluded.ends_on,
  is_active = excluded.is_active,
  archived_at = null;

insert into public.projects (id, slug, name, is_active, sort_order)
values
  ('20000000-0000-4000-8000-000000000001', 'rover', 'Rover', true, 10),
  ('20000000-0000-4000-8000-000000000002', 'vsss', 'VSSS', true, 20),
  ('20000000-0000-4000-8000-000000000003', 'ssl-el', 'SSL-EL', true, 30),
  ('20000000-0000-4000-8000-000000000004', 'seguidor-de-linha', 'Seguidor de Linha', true, 40),
  ('20000000-0000-4000-8000-000000000005', 'robo-de-combate', 'Robô de Combate', true, 50),
  ('20000000-0000-4000-8000-000000000006', 'corobeu', 'Corobeu', true, 60),
  ('20000000-0000-4000-8000-000000000007', 'sumo', 'Sumô', true, 70),
  ('20000000-0000-4000-8000-000000000008', 'ballone', 'Ballone', true, 80)
on conflict (slug) do update set
  name = excluded.name,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

insert into public.event_types (slug, label, color_token, icon_key, sort_order, is_active)
values
  ('general-meeting', 'Reunião geral', 'brand-red', 'users', 10, true),
  ('leaders-meeting', 'Reunião de líderes', 'brand-orange', 'users-round', 20, true),
  ('deadline', 'Prazo', 'brand-amber', 'clock-3', 30, true),
  ('competition', 'Competição', 'brand-red', 'trophy', 40, true),
  ('external-event', 'Evento externo', 'text-secondary', 'calendar-plus', 50, true),
  ('selection-process', 'Processo seletivo', 'brand-orange', 'user-plus', 60, true),
  ('fundraising', 'Arrecadação', 'brand-amber', 'hand-coins', 70, true),
  ('milestone', 'Marco importante', 'text-primary', 'flag', 80, true)
on conflict (slug) do update set
  label = excluded.label,
  color_token = excluded.color_token,
  icon_key = excluded.icon_key,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

insert into public.editor_access (id, email, display_name, role, is_active)
values
  ('30000000-0000-4000-8000-000000000001', 'dev-admin@titans.example', 'Admin de desenvolvimento', 'admin', true),
  ('30000000-0000-4000-8000-000000000002', 'dev-editor@titans.example', 'Editor de desenvolvimento', 'editor', true)
on conflict (email) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active;

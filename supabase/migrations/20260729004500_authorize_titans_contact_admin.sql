insert into public.editor_access (id, email, display_name, role, is_active)
values (
  '30000000-0000-4000-8000-000000000003',
  'contato.titansteam@gmail.com',
  'TITANS Team',
  'admin',
  true
)
on conflict (email) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  is_active = excluded.is_active;

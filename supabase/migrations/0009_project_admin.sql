alter table public.projects
  add column if not exists project_admin_user_id uuid references public.users (id) on delete set null;

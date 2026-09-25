create table if not exists public.field_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  note text not null,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists field_notes_company_project_created_at_idx
  on public.field_notes (company_id, project_id, created_at desc);

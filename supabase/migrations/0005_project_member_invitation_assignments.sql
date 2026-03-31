create table if not exists public.project_member_invitation_assignments (
  id uuid primary key default gen_random_uuid(),
  company_invitation_id uuid not null references public.company_invitations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  project_role public.project_member_role not null default 'viewer',
  created_by_user_id uuid references public.users (id) on delete set null,
  accepted_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists project_member_invitation_assignments_invitation_project_idx
  on public.project_member_invitation_assignments (company_invitation_id, project_id);

create index if not exists project_member_invitation_assignments_project_id_idx
  on public.project_member_invitation_assignments (project_id);

create index if not exists project_member_invitation_assignments_invitation_id_idx
  on public.project_member_invitation_assignments (company_invitation_id);

create index if not exists project_member_invitation_assignments_project_accepted_idx
  on public.project_member_invitation_assignments (project_id, accepted_at);

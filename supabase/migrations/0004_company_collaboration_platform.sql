alter type public.user_role add value if not exists 'owner';
alter type public.user_role add value if not exists 'admin';
alter type public.user_role add value if not exists 'field_supervisor';
alter type public.user_role add value if not exists 'viewer';

do $$
begin
  if not exists (select 1 from pg_type where typname = 'company_membership_status') then
    create type public.company_membership_status as enum ('invited', 'active', 'inactive');
  end if;

  if not exists (select 1 from pg_type where typname = 'project_member_role') then
    create type public.project_member_role as enum ('project_admin', 'editor', 'contributor', 'viewer');
  end if;
end
$$;

create table if not exists public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.user_role not null,
  status public.company_membership_status not null default 'active',
  invited_by_user_id uuid references public.users (id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists company_memberships_company_user_idx
  on public.company_memberships (company_id, user_id);

create index if not exists company_memberships_company_status_idx
  on public.company_memberships (company_id, status);

create index if not exists company_memberships_user_id_idx
  on public.company_memberships (user_id);

create table if not exists public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null,
  role public.user_role not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists company_invitations_token_hash_idx
  on public.company_invitations (token_hash);

create index if not exists company_invitations_company_email_idx
  on public.company_invitations (company_id, email);

create index if not exists company_invitations_company_expires_idx
  on public.company_invitations (company_id, expires_at);

alter table public.projects
  add column if not exists project_manager_user_id uuid references public.users (id) on delete set null,
  add column if not exists superintendent_user_id uuid references public.users (id) on delete set null;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role public.project_member_role not null default 'viewer',
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists project_members_project_user_idx
  on public.project_members (project_id, user_id);

create index if not exists project_members_project_role_idx
  on public.project_members (project_id, role);

create index if not exists project_members_user_id_idx
  on public.project_members (user_id);

alter table public.pours
  add column if not exists mix_design_label text,
  add column if not exists client_submission_id text;

create unique index if not exists pours_company_project_submission_id_idx
  on public.pours (company_id, project_id, created_by_user_id, client_submission_id);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists activity_events_company_project_idx
  on public.activity_events (company_id, project_id);

create index if not exists activity_events_company_created_at_idx
  on public.activity_events (company_id, created_at desc);

create index if not exists activity_events_company_entity_idx
  on public.activity_events (company_id, entity_type, entity_id);

drop trigger if exists company_memberships_set_updated_at on public.company_memberships;
create trigger company_memberships_set_updated_at before update on public.company_memberships
for each row execute function public.set_updated_at();

drop trigger if exists company_invitations_set_updated_at on public.company_invitations;
create trigger company_invitations_set_updated_at before update on public.company_invitations
for each row execute function public.set_updated_at();

insert into public.company_memberships (company_id, user_id, role, status, joined_at)
select public.users.company_id, public.users.id, public.users.role, 'active', public.users.created_at
from public.users
on conflict (company_id, user_id) do nothing;

insert into public.project_members (project_id, user_id, role)
select public.projects.id, public.projects.created_by_user_id, 'project_admin'
from public.projects
where public.projects.created_by_user_id is not null
on conflict (project_id, user_id) do nothing;

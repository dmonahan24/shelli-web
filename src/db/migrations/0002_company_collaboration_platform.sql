alter type user_role add value if not exists 'owner';
alter type user_role add value if not exists 'admin';
alter type user_role add value if not exists 'field_supervisor';
alter type user_role add value if not exists 'viewer';

do $$
begin
  create type company_membership_status as enum ('invited', 'active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type project_member_role as enum ('project_admin', 'editor', 'contributor', 'viewer');
exception
  when duplicate_object then null;
end $$;

create table if not exists company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role user_role not null,
  status company_membership_status not null default 'active',
  invited_by_user_id uuid references users(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists company_memberships_company_user_idx
  on company_memberships (company_id, user_id);

create table if not exists company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  email text not null,
  role user_role not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  invited_by_user_id uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists company_invitations_token_hash_idx
  on company_invitations (token_hash);

alter table projects add column if not exists project_manager_user_id uuid references users(id) on delete set null;
alter table projects add column if not exists superintendent_user_id uuid references users(id) on delete set null;

create table if not exists project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role project_member_role not null default 'viewer',
  created_at timestamptz not null default now()
);

create unique index if not exists project_members_project_user_idx
  on project_members (project_id, user_id);

alter table pours add column if not exists mix_design_label text;
alter table pours add column if not exists client_submission_id text;

create unique index if not exists pours_company_project_submission_id_idx
  on pours (company_id, project_id, created_by_user_id, client_submission_id);

create table if not exists activity_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  actor_user_id uuid references users(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  summary text not null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_company_project_idx
  on activity_events (company_id, project_id);

create index if not exists activity_events_company_created_at_idx
  on activity_events (company_id, created_at);

insert into company_memberships (company_id, user_id, role, status, joined_at)
select users.company_id, users.id, users.role, 'active', users.created_at
from users
on conflict (company_id, user_id) do nothing;

insert into project_members (project_id, user_id, role)
select projects.id, projects.created_by_user_id, 'project_admin'
from projects
where projects.created_by_user_id is not null
on conflict (project_id, user_id) do nothing;

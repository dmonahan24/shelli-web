create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'dispatcher_admin',
      'project_manager',
      'field_superintendent',
      'qc_technician',
      'executive_owner'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'project_status') then
    create type project_status as enum ('active', 'completed', 'on_hold');
  end if;

  if not exists (select 1 from pg_type where typname = 'pour_status') then
    create type pour_status as enum (
      'planned',
      'ready',
      'in_progress',
      'completed',
      'delayed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'placement_area_type') then
    create type placement_area_type as enum (
      'slab',
      'footing',
      'wall',
      'column',
      'deck',
      'curb',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'load_ticket_status') then
    create type load_ticket_status as enum ('accepted', 'rejected', 'pending');
  end if;

  if not exists (select 1 from pg_type where typname = 'qc_test_type') then
    create type qc_test_type as enum (
      'slump',
      'air',
      'temperature',
      'unit_weight',
      'cylinders',
      'break',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'issue_category') then
    create type issue_category as enum (
      'delay',
      'rejected_load',
      'weather',
      'equipment',
      'finish',
      'safety',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'issue_severity') then
    create type issue_severity as enum ('low', 'medium', 'high', 'critical');
  end if;

  if not exists (select 1 from pg_type where typname = 'issue_status') then
    create type issue_status as enum ('open', 'resolved');
  end if;

  if not exists (select 1 from pg_type where typname = 'attachment_type') then
    create type attachment_type as enum (
      'photo',
      'delivery_ticket',
      'inspection_doc',
      'other'
    );
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.users
  where id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where id = auth.uid()
  limit 1
$$;

create or replace function public.has_any_role(allowed_roles user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = any(allowed_roles), false)
$$;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  role user_role not null,
  email text not null,
  full_name text not null,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, email)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  created_by_user_id uuid references public.users (id) on delete set null,
  updated_by_user_id uuid references public.users (id) on delete set null,
  name text not null,
  address text not null,
  status project_status not null default 'active',
  description text,
  project_code text,
  client_name text,
  general_contractor text,
  date_started date not null,
  estimated_completion_date date not null,
  last_pour_date date,
  total_concrete_poured numeric(12, 2) not null default 0,
  estimated_total_concrete numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, project_code)
);

create table if not exists public.project_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  full_name text not null,
  company_name text,
  role_title text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  foreman_name text,
  member_count integer not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, name)
);

create table if not exists public.mix_designs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  code text not null,
  name text not null,
  supplier_name text,
  specified_strength_psi integer,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, code)
);

create table if not exists public.pours (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  mix_design_id uuid references public.mix_designs (id) on delete set null,
  created_by_user_id uuid references public.users (id) on delete set null,
  updated_by_user_id uuid references public.users (id) on delete set null,
  scheduled_date date not null,
  placement_area_type placement_area_type not null default 'other',
  placement_area_label text not null,
  status pour_status not null default 'planned',
  unit text not null default 'cubic_yards',
  estimated_volume numeric(12, 2),
  actual_volume numeric(12, 2) not null default 0,
  delivered_volume numeric(12, 2) not null default 0,
  rejected_volume numeric(12, 2) not null default 0,
  accepted_load_count integer not null default 0,
  scheduled_start_at timestamptz,
  placement_start_at timestamptz,
  placement_end_at timestamptz,
  weather_notes text,
  delay_reason text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pour_assignments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  pour_id uuid not null references public.pours (id) on delete cascade,
  crew_id uuid references public.crews (id) on delete set null,
  user_id uuid references public.users (id) on delete set null,
  assignment_role text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pour_mix_requirements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  pour_id uuid not null references public.pours (id) on delete cascade,
  mix_design_id uuid not null references public.mix_designs (id) on delete cascade,
  target_volume numeric(12, 2),
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.load_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  pour_id uuid not null references public.pours (id) on delete cascade,
  created_by_user_id uuid references public.users (id) on delete set null,
  updated_by_user_id uuid references public.users (id) on delete set null,
  ticket_number text,
  supplier_name text,
  truck_identifier text,
  quantity numeric(12, 2) not null default 0,
  batch_time timestamptz,
  arrival_time timestamptz,
  discharge_start_at timestamptz,
  discharge_end_at timestamptz,
  status load_ticket_status not null default 'accepted',
  rejection_reason text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.qc_tests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  pour_id uuid not null references public.pours (id) on delete cascade,
  load_ticket_id uuid references public.load_tickets (id) on delete set null,
  technician_user_id uuid references public.users (id) on delete set null,
  test_type qc_test_type not null,
  sample_time timestamptz not null,
  slump_inches text,
  air_content_percent text,
  concrete_temperature_f text,
  ambient_weather_notes text,
  cylinder_count integer,
  cylinder_identifiers text,
  result_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  pour_id uuid references public.pours (id) on delete cascade,
  owner_user_id uuid references public.users (id) on delete set null,
  category issue_category not null,
  severity issue_severity not null default 'medium',
  status issue_status not null default 'open',
  summary text not null,
  notes text,
  resolution_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  report_date date not null,
  summary text,
  weather_summary text,
  created_by_user_id uuid references public.users (id) on delete set null,
  updated_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  pour_id uuid references public.pours (id) on delete cascade,
  uploaded_by_user_id uuid references public.users (id) on delete set null,
  original_file_name text not null,
  stored_file_name text not null,
  mime_type text not null,
  file_size_bytes bigint not null,
  storage_bucket text not null,
  storage_path text not null,
  attachment_type attachment_type not null,
  caption text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  pour_id uuid references public.pours (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action_type text not null,
  summary text not null,
  details_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.pour_status_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  pour_id uuid not null references public.pours (id) on delete cascade,
  changed_by_user_id uuid references public.users (id) on delete set null,
  from_status pour_status,
  to_status pour_status not null,
  reason text,
  changed_at timestamptz not null default timezone('utc', now())
);

create index if not exists users_company_id_idx on public.users (company_id);
create index if not exists users_role_idx on public.users (role);
create index if not exists projects_company_status_idx on public.projects (company_id, status);
create index if not exists projects_company_start_date_idx on public.projects (company_id, date_started);
create index if not exists pours_company_project_date_idx on public.pours (company_id, project_id, scheduled_date);
create index if not exists pours_company_status_date_idx on public.pours (company_id, status, scheduled_date);
create index if not exists load_tickets_company_pour_idx on public.load_tickets (company_id, pour_id);
create index if not exists load_tickets_company_project_idx on public.load_tickets (company_id, project_id);
create index if not exists qc_tests_company_pour_sample_idx on public.qc_tests (company_id, pour_id, sample_time);
create index if not exists issues_company_status_idx on public.issues (company_id, status);
create index if not exists daily_reports_company_project_date_idx on public.daily_reports (company_id, project_id, report_date);
create index if not exists attachments_company_project_idx on public.attachments (company_id, project_id);
create index if not exists attachments_storage_path_idx on public.attachments (storage_bucket, storage_path);
create index if not exists audit_events_company_project_idx on public.audit_events (company_id, project_id);
create index if not exists audit_events_company_created_at_idx on public.audit_events (company_id, created_at desc);
create index if not exists pour_status_history_company_pour_changed_at_idx on public.pour_status_history (company_id, pour_id, changed_at desc);

create or replace function public.log_audit_event(
  p_company_id uuid,
  p_project_id uuid,
  p_pour_id uuid,
  p_entity_type text,
  p_entity_id uuid,
  p_action_type text,
  p_summary text,
  p_details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_events (
    company_id,
    project_id,
    pour_id,
    actor_user_id,
    entity_type,
    entity_id,
    action_type,
    summary,
    details_json
  )
  values (
    p_company_id,
    p_project_id,
    p_pour_id,
    auth.uid(),
    p_entity_type,
    p_entity_id,
    p_action_type,
    p_summary,
    coalesce(p_details, '{}'::jsonb)
  );
end;
$$;

create or replace function public.refresh_pour_rollups(p_pour_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivered numeric(12, 2);
  v_rejected numeric(12, 2);
  v_accepted_load_count integer;
begin
  select
    coalesce(sum(case when status <> 'rejected' then quantity else 0 end), 0),
    coalesce(sum(case when status = 'rejected' then quantity else 0 end), 0),
    count(*) filter (where status <> 'rejected')
  into v_delivered, v_rejected, v_accepted_load_count
  from public.load_tickets
  where pour_id = p_pour_id;

  update public.pours
  set
    delivered_volume = coalesce(v_delivered, 0),
    rejected_volume = coalesce(v_rejected, 0),
    accepted_load_count = coalesce(v_accepted_load_count, 0),
    actual_volume = greatest(coalesce(actual_volume, 0), coalesce(v_delivered, 0)),
    updated_at = timezone('utc', now())
  where id = p_pour_id;
end;
$$;

create or replace function public.refresh_project_rollups(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(12, 2);
  v_last_pour date;
begin
  select
    coalesce(sum(actual_volume), 0),
    max(scheduled_date)
  into v_total, v_last_pour
  from public.pours
  where project_id = p_project_id
    and status <> 'cancelled';

  update public.projects
  set
    total_concrete_poured = coalesce(v_total, 0),
    last_pour_date = v_last_pour,
    updated_at = timezone('utc', now())
  where id = p_project_id;
end;
$$;

create or replace function public.log_pour_status_transition()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    insert into public.pour_status_history (
      company_id,
      pour_id,
      changed_by_user_id,
      from_status,
      to_status,
      reason
    )
    values (
      new.company_id,
      new.id,
      auth.uid(),
      case when tg_op = 'INSERT' then null else old.status end,
      new.status,
      new.delay_reason
    );
  end if;

  return new;
end;
$$;

create or replace function public.sync_project_rollups_from_pour()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_project_id uuid;
begin
  target_project_id = coalesce(new.project_id, old.project_id);
  perform public.refresh_project_rollups(target_project_id);
  return coalesce(new, old);
end;
$$;

create or replace function public.sync_pour_and_project_rollups_from_ticket()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_pour_id uuid;
  target_project_id uuid;
begin
  target_pour_id = coalesce(new.pour_id, old.pour_id);
  target_project_id = coalesce(new.project_id, old.project_id);
  perform public.refresh_pour_rollups(target_pour_id);
  perform public.refresh_project_rollups(target_project_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists companies_set_updated_at on public.companies;
create trigger companies_set_updated_at before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists project_contacts_set_updated_at on public.project_contacts;
create trigger project_contacts_set_updated_at before update on public.project_contacts
for each row execute function public.set_updated_at();

drop trigger if exists crews_set_updated_at on public.crews;
create trigger crews_set_updated_at before update on public.crews
for each row execute function public.set_updated_at();

drop trigger if exists mix_designs_set_updated_at on public.mix_designs;
create trigger mix_designs_set_updated_at before update on public.mix_designs
for each row execute function public.set_updated_at();

drop trigger if exists pours_set_updated_at on public.pours;
create trigger pours_set_updated_at before update on public.pours
for each row execute function public.set_updated_at();

drop trigger if exists pour_assignments_set_updated_at on public.pour_assignments;
create trigger pour_assignments_set_updated_at before update on public.pour_assignments
for each row execute function public.set_updated_at();

drop trigger if exists pour_mix_requirements_set_updated_at on public.pour_mix_requirements;
create trigger pour_mix_requirements_set_updated_at before update on public.pour_mix_requirements
for each row execute function public.set_updated_at();

drop trigger if exists load_tickets_set_updated_at on public.load_tickets;
create trigger load_tickets_set_updated_at before update on public.load_tickets
for each row execute function public.set_updated_at();

drop trigger if exists qc_tests_set_updated_at on public.qc_tests;
create trigger qc_tests_set_updated_at before update on public.qc_tests
for each row execute function public.set_updated_at();

drop trigger if exists issues_set_updated_at on public.issues;
create trigger issues_set_updated_at before update on public.issues
for each row execute function public.set_updated_at();

drop trigger if exists daily_reports_set_updated_at on public.daily_reports;
create trigger daily_reports_set_updated_at before update on public.daily_reports
for each row execute function public.set_updated_at();

drop trigger if exists attachments_set_updated_at on public.attachments;
create trigger attachments_set_updated_at before update on public.attachments
for each row execute function public.set_updated_at();

drop trigger if exists pours_status_history_trigger on public.pours;
create trigger pours_status_history_trigger
after insert or update of status on public.pours
for each row execute function public.log_pour_status_transition();

drop trigger if exists pours_rollups_trigger on public.pours;
create trigger pours_rollups_trigger
after insert or update or delete on public.pours
for each row execute function public.sync_project_rollups_from_pour();

drop trigger if exists load_tickets_rollups_trigger on public.load_tickets;
create trigger load_tickets_rollups_trigger
after insert or update or delete on public.load_tickets
for each row execute function public.sync_pour_and_project_rollups_from_ticket();

alter table public.companies enable row level security;
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_contacts enable row level security;
alter table public.crews enable row level security;
alter table public.mix_designs enable row level security;
alter table public.pours enable row level security;
alter table public.pour_assignments enable row level security;
alter table public.pour_mix_requirements enable row level security;
alter table public.load_tickets enable row level security;
alter table public.qc_tests enable row level security;
alter table public.issues enable row level security;
alter table public.daily_reports enable row level security;
alter table public.attachments enable row level security;
alter table public.audit_events enable row level security;
alter table public.pour_status_history enable row level security;

create policy "users_select_own_company" on public.users
for select to authenticated
using (company_id = public.current_company_id());

create policy "users_update_self_or_admin" on public.users
for update to authenticated
using (
  company_id = public.current_company_id()
  and (id = auth.uid() or public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role]))
)
with check (company_id = public.current_company_id());

create policy "projects_read" on public.projects
for select to authenticated
using (company_id = public.current_company_id());

create policy "projects_write" on public.projects
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
);

create policy "project_contacts_read" on public.project_contacts
for select to authenticated
using (company_id = public.current_company_id());

create policy "project_contacts_write" on public.project_contacts
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
);

create policy "crews_read" on public.crews
for select to authenticated
using (company_id = public.current_company_id());

create policy "crews_write" on public.crews
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
);

create policy "mix_designs_read" on public.mix_designs
for select to authenticated
using (company_id = public.current_company_id());

create policy "mix_designs_write" on public.mix_designs
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array['dispatcher_admin'::user_role, 'project_manager'::user_role])
);

create policy "pours_read" on public.pours
for select to authenticated
using (company_id = public.current_company_id());

create policy "pours_write" on public.pours
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
);

create policy "pour_assignments_read" on public.pour_assignments
for select to authenticated
using (company_id = public.current_company_id());

create policy "pour_assignments_write" on public.pour_assignments
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
);

create policy "pour_mix_requirements_read" on public.pour_mix_requirements
for select to authenticated
using (company_id = public.current_company_id());

create policy "pour_mix_requirements_write" on public.pour_mix_requirements
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role
  ])
);

create policy "load_tickets_read" on public.load_tickets
for select to authenticated
using (company_id = public.current_company_id());

create policy "load_tickets_write" on public.load_tickets
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
);

create policy "qc_tests_read" on public.qc_tests
for select to authenticated
using (company_id = public.current_company_id());

create policy "qc_tests_write" on public.qc_tests
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'qc_technician'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'qc_technician'::user_role
  ])
);

create policy "issues_read" on public.issues
for select to authenticated
using (company_id = public.current_company_id());

create policy "issues_write" on public.issues
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
);

create policy "daily_reports_read" on public.daily_reports
for select to authenticated
using (company_id = public.current_company_id());

create policy "daily_reports_write" on public.daily_reports
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role
  ])
);

create policy "attachments_read" on public.attachments
for select to authenticated
using (company_id = public.current_company_id());

create policy "attachments_write" on public.attachments
for all to authenticated
using (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
)
with check (
  company_id = public.current_company_id()
  and public.has_any_role(array[
    'dispatcher_admin'::user_role,
    'project_manager'::user_role,
    'field_superintendent'::user_role
  ])
);

create policy "audit_events_read" on public.audit_events
for select to authenticated
using (company_id = public.current_company_id());

create policy "pour_status_history_read" on public.pour_status_history
for select to authenticated
using (company_id = public.current_company_id());

insert into storage.buckets (id, name, public)
values ('project-attachments', 'project-attachments', false)
on conflict (id) do nothing;

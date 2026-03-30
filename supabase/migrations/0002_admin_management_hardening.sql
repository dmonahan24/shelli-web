alter table public.companies
add column if not exists is_active boolean not null default true;

create index if not exists companies_is_active_idx on public.companies (is_active);

create table if not exists public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_platform_admin_id uuid not null references public.platform_admins (id) on delete cascade,
  target_auth_user_id uuid,
  target_company_id uuid references public.companies (id) on delete set null,
  action_type text not null,
  summary text not null,
  before_details_json jsonb not null default '{}'::jsonb,
  after_details_json jsonb not null default '{}'::jsonb,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists admin_audit_events_actor_created_at_idx
  on public.admin_audit_events (actor_platform_admin_id, created_at desc);

create index if not exists admin_audit_events_target_company_created_at_idx
  on public.admin_audit_events (target_company_id, created_at desc);

create index if not exists admin_audit_events_target_auth_user_created_at_idx
  on public.admin_audit_events (target_auth_user_id, created_at desc);

alter table public.admin_audit_events enable row level security;

drop policy if exists "admin_audit_events_manage" on public.admin_audit_events;
create policy "admin_audit_events_manage" on public.admin_audit_events
for all to authenticated
using (public.current_is_platform_admin())
with check (public.current_is_platform_admin());

drop policy if exists "admin_audit_events_read" on public.admin_audit_events;
create policy "admin_audit_events_read" on public.admin_audit_events
for select to authenticated
using (public.current_is_platform_admin());

do $$
begin
  if not exists (select 1 from pg_type where typname = 'access_request_status') then
    create type access_request_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create table if not exists public.platform_admins (
  id uuid primary key,
  email text not null,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email text not null,
  full_name text not null,
  status access_request_status not null default 'pending',
  requested_at timestamptz not null default timezone('utc', now()),
  resolved_at timestamptz,
  resolved_by_platform_admin_id uuid references public.platform_admins (id) on delete set null,
  target_company_id uuid references public.companies (id) on delete set null,
  target_role user_role,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (auth_user_id)
);

create unique index if not exists platform_admins_email_idx on public.platform_admins (email);
create index if not exists access_requests_status_idx on public.access_requests (status);
create index if not exists access_requests_requested_at_idx on public.access_requests (requested_at desc);
create index if not exists access_requests_target_company_id_idx on public.access_requests (target_company_id);

create or replace function public.current_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where id = auth.uid()
      and is_active = true
  )
$$;

drop trigger if exists platform_admins_set_updated_at on public.platform_admins;
create trigger platform_admins_set_updated_at before update on public.platform_admins
for each row execute function public.set_updated_at();

drop trigger if exists access_requests_set_updated_at on public.access_requests;
create trigger access_requests_set_updated_at before update on public.access_requests
for each row execute function public.set_updated_at();

alter table public.platform_admins enable row level security;
alter table public.access_requests enable row level security;
alter table public.companies enable row level security;
alter table public.users enable row level security;

drop policy if exists "companies_select_current_or_platform_admin" on public.companies;
create policy "companies_select_current_or_platform_admin" on public.companies
for select to authenticated
using (
  id = public.current_company_id()
  or public.current_is_platform_admin()
);

drop policy if exists "companies_platform_admin_manage" on public.companies;
create policy "companies_platform_admin_manage" on public.companies
for all to authenticated
using (public.current_is_platform_admin())
with check (public.current_is_platform_admin());

drop policy if exists "users_platform_admin_manage" on public.users;
create policy "users_platform_admin_manage" on public.users
for all to authenticated
using (public.current_is_platform_admin())
with check (public.current_is_platform_admin());

drop policy if exists "platform_admins_select_self_or_platform_admin" on public.platform_admins;
create policy "platform_admins_select_self_or_platform_admin" on public.platform_admins
for select to authenticated
using (
  id = auth.uid()
  or public.current_is_platform_admin()
);

drop policy if exists "platform_admins_manage" on public.platform_admins;
create policy "platform_admins_manage" on public.platform_admins
for all to authenticated
using (public.current_is_platform_admin())
with check (public.current_is_platform_admin());

drop policy if exists "access_requests_manage" on public.access_requests;
create policy "access_requests_manage" on public.access_requests
for all to authenticated
using (public.current_is_platform_admin())
with check (public.current_is_platform_admin());

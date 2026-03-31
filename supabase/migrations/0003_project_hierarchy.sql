do $$
begin
  create type floor_type as enum ('foundation', 'ground', 'standard', 'basement', 'roof', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type pour_category as enum (
    'footings',
    'grade_beams',
    'slab',
    'columns',
    'shear_walls',
    'core_walls',
    'stairs',
    'elevator_pit',
    'deck',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type pour_type_status as enum ('not_started', 'in_progress', 'completed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.project_buildings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  code text,
  description text,
  display_order integer not null default 0,
  estimated_concrete_total numeric(12, 2) not null default 0,
  actual_concrete_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint project_buildings_estimated_concrete_total_non_negative check (estimated_concrete_total >= 0),
  constraint project_buildings_actual_concrete_total_non_negative check (actual_concrete_total >= 0),
  constraint project_buildings_display_order_non_negative check (display_order >= 0)
);

create unique index if not exists project_buildings_project_name_idx
  on public.project_buildings (project_id, name);

create index if not exists project_buildings_project_id_idx
  on public.project_buildings (project_id);

create index if not exists project_buildings_company_id_idx
  on public.project_buildings (company_id);

create index if not exists project_buildings_project_display_order_idx
  on public.project_buildings (project_id, display_order);

create unique index if not exists project_buildings_id_project_company_idx
  on public.project_buildings (id, project_id, company_id);

create unique index if not exists project_buildings_id_project_idx
  on public.project_buildings (id, project_id);

create table if not exists public.building_floors (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  building_id uuid not null references public.project_buildings (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  floor_type floor_type not null,
  level_number integer,
  display_order integer not null default 0,
  estimated_concrete_total numeric(12, 2) not null default 0,
  actual_concrete_total numeric(12, 2) not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint building_floors_estimated_concrete_total_non_negative check (estimated_concrete_total >= 0),
  constraint building_floors_actual_concrete_total_non_negative check (actual_concrete_total >= 0),
  constraint building_floors_display_order_non_negative check (display_order >= 0),
  constraint building_floors_standard_level_required check (
    (floor_type = 'standard' and level_number is not null and level_number > 0)
    or (floor_type <> 'standard')
  ),
  constraint building_floors_project_building_company_fk foreign key (building_id, project_id, company_id)
    references public.project_buildings (id, project_id, company_id)
    on delete cascade
);

create unique index if not exists building_floors_building_name_idx
  on public.building_floors (building_id, name);

create index if not exists building_floors_building_id_idx
  on public.building_floors (building_id);

create index if not exists building_floors_building_display_order_idx
  on public.building_floors (building_id, display_order);

create index if not exists building_floors_building_floor_type_idx
  on public.building_floors (building_id, floor_type);

create unique index if not exists building_floors_foundation_unique_idx
  on public.building_floors (building_id)
  where floor_type = 'foundation';

create unique index if not exists building_floors_ground_unique_idx
  on public.building_floors (building_id)
  where floor_type = 'ground';

create unique index if not exists building_floors_standard_level_unique_idx
  on public.building_floors (building_id, level_number)
  where floor_type = 'standard';

create unique index if not exists building_floors_id_building_project_company_idx
  on public.building_floors (id, building_id, project_id, company_id);

create table if not exists public.floor_pour_types (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  building_id uuid not null references public.project_buildings (id) on delete cascade,
  floor_id uuid not null references public.building_floors (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  pour_category pour_category not null default 'other',
  estimated_concrete numeric(12, 2) not null default 0,
  actual_concrete numeric(12, 2) not null default 0,
  status pour_type_status not null default 'not_started',
  notes text,
  display_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint floor_pour_types_estimated_concrete_non_negative check (estimated_concrete >= 0),
  constraint floor_pour_types_actual_concrete_non_negative check (actual_concrete >= 0),
  constraint floor_pour_types_display_order_non_negative check (display_order >= 0),
  constraint floor_pour_types_floor_building_project_company_fk foreign key (floor_id, building_id, project_id, company_id)
    references public.building_floors (id, building_id, project_id, company_id)
    on delete cascade
);

create unique index if not exists floor_pour_types_floor_name_idx
  on public.floor_pour_types (floor_id, name);

create index if not exists floor_pour_types_floor_id_idx
  on public.floor_pour_types (floor_id);

create index if not exists floor_pour_types_floor_display_order_idx
  on public.floor_pour_types (floor_id, display_order);

create index if not exists floor_pour_types_project_status_idx
  on public.floor_pour_types (project_id, status);

create unique index if not exists floor_pour_types_id_floor_building_project_company_idx
  on public.floor_pour_types (id, floor_id, building_id, project_id, company_id);

drop trigger if exists project_buildings_set_updated_at on public.project_buildings;
create trigger project_buildings_set_updated_at before update on public.project_buildings
for each row execute function public.set_updated_at();

drop trigger if exists building_floors_set_updated_at on public.building_floors;
create trigger building_floors_set_updated_at before update on public.building_floors
for each row execute function public.set_updated_at();

drop trigger if exists floor_pour_types_set_updated_at on public.floor_pour_types;
create trigger floor_pour_types_set_updated_at before update on public.floor_pour_types
for each row execute function public.set_updated_at();

create or replace function public.refresh_project_rollups(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operational_total numeric(12, 2);
  v_last_pour date;
  v_hierarchy_count integer;
  v_hierarchy_estimated numeric(12, 2);
  v_hierarchy_actual numeric(12, 2);
begin
  select
    coalesce(sum(actual_volume), 0),
    max(scheduled_date)
  into v_operational_total, v_last_pour
  from public.pours
  where project_id = p_project_id
    and status <> 'cancelled';

  select
    count(*),
    coalesce(sum(estimated_concrete_total), 0),
    coalesce(sum(actual_concrete_total), 0)
  into v_hierarchy_count, v_hierarchy_estimated, v_hierarchy_actual
  from public.project_buildings
  where project_id = p_project_id;

  update public.projects
  set
    total_concrete_poured = case
      when coalesce(v_hierarchy_count, 0) > 0 then coalesce(v_hierarchy_actual, 0)
      else coalesce(v_operational_total, 0)
    end,
    estimated_total_concrete = case
      when coalesce(v_hierarchy_count, 0) > 0 then coalesce(v_hierarchy_estimated, 0)
      else estimated_total_concrete
    end,
    last_pour_date = v_last_pour,
    updated_at = timezone('utc', now())
  where id = p_project_id;
end;
$$;

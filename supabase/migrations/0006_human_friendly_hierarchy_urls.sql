create or replace function public.slugify_path_name(input text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      left(
        regexp_replace(
          regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        64
      ),
      ''
    ),
    'item'
  );
$$;

alter table public.projects add column if not exists slug text;
alter table public.project_buildings add column if not exists slug text;
alter table public.building_floors add column if not exists slug text;

with project_slug_candidates as (
  select
    id,
    company_id,
    public.slugify_path_name(name) as base_slug
  from public.projects
),
project_slug_ranked as (
  select
    id,
    case
      when row_number() over (partition by company_id, base_slug order by id) = 1 then base_slug
      else left(base_slug, 54) || '-' || row_number() over (partition by company_id, base_slug order by id)
    end as slug
  from project_slug_candidates
)
update public.projects
set slug = project_slug_ranked.slug
from project_slug_ranked
where public.projects.id = project_slug_ranked.id
  and public.projects.slug is null;

with building_slug_candidates as (
  select
    id,
    project_id,
    public.slugify_path_name(name) as base_slug
  from public.project_buildings
),
building_slug_ranked as (
  select
    id,
    case
      when row_number() over (partition by project_id, base_slug order by id) = 1 then base_slug
      else left(base_slug, 54) || '-' || row_number() over (partition by project_id, base_slug order by id)
    end as slug
  from building_slug_candidates
)
update public.project_buildings
set slug = building_slug_ranked.slug
from building_slug_ranked
where public.project_buildings.id = building_slug_ranked.id
  and public.project_buildings.slug is null;

with floor_slug_candidates as (
  select
    id,
    building_id,
    public.slugify_path_name(name) as base_slug
  from public.building_floors
),
floor_slug_ranked as (
  select
    id,
    case
      when row_number() over (partition by building_id, base_slug order by id) = 1 then base_slug
      else left(base_slug, 54) || '-' || row_number() over (partition by building_id, base_slug order by id)
    end as slug
  from floor_slug_candidates
)
update public.building_floors
set slug = floor_slug_ranked.slug
from floor_slug_ranked
where public.building_floors.id = floor_slug_ranked.id
  and public.building_floors.slug is null;

alter table public.projects alter column slug set not null;
alter table public.project_buildings alter column slug set not null;
alter table public.building_floors alter column slug set not null;

create unique index if not exists projects_company_slug_idx
  on public.projects (company_id, slug);

create unique index if not exists project_buildings_project_slug_idx
  on public.project_buildings (project_id, slug);

create unique index if not exists building_floors_building_slug_idx
  on public.building_floors (building_id, slug);

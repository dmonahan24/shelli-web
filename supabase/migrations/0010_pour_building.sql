alter table public.pours
  add column if not exists building_id uuid references public.project_buildings (id) on delete set null;

create index if not exists pours_building_id_idx
  on public.pours (building_id);

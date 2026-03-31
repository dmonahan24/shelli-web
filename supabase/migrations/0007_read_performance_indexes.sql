create index if not exists projects_company_updated_at_idx
  on public.projects (company_id, updated_at desc);

create index if not exists attachments_company_project_created_at_idx
  on public.attachments (company_id, project_id, created_at desc);

create index if not exists activity_events_company_project_created_at_idx
  on public.activity_events (company_id, project_id, created_at desc);

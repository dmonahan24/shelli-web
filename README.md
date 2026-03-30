# Shelli

Shelli is a construction web app for tracking concrete pour projects. It gives field teams and operations staff a shared system for project setup, authentication, dashboard visibility, and concrete quantity tracking.

## What It Does

- Create and manage accounts with email/password authentication
- Sign in, sign out, request password resets, and complete reset flows
- View a protected dashboard with user-scoped projects
- Add new projects with validated dates and concrete totals
- Store project, session, and password reset data with Drizzle

## Stack

- TanStack Start
- Bun
- Drizzle ORM + Drizzle Kit
- Supabase Postgres + Supabase Auth + Supabase Storage
- shadcn/ui
- React Hook Form + Zod

## Current App Areas

- `/` marketing landing page
- `/auth/create-account`
- `/auth/sign-in`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/auth/pending-access`
- `/admin`
- `/admin/access-requests`
- `/admin/companies`
- `/dashboard`
- `/dashboard/projects`
- `/dashboard/settings`

## Project Structure

```txt
src/
  components/
    app-shell/
    auth/
    dashboard/
    projects/
    ui/
  db/
    schema/
    queries/
  lib/
    auth/
    env/
    supabase/
    utils/
    validation/
  supabase/
    migrations/
  routes/
    auth/
    dashboard/
  server/
    auth/
    projects/
```

## Environment Variables

Copy `.env.example` to `.env` and set Supabase values for the linked project.

```bash
SUPABASE_PROJECT_REF=blfhllxurhdsdforvnnk
SUPABASE_URL=https://blfhllxurhdsdforvnnk.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DIRECT_DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
SUPABASE_ATTACHMENTS_BUCKET=project-attachments
SESSION_SECRET=replace-with-a-long-random-secret
APP_URL=http://localhost:3001
EMAIL_FROM=no-reply@concreteco.local
BOOTSTRAP_PLATFORM_ADMIN_EMAIL=platform-admin@shelli.local
BOOTSTRAP_PLATFORM_ADMIN_PASSWORD=password123
BOOTSTRAP_PLATFORM_ADMIN_FULL_NAME=Platform Admin
# Optional: also provision the platform admin as a tenant user
# BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME=Shelli Internal Ops
# BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG=shelli-internal
# BOOTSTRAP_PLATFORM_ADMIN_COMPANY_ROLE=dispatcher_admin
BOOTSTRAP_DEMO_COMPANY_NAME=Bedrock Build Co.
BOOTSTRAP_DEMO_COMPANY_SLUG=bedrock-build
BOOTSTRAP_DEMO_ADMIN_EMAIL=demo@bedrockbuild.com
BOOTSTRAP_DEMO_ADMIN_PASSWORD=password123
BOOTSTRAP_DEMO_ADMIN_FULL_NAME=Demo Dispatcher
LEGACY_SQLITE_URL=./data/concrete-pours.sqlite
```

Notes:

- Bun automatically reads `.env`
- Supabase Auth is now the source of truth for user identity and password recovery
- Self-service signup is intentionally disabled; bootstrap or platform-admin provisioning is required
- If `BOOTSTRAP_PLATFORM_ADMIN_COMPANY_NAME` and `BOOTSTRAP_PLATFORM_ADMIN_COMPANY_SLUG` are set, `bun run db:bootstrap` also creates a tenant `users` row for that same platform-admin auth identity

## Getting Started

Install dependencies:

```bash
bun install
```

Generate the database migration:

```bash
bun run db:generate
```

Apply Supabase SQL migrations:

```bash
bun run db:migrate
```

Bootstrap the first platform admin plus the demo tenant company/admin:

```bash
bun run db:bootstrap
```

Seed demo operational data:

```bash
bun run db:seed
```

Import the legacy SQLite dataset into Supabase:

```bash
bun run db:migrate-legacy
```

Start the development server:

```bash
bun run dev
```

The app runs at `http://localhost:3001`.

## Bootstrap Accounts

After `bun run db:bootstrap`, you can sign in with:

- Platform Admin
  - Email: `platform-admin@shelli.local`
  - Password: `password123`
- Demo Tenant Admin
  - Email: `demo@bedrockbuild.com`
  - Password: `password123`

If you override the bootstrap env vars, those credentials change with them.

## Scripts

- `bun run dev` starts the local TanStack Start dev server
- `bun run build` creates a production build
- `bun run start` starts the production server
- `bun run typecheck` runs TypeScript checks
- `bun test` runs the Bun test suite
- `bun run db:generate` generates Drizzle migrations
- `bun run db:migrate` applies Drizzle migrations
- `bun run db:bootstrap` provisions the first platform admin plus the demo tenant company/admin in Supabase
- `bun run db:seed` seeds demo data
- `bun run db:migrate-legacy` migrates the legacy SQLite dataset into Supabase

## Testing

The project currently includes Bun tests for:

- auth validation
- project validation
- password hashing helpers
- reset-token and rate-limit behavior
- project query scoping

Run them with:

```bash
bun test
```

## Build Notes

This app currently runs on the TanStack Start + Vinxi generation already present in the repository. The dependency versions are pinned to keep the build stable on this stack.

## License

This project is available under the [MIT License](LICENSE).

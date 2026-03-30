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
- SQLite for local development, with the data layer structured to move to Postgres later
- shadcn/ui
- React Hook Form + Zod

## Current App Areas

- `/` marketing landing page
- `/auth/create-account`
- `/auth/sign-in`
- `/auth/forgot-password`
- `/auth/reset-password`
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
    migrations/
  lib/
    auth/
    env/
    utils/
    validation/
  routes/
    auth/
    dashboard/
  server/
    auth/
    projects/
```

## Environment Variables

Copy `.env.example` to `.env` and set values as needed.

```bash
DATABASE_URL=./data/concrete-pours.sqlite
SESSION_SECRET=replace-with-a-long-random-secret
APP_URL=http://localhost:3001
EMAIL_FROM=no-reply@concreteco.local
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_SECURE=false
```

Notes:

- Bun automatically reads `.env`
- If SMTP is not configured, password reset emails are logged locally instead of being sent

## Getting Started

Install dependencies:

```bash
bun install
```

Generate the database migration:

```bash
bun run db:generate
```

Apply migrations:

```bash
bun run db:migrate
```

Seed local demo data:

```bash
bun run db:seed
```

Start the development server:

```bash
bun run dev
```

The app runs at `http://localhost:3001`.

## Demo Account

After seeding local data, you can sign in with:

- Email: `demo@bedrockbuild.com`
- Password: `password123`

## Scripts

- `bun run dev` starts the local TanStack Start dev server
- `bun run build` creates a production build
- `bun run start` starts the production server
- `bun run typecheck` runs TypeScript checks
- `bun test` runs the Bun test suite
- `bun run db:generate` generates Drizzle migrations
- `bun run db:migrate` applies Drizzle migrations
- `bun run db:seed` seeds demo data

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

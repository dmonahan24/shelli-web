# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.



## Purpose

This repository is for a web application that tracks concrete pours for a construction company. The app should help field crews, project managers, quality control staff, and back-office admins coordinate pours, document what happened, and produce trustworthy records.

Build with:

- TanStack Start
- Bun
- shadcn/ui
- Drizzle ORM

Assume this is a greenfield codebase unless existing files indicate otherwise.

## Product Intent

The app is not a generic task tracker. It is an operations system for concrete placement work. Every feature should support one or more of these outcomes:

- Plan upcoming pours
- Capture field data during and after a pour
- Track concrete quantities, timing, and placement status
- Record quality-control information and issues
- Provide a clear audit trail for disputes, billing, and internal review

Optimize for speed, clarity, and reliability in messy real-world field conditions.

## Primary Users

- Field Superintendent: needs a fast way to see today’s pours, status, crew notes, and blockers
- Project Manager: needs schedule visibility, risk tracking, and progress reporting
- QC / Testing Technician: needs mix, slump, air, temperature, cylinders, and test record capture
- Dispatcher / Operations Admin: needs project setup, schedule coordination, and clean records
- Executive / Owner: needs summaries, production trends, and exceptions

## Core Domain Language

Use consistent terminology in code and UI.

- Project: a construction jobsite or contract
- Pour: a specific concrete placement event
- Placement Area: slab, footing, wall, column, deck, curb, etc.
- Mix Design: the approved concrete mix specification
- Load / Ticket: a delivered truckload associated with a pour
- Batch Time: when the concrete was batched
- Arrival Time: when the truck arrived onsite
- Placement Start / End: when concrete placement began and ended
- QC Test: slump, air, temperature, unit weight, cylinders, breaks, or related checks
- Issue: delay, rejected load, weather event, equipment problem, finish problem, or safety concern

Do not mix domain terms casually. Prefer explicit names like `pourStatus`, `mixDesignId`, `placementStartAt`, and `ticketNumber`.

## North Star Principles

- Field-first: workflows must work on phones and tablets before they work beautifully on desktop
- Fast capture beats perfect capture: let users enter partial data and complete it later
- Auditability matters: preserve timestamps, actor identity, and meaningful status transitions
- Operational clarity over cleverness: boring, readable code is preferred
- Strong defaults: choose safe patterns for validation, database writes, and authorization

## Recommended MVP

Prioritize these capabilities first:

1. Authentication and role-based access
2. Project management
3. Pour scheduling and status tracking
4. Pour detail view with notes, quantities, timestamps, and assigned crew
5. Ticket/load entry per pour
6. QC test entry per pour
7. Daily dashboard for active and upcoming pours
8. Basic reporting and export-ready summaries

Nice-to-have features after MVP:

- Photo attachments
- Weather history on pours
- Signature capture
- Offline-friendly draft entry
- Notifications and reminders
- Map/location awareness

## Technical Direction

### Frontend

- Use TanStack Start routing, server functions, and data loading patterns
- Keep route modules thin; push business logic into domain services
- Use shadcn/ui as the component baseline, but compose domain-specific components for key workflows
- Build responsive layouts that are truly usable on mobile jobsite devices

### Backend

- Use TanStack Start server functions for application-facing server logic
- Keep database access behind well-named service or repository modules
- Validate all external inputs at boundaries
- Prefer transactional writes for multi-record operations like creating a pour with loads or QC entries

### Database

- Use Drizzle schema definitions and migrations
- Default to PostgreSQL unless existing infrastructure requires something else
- Prefer explicit relational tables over JSON blobs for core operational records
- Include `createdAt`, `updatedAt`, and actor identifiers on important operational entities
- Use soft deletion only when business recovery or audit needs justify it

### Tooling

- Use Bun for package management, scripts, local development, and tests
- Do not mix Bun with npm, yarn, or pnpm lockfiles
- Prefer simple Bun-driven scripts for setup, dev, lint, test, and migration workflows

## Suggested App Structure

Use this as the default shape unless the repository already establishes a better one:

```txt
src/
  routes/
  components/
    ui/
    pours/
    projects/
    qc/
  lib/
    auth/
    db/
    validation/
    utils/
  domain/
    pours/
    projects/
    tickets/
    qc/
    reporting/
  server/
    services/
    repositories/
    policies/
drizzle/
```

Guidelines:

- `routes/` owns route composition and page-level loading
- `domain/` owns business rules and domain types
- `server/services/` owns use-case orchestration
- `server/repositories/` owns Drizzle query composition
- `components/ui/` is for shadcn primitives only
- Domain-specific UI belongs outside `components/ui/`

## Initial Data Model

Start with these tables unless product requirements force changes:

- `companies`
- `users`
- `projects`
- `project_contacts`
- `crews`
- `pours`
- `pour_assignments`
- `mix_designs`
- `pour_mix_requirements`
- `load_tickets`
- `qc_tests`
- `issues`
- `daily_reports`
- `field_notes`
- `attachments`

### Key Entity Expectations

#### projects

- Project number/code
- Name
- Client / general contractor
- Location
- Status
- Start and end dates

#### pours

- Project reference
- Scheduled date
- Placement area/type
- Status: `planned`, `ready`, `in_progress`, `completed`, `delayed`, `cancelled`
- Estimated and actual volume
- Scheduled start and actual start/end timestamps
- Crew assignment
- Mix design reference
- Notes and delay reasons

#### load_tickets

- Pour reference
- Ticket number
- Supplier
- Truck identifier
- Quantity
- Batch time
- Arrival time
- Discharge start/end
- Accepted / rejected status
- Rejection reason

#### qc_tests

- Pour reference
- Optional load ticket reference
- Test type
- Sample time
- Slump
- Air
- Concrete temperature
- Ambient weather notes
- Cylinder count / identifiers
- Technician

#### issues

- Project and/or pour reference
- Category
- Severity
- Open / resolved status
- Summary
- Detailed notes
- Owner
- Resolution notes

#### field_notes

Append-only log of standalone jobsite notes, captured in field mode without
requiring a pour. One row per note so each keeps its own author and timestamp.

- Project reference
- Note text
- Author and created timestamp

Distinct from `daily_reports`, which is a single editable summary document per
project per day. Notes that belong to a pour still live on the pour itself.

## UX Expectations

- The daily pours view is a mission-critical screen; optimize it for scanning and quick updates
- Use status chips, timeline cues, and high-signal summaries instead of dense prose
- Favor form sections that mirror field workflows: schedule, crew, mix, loads, QC, issues, notes
- Confirm destructive or status-finalizing actions clearly
- Avoid modal-heavy flows on mobile
- Keep tap targets large and forms resilient to interruption

## TanStack Start Guidance

- Prefer route-level loaders for page bootstrapping data
- Use server functions for mutations and sensitive reads
- Keep loader/action logic small by delegating to domain services
- Co-locate route-specific types only when they are not shared domain concepts
- Use optimistic UI only when rollback is easy and user confusion is low

## shadcn/ui Guidance

- Use shadcn/ui for foundational components, not as the app’s entire design language
- Create reusable domain components like `PourStatusBadge`, `LoadTicketTable`, and `QcTestEntryForm`
- Standardize form patterns across the app
- Prefer composable tables/cards/filters over one-off dashboard widgets

## Drizzle Guidance

- Keep schema naming consistent and predictable
- Use enums carefully; prefer database enums only for stable, truly bounded sets
- Add indexes for the queries the app will actually run:
  - pours by project and scheduled date
  - pours by status and date
  - load tickets by pour
  - qc tests by pour and sample time
- Wrap multi-step operational writes in transactions
- Keep migrations reviewable and small

## Bun Guidance

- Standardize on Bun commands such as `bun install`, `bun dev`, `bun test`, and `bun run <script>`
- Keep local developer workflows fast and low-friction
- Prefer explicit scripts in `package.json` for common tasks rather than tribal knowledge

## Validation and Security

- Validate all server inputs
- Never trust client-supplied role or company scope data
- Enforce tenant/company scoping on every sensitive query
- Record who changed important records and when
- Treat attachments and exported reports as sensitive construction records

## Coding Standards

- Use TypeScript throughout
- Prefer explicit types at domain boundaries
- Keep functions short and single-purpose
- Avoid hidden side effects
- Favor composition over inheritance
- Write code for the next engineer on call at 6:00 AM

## Testing Priorities

Focus tests on business risk, not trivial rendering.

- Unit tests for status transition rules and calculation logic
- Integration tests for create/update flows around pours, tickets, and QC records
- Authorization tests for role and company scoping
- Smoke tests for critical routes

Key logic that deserves tests early:

- Pour status transitions
- Volume and delivered quantity calculations
- Ticket rejection handling
- QC record association with pours and loads
- Reporting filters by date/project/status

## Performance Expectations

- Keep dashboard and daily view queries lean
- Paginate or virtualize heavy historical tables
- Avoid N+1 queries in project and pour detail views
- Cache only where correctness and freshness are not compromised

## Operational Reporting

Design reporting so the business can answer:

- What pours are scheduled today and this week?
- Which pours are delayed or at risk?
- How much concrete was placed by project, day, and crew?
- Which loads were rejected and why?
- Which QC tests failed or require follow-up?

## Definition of Done

A feature is not done until:

- It matches the concrete-pour domain language
- It works on mobile and desktop
- It validates inputs on the server
- It handles loading, empty, and error states
- It has the right authorization boundaries
- It includes tests for important business behavior
- It is simple enough for another agent to extend safely

## Working Agreement for Future Agents

- Do not introduce unnecessary infrastructure before the MVP needs it
- Do not hide core business logic inside route files or UI components
- Do not model critical operational data as unstructured text if it should be queryable
- When requirements are ambiguous, choose the option that improves auditability and field usability
- If you add a new domain concept, update this file if it changes the mental model of the app

## First Build Sequence

When bootstrapping from scratch, follow this order:

1. Scaffold TanStack Start with Bun
2. Set up shadcn/ui and base styling tokens
3. Configure Drizzle, database connection, and migrations
4. Add auth and role scaffolding
5. Implement core schema for projects, pours, load tickets, and QC tests
6. Build the daily pours dashboard
7. Build create/edit pour flows
8. Add load ticket and QC entry workflows
9. Add reporting
10. Harden authorization, validation, and tests

## Final Note

This app will be used in active construction operations. Favor clarity, resilience, and trustworthy records over novelty.

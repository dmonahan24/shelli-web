# Hierarchical Project Structure Plan

## Purpose

This is the next Codex-ready implementation section for adding a formal project hierarchy:

- `Project`
- `Building`
- `Floor`
- `Pour Type`

The goal is to support structural planning and structural actual concrete tracking without letting totals drift across multiple editable screens. All hierarchy mutations, protected reads, and roll-up recalculations should stay server-side.

## Current Repo Baseline

The current codebase already has the right foundations for this work:

- TanStack Start file routes with route loaders in `src/routes/dashboard/projects/$projectId.tsx`
- server function wrappers such as `src/server/projects/get-project-detail.ts`
- shared service-layer business logic in `src/server/projects/service.ts`
- Drizzle schema modules under `src/db/schema/`
- project totals already stored on `projects.estimatedTotalConcrete` and `projects.totalConcretePoured`
- activity logging through `src/server/activity/service.ts`
- shadcn/ui table primitives plus a reusable TanStack Table wrapper in `src/components/ui/data-table.tsx`

Important existing constraint: project totals are still editable from the project form today through `src/lib/validation/project.ts`, `src/components/projects/project-form.tsx`, and `src/server/projects/service.ts`. This hierarchy rollout needs an explicit source-of-truth transition so project totals stop being maintained in two places.

## Non-Negotiable Decisions

### 1. Server-side hierarchy ownership

Use TanStack Start server functions and protected route loaders for every hierarchy read/write path.

- Route loaders stay thin and call server functions.
- Server functions stay thin and call service functions.
- Services own validation, authorization, parent-child checks, transactions, and roll-ups.

### 2. Explicit Drizzle hierarchy model

Model the hierarchy with normalized tables and Drizzle relations.

- `projects -> project_buildings`
- `project_buildings -> building_floors`
- `building_floors -> floor_pour_types`

### 3. Roll-ups are derived only

Never let the UI compute and persist totals ad hoc.

- `floor.estimatedConcreteTotal = sum(floor_pour_types.estimatedConcrete)`
- `floor.actualConcreteTotal = sum(floor_pour_types.actualConcrete)`
- `building.estimatedConcreteTotal = sum(building_floors.estimatedConcreteTotal)`
- `building.actualConcreteTotal = sum(building_floors.actualConcreteTotal)`
- `project.estimatedTotalConcrete = sum(project_buildings.estimatedConcreteTotal)`
- `project.totalConcretePoured = sum(project_buildings.actualConcreteTotal)`

### 4. Structural actuals stay distinct from operational pours

For this phase, `floor_pour_types.actualConcrete` is the source of truth for hierarchy actual totals.

- Do not silently mix hierarchy actuals with `pours.actualVolume` or `pours.deliveredVolume`.
- If operational pours should sync into hierarchy actuals later, add an explicit mapping workflow in a separate phase.

## Recommended File Additions

### Database

- `src/db/schema/hierarchy.ts`
- `src/db/schema/index.ts` export update
- generated migration under `supabase/migrations/`

### Validation

- `src/lib/validation/building.ts`
- `src/lib/validation/floor.ts`
- `src/lib/validation/pour-type.ts`
- `src/lib/validation/hierarchy.ts`

### Server functions

- `src/server/buildings/list-buildings-for-project.ts`
- `src/server/buildings/get-building-detail.ts`
- `src/server/buildings/create-building.ts`
- `src/server/buildings/update-building.ts`
- `src/server/buildings/delete-building.ts`
- `src/server/floors/list-floors-for-building.ts`
- `src/server/floors/get-floor-detail.ts`
- `src/server/floors/create-floor.ts`
- `src/server/floors/update-floor.ts`
- `src/server/floors/delete-floor.ts`
- `src/server/floors/bulk-create-floors.ts`
- `src/server/pour-types/list-pour-types-for-floor.ts`
- `src/server/pour-types/create-pour-type.ts`
- `src/server/pour-types/update-pour-type.ts`
- `src/server/pour-types/delete-pour-type.ts`

### Shared hierarchy services

- `src/server/hierarchy/recalculate-floor-totals.ts`
- `src/server/hierarchy/recalculate-building-totals.ts`
- `src/server/hierarchy/recalculate-project-totals.ts`
- `src/server/hierarchy/recalculate-from-floor.ts`
- `src/server/hierarchy/recalculate-from-pour-type.ts`

### Route files

- `src/routes/dashboard/projects/$projectId.buildings.index.tsx`
- `src/routes/dashboard/projects/$projectId.buildings.$buildingId.tsx`
- `src/routes/dashboard/projects/$projectId.buildings.$buildingId.edit.tsx`
- `src/routes/dashboard/projects/$projectId.buildings.$buildingId.floors.$floorId.tsx`
- `src/routes/dashboard/projects/$projectId.buildings.$buildingId.floors.$floorId.edit.tsx`

### UI components

- `src/components/hierarchy/project-buildings-section.tsx`
- `src/components/hierarchy/buildings-table.tsx`
- `src/components/hierarchy/building-summary-card.tsx`
- `src/components/hierarchy/building-detail-header.tsx`
- `src/components/hierarchy/building-summary-cards.tsx`
- `src/components/hierarchy/floors-table.tsx`
- `src/components/hierarchy/floor-detail-header.tsx`
- `src/components/hierarchy/floor-summary-cards.tsx`
- `src/components/hierarchy/pour-types-table.tsx`
- `src/components/hierarchy/hierarchy-breadcrumbs.tsx`
- `src/components/hierarchy/hierarchy-empty-state.tsx`
- `src/components/hierarchy/hierarchy-row-actions.tsx`
- `src/components/buildings/building-form.tsx`
- `src/components/buildings/add-building-dialog.tsx`
- `src/components/buildings/edit-building-dialog.tsx`
- `src/components/buildings/delete-building-dialog.tsx`
- `src/components/buildings/building-setup-wizard.tsx`
- `src/components/floors/floor-form.tsx`
- `src/components/floors/add-floor-dialog.tsx`
- `src/components/floors/edit-floor-dialog.tsx`
- `src/components/floors/delete-floor-dialog.tsx`
- `src/components/floors/bulk-create-floors-dialog.tsx`
- `src/components/floors/floor-quick-add-buttons.tsx`
- `src/components/pour-types/pour-type-form.tsx`
- `src/components/pour-types/add-pour-type-dialog.tsx`
- `src/components/pour-types/edit-pour-type-dialog.tsx`
- `src/components/pour-types/delete-pour-type-dialog.tsx`
- `src/components/pour-types/floor-preset-bundle-dialog.tsx`

## Phase 76. Introduce the Formal Hierarchy Model

Add structural planning records beneath each project:

- buildings belong to projects
- floors belong to buildings and projects
- pour types belong to floors, buildings, and projects

Planning and actual totals flow upward only from child records.

## Phase 77. Domain Language

Use these names consistently in schema, services, validation, and UI:

- `project`
- `building`
- `floor`
- `pourType`
- `floorType`
- `pourCategory`
- `estimatedConcrete`
- `actualConcrete`
- `estimatedConcreteTotal`
- `actualConcreteTotal`
- `displayOrder`
- `levelNumber`

Suggested floor labels:

- `foundation` -> `Foundation`
- `ground` -> `Ground Level`
- `standard + levelNumber=2` -> `Level 2`

## Phase 78. Protected Route Map

Add these protected routes first:

- `/dashboard/projects/$projectId/buildings`
- `/dashboard/projects/$projectId/buildings/$buildingId`
- `/dashboard/projects/$projectId/buildings/$buildingId/edit`
- `/dashboard/projects/$projectId/buildings/$buildingId/floors/$floorId`
- `/dashboard/projects/$projectId/buildings/$buildingId/floors/$floorId/edit`

Notes for this repo:

- Keep route loaders thin like `src/routes/dashboard/projects/$projectId.tsx`.
- Use route loaders for bootstrapping detail data.
- Use dialogs or sheets for create/edit/delete first, then keep detail pages for navigation and deep links.

## Phase 79. Database Schema

Create `src/db/schema/hierarchy.ts` with these new tables.

### `project_buildings`

- `id`
- `projectId`
- `companyId`
- `name`
- `code`
- `description`
- `displayOrder`
- `estimatedConcreteTotal`
- `actualConcreteTotal`
- `createdAt`
- `updatedAt`

### `building_floors`

- `id`
- `projectId`
- `buildingId`
- `companyId`
- `name`
- `floorType`
- `levelNumber`
- `displayOrder`
- `estimatedConcreteTotal`
- `actualConcreteTotal`
- `createdAt`
- `updatedAt`

### `floor_pour_types`

- `id`
- `projectId`
- `buildingId`
- `floorId`
- `companyId`
- `name`
- `pourCategory`
- `estimatedConcrete`
- `actualConcrete`
- `status`
- `notes`
- `displayOrder`
- `createdAt`
- `updatedAt`

Add matching Drizzle relations for:

- `projects -> many projectBuildings`
- `projectBuildings -> one project`
- `projectBuildings -> many buildingFloors`
- `buildingFloors -> one building`
- `buildingFloors -> many floorPourTypes`
- `floorPourTypes -> one floor`

## Phase 80. Constraints and Indexes

Use database-backed rules wherever possible.

### Enums

Add new enums in `src/db/schema/enums.ts`:

- `floorTypeEnum`: `foundation`, `ground`, `standard`, `basement`, `roof`, `other`
- `pourCategoryEnum`: `footings`, `grade_beams`, `slab`, `columns`, `shear_walls`, `core_walls`, `stairs`, `elevator_pit`, `deck`, `other`
- `pourTypeStatusEnum`: `not_started`, `in_progress`, `completed`

### Integrity rules

- all concrete fields must be non-negative
- `displayOrder` must be required on buildings, floors, and pour types
- `levelNumber` required when `floorType = standard`
- duplicate `Foundation` floors rejected per building
- duplicate `Ground Level` floors rejected per building
- duplicate standard `levelNumber` rejected per building
- duplicate floor names rejected per building
- duplicate pour-type names rejected per floor

### Indexes

- `project_buildings(project_id)`
- `project_buildings(company_id)`
- `project_buildings(project_id, display_order)`
- `building_floors(building_id)`
- `building_floors(building_id, display_order)`
- `building_floors(building_id, floor_type)`
- `floor_pour_types(floor_id)`
- `floor_pour_types(floor_id, display_order)`
- `floor_pour_types(project_id, status)`

## Phase 81. Roll-up Strategy

Create a single shared recalculation path and use it everywhere.

Required functions:

- `recalculateFloorTotals(floorId, tx?)`
- `recalculateBuildingTotals(buildingId, tx?)`
- `recalculateProjectTotals(projectId, tx?)`
- `recalculateHierarchyFromPourType({ floorId, buildingId, projectId }, tx?)`
- `recalculateHierarchyFromFloor({ buildingId, projectId }, tx?)`

Mutation contract:

1. write the target record
2. recalculate the affected parents
3. update `projects.estimatedTotalConcrete`
4. update `projects.totalConcretePoured`
5. commit the transaction

Do not duplicate this logic in route files, forms, or individual mutation handlers.

## Phase 82. Project Totals Cutover

This repo already exposes project totals in several places. The hierarchy rollout must explicitly realign them.

### Source-of-truth update

- `projects.estimatedTotalConcrete` becomes hierarchy-derived
- `projects.totalConcretePoured` becomes hierarchy-derived for this phase

### Impacted existing files

- `src/lib/validation/project.ts`
- `src/components/projects/project-form.tsx`
- `src/components/projects/edit-project-form.tsx`
- `src/server/projects/service.ts`
- `src/server/analytics/service.ts`
- `src/server/field/service.ts`

### Cutover rule

Once hierarchy management ships:

- remove or disable manual editing of project-level estimated concrete
- update project edit copy to explain that totals come from buildings/floors/pour types
- keep operational pour-event totals visually separate until a later explicit integration phase

## Phase 83. Add Buildings to Project Detail

Upgrade `src/routes/dashboard/projects/$projectId.tsx` to include:

- `Project Summary`
- `Buildings Overview`
- `Recent Pour Events`
- `Attachments`
- `Activity`

Create:

- `ProjectBuildingsSection`
- `ProjectBuildingsList`
- `BuildingSummaryCard`
- `AddBuildingDialog`
- `EditBuildingDialog`
- `DeleteBuildingDialog`

Required data on each building card:

- building name
- code
- floor count
- estimated concrete
- actual concrete
- remaining concrete
- contextual actions

## Phase 84. Building CRUD

Server responsibilities:

- verify project access
- derive company scope from the authenticated user and project lineage
- insert building with zero totals initially
- assign default `displayOrder` if omitted
- recalculate project totals
- record activity event

Delete behavior:

- show child floor count
- show child pour-type count
- show estimated/actual concrete affected
- hard delete allowed only after explicit confirmation

## Phase 85. Building Detail Page

Build `/dashboard/projects/$projectId/buildings/$buildingId` with:

- hierarchy breadcrumbs
- building detail header
- summary cards
- floor list/table
- actions for add floor, edit building, delete building

Summary cards:

- total floors
- estimated concrete
- actual concrete
- remaining concrete
- completed floors count
- in-progress floors count

## Phase 86. Floor Modeling Rules

Floors need more structure than a name field.

Required support:

- `Foundation`
- `Ground Level`
- `Level 2+`
- later-friendly support for `Basement`, `Roof`, `Other`

Data rules:

- store `name`, `floorType`, `levelNumber`, and `displayOrder`
- generate default labels from type + level number
- allow optional custom name override if needed
- sort by `displayOrder`, not only by `levelNumber`

## Phase 87. Floor CRUD

Add floor create/edit/delete with:

- floor type
- conditional level number
- optional custom name
- optional display order

Validation rules:

- only one foundation per building
- only one ground floor per building
- only one standard `levelNumber` per building
- standard levels require a positive level number
- default `displayOrder` assigned automatically if omitted

Delete behavior:

- warn about child pour types
- show concrete affected
- recalculate building and project totals in the same transaction

## Phase 88. Floor Detail Page

Build `/dashboard/projects/$projectId/buildings/$buildingId/floors/$floorId` with:

- breadcrumbs
- floor detail header
- summary cards
- pour-type table
- actions for add pour type, edit floor, delete floor

Summary cards:

- estimated concrete
- actual concrete
- remaining concrete
- total pours
- completed pours

## Phase 89. Pour Type CRUD

Add pour-type create/edit/delete with:

- name
- pour category
- estimated concrete
- actual concrete
- status
- notes
- display order

Validation rules:

- estimated and actual concrete must be non-negative
- status must be valid
- notes trimmed and bounded
- duplicate names rejected within the same floor

Delete behavior:

- confirmation required
- parent roll-ups recalculated immediately

## Phase 90. Shared Hierarchy Roll-up Services

Implementation detail for this repo:

- place these functions under `src/server/hierarchy/`
- accept `AppTransaction | AppDatabase` where helpful
- reuse the same transaction from CRUD services
- keep the calculation functions deterministic and side-effect-light except for the DB updates they own

Expected behavior:

- floor recalculation sums `floor_pour_types`
- building recalculation sums `building_floors`
- project recalculation sums `project_buildings`

## Phase 91. Hierarchy Query and Mutation Layer

Add explicit services for:

- `listBuildingsForProject(projectId)`
- `getBuildingDetail(buildingId)`
- `createBuilding(projectId, input)`
- `updateBuilding(buildingId, input)`
- `deleteBuilding(buildingId)`
- `listFloorsForBuilding(buildingId)`
- `getFloorDetail(floorId)`
- `createFloor(buildingId, input)`
- `updateFloor(floorId, input)`
- `deleteFloor(floorId)`
- `bulkCreateFloors(buildingId, input)`
- `listPourTypesForFloor(floorId)`
- `createPourType(floorId, input)`
- `updatePourType(pourTypeId, input)`
- `deletePourType(pourTypeId)`

Authorization rules:

- verify authenticated tenant membership
- verify project access on every loader and mutation
- derive lineage on the server
- reject cross-project or cross-company parent-child mismatches

## Phase 92. Hierarchy Navigation

Add natural drill-down navigation:

- project detail -> building detail -> floor detail

Use:

- breadcrumbs on building and floor pages
- linked cards on project detail
- linked rows in building/floor tables
- contextual row actions for edit/delete

## Phase 93. Roll-up Displays

Show totals at every level.

Required formula:

- `remainingConcrete = max(estimatedConcrete - actualConcrete, 0)`

Required displays:

- project
- building
- floor
- pour type

Reuse current formatting utilities where possible:

- `src/lib/utils/format.ts`
- `src/components/projects/remaining-concrete-badge.tsx`

## Phase 94. Hierarchy Tables

Use shadcn table primitives and TanStack Table patterns already present in the repo.

Buildings columns:

- name
- code
- floors count
- estimated concrete
- actual concrete
- remaining
- actions

Floors columns:

- floor name
- floor type
- level number
- pour types count
- estimated concrete
- actual concrete
- remaining
- actions

Pour types columns:

- name
- category
- status
- estimated concrete
- actual concrete
- remaining
- updated at
- actions

## Phase 95. Search, Sort, and Filter

Store list-state in route search params for the list-heavy screens.

Buildings:

- search by name/code
- sort by display order, name, estimated concrete, actual concrete

Floors:

- filter by floor type
- sort by display order, name, estimated concrete, actual concrete

Pour types:

- search by name/category/notes
- filter by status/category
- sort by display order, name, estimated concrete, actual concrete, updated at

## Phase 96. Fast Setup Helpers

After building creation, optionally guide the user into:

- add foundation
- add ground level
- add levels 2 through N

After floor creation, optionally offer preset pour-type bundles.

Foundation bundle:

- footings
- grade beams
- slab
- elevator pit

Ground level and standard floor bundle:

- slab
- columns
- shear walls
- core walls
- stairs

## Phase 97. Bulk Floor Creation

From building detail, support:

- include foundation
- include ground level
- create standard floors from level 2 through level N
- preview before submit
- reject duplicates
- assign display order automatically

## Phase 98. Delete Safeguards

All delete dialogs should show:

- item name
- parent context
- child counts
- estimated concrete affected
- actual concrete affected

For building delete on larger hierarchies, require confirmation text.

## Phase 99. Activity Events

Record activity in the same mutation services that write hierarchy records.

New event types:

- `building_created`
- `building_updated`
- `building_deleted`
- `floor_created`
- `floor_updated`
- `floor_deleted`
- `pour_type_created`
- `pour_type_updated`
- `pour_type_deleted`

Reuse `recordActivityEvent` from `src/server/activity/service.ts`.

## Phase 100. Validation Schemas

Add Zod schemas for:

- create/update/delete building
- create/update/delete floor
- bulk create floors
- create/update/delete pour type

Validation expectations:

- trim text
- coerce numbers safely
- enforce non-negative concrete
- enforce enum validity
- enforce floor uniqueness rules server-side
- bound notes length
- bound display-order values

## Phase 101. Component and Module Layout

Use the file map listed above unless implementation pressure makes a small consolidation clearly better.

Specific repo note:

- keep schema separate in `src/db/schema/hierarchy.ts`
- keep route modules thin
- keep business rules out of component files

## Phase 102. Delivery Order

Implement in this order:

1. schema, enums, relations, constraints, indexes
2. roll-up recalculation services
3. validation schemas
4. building service/query layer and server functions
5. project detail buildings section
6. building CRUD
7. building detail page
8. floor CRUD
9. bulk floor creation
10. floor detail page
11. pour-type CRUD
12. hierarchy tables and row actions
13. search/filter/sort
14. quick-start helpers
15. activity event hooks
16. project total cutover polish
17. tests

## Phase 103. Test Plan

Add coverage for:

- hierarchy lineage integrity
- project/building/floor/pour-type authorization
- roll-up correctness on create/update/delete
- duplicate floor rejection
- duplicate standard level rejection
- negative concrete rejection
- invalid enum rejection
- bulk floor creation defaults and duplicate handling
- protected hierarchy page loaders

Also add regression coverage for the project totals cutover:

- project totals update from hierarchy mutations
- manual project edit no longer overrides hierarchy-derived totals

Recommended files:

- `src/server/buildings/buildings.test.ts`
- `src/server/floors/floors.test.ts`
- `src/server/pour-types/pour-types.test.ts`
- `src/server/hierarchy/hierarchy-rollups.test.ts`
- targeted updates to `src/server/projects/projects.test.ts`

## Phase 104. Definition of Done

This section is complete only when:

- users can add, edit, and delete buildings inside a project
- users can add, edit, and delete floors inside a building
- users can add, edit, and delete pour types inside a floor
- floor totals roll up from pour types correctly
- building totals roll up from floors correctly
- project totals roll up from buildings correctly
- project detail shows buildings and building totals
- building detail shows floor totals
- floor detail shows pour-type totals
- delete flows show hierarchy impact before confirmation
- authorization is enforced on every loader and mutation
- activity events are recorded for hierarchy changes
- project-level totals no longer drift through manual editing
- critical hierarchy behavior is covered by tests

## First Implementation Slice

If this work is split across multiple Codex sessions, the best first shippable slice is:

1. add schema + enums + relations
2. add roll-up services
3. add building CRUD + buildings section on project detail
4. cut project totals over to hierarchy-derived values

That slice establishes the source-of-truth model early and reduces rework in later floor and pour-type phases.

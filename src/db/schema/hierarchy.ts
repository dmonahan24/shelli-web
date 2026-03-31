import { relations } from "drizzle-orm";
import { index, integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { floorTypeEnum, pourCategoryEnum, pourTypeStatusEnum } from "@/db/schema/enums";
import {
  auditColumns,
  companyIdColumn,
  idColumn,
  notesColumn,
  volumeColumn,
} from "@/db/schema/shared";
import { companies } from "@/db/schema/core";
import { projects } from "@/db/schema/projects";

export const projectBuildings = pgTable(
  "project_buildings",
  {
    id: idColumn(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    code: text("code"),
    description: notesColumn("description"),
    displayOrder: integer("display_order").notNull().default(0),
    estimatedConcreteTotal: volumeColumn("estimated_concrete_total").notNull().default("0"),
    actualConcreteTotal: volumeColumn("actual_concrete_total").notNull().default("0"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    projectIndex: index("project_buildings_project_id_idx").on(table.projectId),
    companyIndex: index("project_buildings_company_id_idx").on(table.companyId),
    projectDisplayOrderIndex: index("project_buildings_project_display_order_idx").on(
      table.projectId,
      table.displayOrder
    ),
    projectNameIndex: uniqueIndex("project_buildings_project_name_idx").on(
      table.projectId,
      table.name
    ),
    projectSlugIndex: uniqueIndex("project_buildings_project_slug_idx").on(
      table.projectId,
      table.slug
    ),
  })
);

export const buildingFloors = pgTable(
  "building_floors",
  {
    id: idColumn(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => projectBuildings.id, { onDelete: "cascade" }),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    floorType: floorTypeEnum("floor_type").notNull(),
    levelNumber: integer("level_number"),
    displayOrder: integer("display_order").notNull().default(0),
    estimatedConcreteTotal: volumeColumn("estimated_concrete_total").notNull().default("0"),
    actualConcreteTotal: volumeColumn("actual_concrete_total").notNull().default("0"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    buildingIndex: index("building_floors_building_id_idx").on(table.buildingId),
    buildingDisplayOrderIndex: index("building_floors_building_display_order_idx").on(
      table.buildingId,
      table.displayOrder
    ),
    buildingFloorTypeIndex: index("building_floors_building_floor_type_idx").on(
      table.buildingId,
      table.floorType
    ),
    buildingNameIndex: uniqueIndex("building_floors_building_name_idx").on(
      table.buildingId,
      table.name
    ),
    buildingSlugIndex: uniqueIndex("building_floors_building_slug_idx").on(
      table.buildingId,
      table.slug
    ),
  })
);

export const floorPourTypes = pgTable(
  "floor_pour_types",
  {
    id: idColumn(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    buildingId: uuid("building_id")
      .notNull()
      .references(() => projectBuildings.id, { onDelete: "cascade" }),
    floorId: uuid("floor_id")
      .notNull()
      .references(() => buildingFloors.id, { onDelete: "cascade" }),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    pourCategory: pourCategoryEnum("pour_category").notNull().default("other"),
    estimatedConcrete: volumeColumn("estimated_concrete").notNull().default("0"),
    actualConcrete: volumeColumn("actual_concrete").notNull().default("0"),
    status: pourTypeStatusEnum("status").notNull().default("not_started"),
    notes: notesColumn("notes"),
    displayOrder: integer("display_order").notNull().default(0),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    floorIndex: index("floor_pour_types_floor_id_idx").on(table.floorId),
    floorDisplayOrderIndex: index("floor_pour_types_floor_display_order_idx").on(
      table.floorId,
      table.displayOrder
    ),
    projectStatusIndex: index("floor_pour_types_project_status_idx").on(
      table.projectId,
      table.status
    ),
    floorNameIndex: uniqueIndex("floor_pour_types_floor_name_idx").on(table.floorId, table.name),
  })
);

export const projectBuildingsRelations = relations(projectBuildings, ({ one, many }) => ({
  company: one(companies, {
    fields: [projectBuildings.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [projectBuildings.projectId],
    references: [projects.id],
  }),
  floors: many(buildingFloors),
}));

export const buildingFloorsRelations = relations(buildingFloors, ({ one, many }) => ({
  company: one(companies, {
    fields: [buildingFloors.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [buildingFloors.projectId],
    references: [projects.id],
  }),
  building: one(projectBuildings, {
    fields: [buildingFloors.buildingId],
    references: [projectBuildings.id],
  }),
  pourTypes: many(floorPourTypes),
}));

export const floorPourTypesRelations = relations(floorPourTypes, ({ one }) => ({
  company: one(companies, {
    fields: [floorPourTypes.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [floorPourTypes.projectId],
    references: [projects.id],
  }),
  building: one(projectBuildings, {
    fields: [floorPourTypes.buildingId],
    references: [projectBuildings.id],
  }),
  floor: one(buildingFloors, {
    fields: [floorPourTypes.floorId],
    references: [buildingFloors.id],
  }),
}));

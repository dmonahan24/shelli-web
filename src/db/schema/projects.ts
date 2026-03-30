import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { projectStatusEnum } from "@/db/schema/enums";
import {
  auditColumns,
  companyIdColumn,
  createdByUserIdColumn,
  idColumn,
  notesColumn,
  updatedByUserIdColumn,
  volumeColumn,
} from "@/db/schema/shared";
import { companies, users } from "@/db/schema/core";

export const projects = pgTable(
  "projects",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    createdByUserId: createdByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: updatedByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    status: projectStatusEnum("status").notNull().default("active"),
    description: notesColumn("description"),
    projectCode: text("project_code"),
    clientName: text("client_name"),
    generalContractor: text("general_contractor"),
    dateStarted: date("date_started", { mode: "string" }).notNull(),
    estimatedCompletionDate: date("estimated_completion_date", { mode: "string" }).notNull(),
    lastPourDate: date("last_pour_date", { mode: "string" }),
    totalConcretePoured: volumeColumn("total_concrete_poured").notNull().default("0"),
    estimatedTotalConcrete: volumeColumn("estimated_total_concrete").notNull().default("0"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyStatusIndex: index("projects_company_status_idx").on(
      table.companyId,
      table.status
    ),
    companyStartDateIndex: index("projects_company_start_date_idx").on(
      table.companyId,
      table.dateStarted
    ),
    companyProjectCodeIndex: uniqueIndex("projects_company_project_code_idx").on(
      table.companyId,
      table.projectCode
    ),
  })
);

export const projectContacts = pgTable(
  "project_contacts",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    companyName: text("company_name"),
    roleTitle: text("role_title"),
    phone: text("phone"),
    email: text("email"),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyProjectIndex: index("project_contacts_company_project_idx").on(
      table.companyId,
      table.projectId
    ),
  })
);

export const crews = pgTable(
  "crews",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    foremanName: text("foreman_name"),
    memberCount: integer("member_count").default(0).notNull(),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyNameIndex: uniqueIndex("crews_company_name_idx").on(table.companyId, table.name),
  })
);

export const mixDesigns = pgTable(
  "mix_designs",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    code: text("code").notNull(),
    name: text("name").notNull(),
    supplierName: text("supplier_name"),
    specifiedStrengthPsi: integer("specified_strength_psi"),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyCodeIndex: uniqueIndex("mix_designs_company_code_idx").on(
      table.companyId,
      table.code
    ),
  })
);

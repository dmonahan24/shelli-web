import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pourStatusEnum } from "@/db/schema/enums";
import {
  companyIdColumn,
  createdByUserIdColumn,
  createdOnlyAuditColumns,
  idColumn,
  jsonDetailsColumn,
  notesColumn,
} from "@/db/schema/shared";
import { companies, users } from "@/db/schema/core";
import { pours } from "@/db/schema/operations";
import { projects } from "@/db/schema/projects";

export const auditEvents = pgTable(
  "audit_events",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id").references(() => pours.id, { onDelete: "cascade" }),
    actorUserId: createdByUserIdColumn().references(() => users.id, { onDelete: "set null" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    actionType: text("action_type").notNull(),
    summary: text("summary").notNull(),
    detailsJson: jsonDetailsColumn("details_json"),
    createdAt: createdOnlyAuditColumns.createdAt,
  },
  (table) => ({
    companyProjectIndex: index("audit_events_company_project_idx").on(
      table.companyId,
      table.projectId
    ),
    companyCreatedAtIndex: index("audit_events_company_created_at_idx").on(
      table.companyId,
      table.createdAt
    ),
  })
);

export const pourStatusHistory = pgTable(
  "pour_status_history",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id")
      .notNull()
      .references(() => pours.id, { onDelete: "cascade" }),
    changedByUserId: uuid("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fromStatus: pourStatusEnum("from_status"),
    toStatus: pourStatusEnum("to_status").notNull(),
    reason: notesColumn("reason"),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    companyPourChangedAtIndex: index("pour_status_history_company_pour_changed_at_idx").on(
      table.companyId,
      table.pourId,
      table.changedAt
    ),
  })
);

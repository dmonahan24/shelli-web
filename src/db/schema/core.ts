import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { accessRequestStatusEnum, userRoleEnum } from "@/db/schema/enums";
import { activeFlagColumn, auditColumns, idColumn, notesColumn } from "@/db/schema/shared";

export const companies = pgTable(
  "companies",
  {
    id: idColumn(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    isActive: activeFlagColumn(),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    slugIndex: uniqueIndex("companies_slug_idx").on(table.slug),
  })
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    isActive: activeFlagColumn(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyIndex: index("users_company_id_idx").on(table.companyId),
    emailIndex: uniqueIndex("users_company_email_idx").on(table.companyId, table.email),
    roleIndex: index("users_role_idx").on(table.role),
  })
);

export const platformAdmins = pgTable(
  "platform_admins",
  {
    id: uuid("id").primaryKey(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    isActive: activeFlagColumn(),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    emailIndex: uniqueIndex("platform_admins_email_idx").on(table.email),
  })
);

export const accessRequests = pgTable(
  "access_requests",
  {
    id: idColumn(),
    authUserId: uuid("auth_user_id").notNull(),
    email: text("email").notNull(),
    fullName: text("full_name").notNull(),
    status: accessRequestStatusEnum("status").notNull().default("pending"),
    requestedAt: timestamp("requested_at", { withTimezone: true }).defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    resolvedByPlatformAdminId: uuid("resolved_by_platform_admin_id").references(
      () => platformAdmins.id,
      { onDelete: "set null" }
    ),
    targetCompanyId: uuid("target_company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    targetRole: userRoleEnum("target_role"),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    authUserIndex: uniqueIndex("access_requests_auth_user_id_idx").on(table.authUserId),
    statusIndex: index("access_requests_status_idx").on(table.status),
    companyIndex: index("access_requests_target_company_id_idx").on(table.targetCompanyId),
  })
);

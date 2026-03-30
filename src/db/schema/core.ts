import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { userRoleEnum } from "@/db/schema/enums";
import { activeFlagColumn, auditColumns, idColumn } from "@/db/schema/shared";

export const companies = pgTable(
  "companies",
  {
    id: idColumn(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
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

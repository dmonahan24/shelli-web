import { sql } from "drizzle-orm";
import { boolean, jsonb, numeric, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const createdOnlyAuditColumns = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
};

export const idColumn = () => uuid("id").defaultRandom().primaryKey();
export const companyIdColumn = () => uuid("company_id").notNull();
export const createdByUserIdColumn = () => uuid("created_by_user_id");
export const updatedByUserIdColumn = () => uuid("updated_by_user_id");
export const activeFlagColumn = () => boolean("is_active").default(true).notNull();
export const notesColumn = (name: string) => text(name);
export const volumeColumn = (name: string) =>
  numeric(name, { precision: 12, scale: 2 }).$type<string>();
export const jsonDetailsColumn = (name: string) =>
  jsonb(name).$type<Record<string, unknown>>().default(sql`'{}'::jsonb`).notNull();

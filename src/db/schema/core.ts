import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import {
  accessRequestStatusEnum,
  companyMembershipStatusEnum,
  userRoleEnum,
} from "@/db/schema/enums";
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

export const companyMemberships = pgTable(
  "company_memberships",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").notNull(),
    status: companyMembershipStatusEnum("status").notNull().default("active"),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    joinedAt: timestamp("joined_at", { withTimezone: true }),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyUserIndex: uniqueIndex("company_memberships_company_user_idx").on(
      table.companyId,
      table.userId
    ),
    companyStatusIndex: index("company_memberships_company_status_idx").on(
      table.companyId,
      table.status
    ),
    userIndex: index("company_memberships_user_id_idx").on(table.userId),
  })
);

export const companyInvitations = pgTable(
  "company_invitations",
  {
    id: idColumn(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: userRoleEnum("role").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    invitedByUserId: uuid("invited_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    tokenHashIndex: uniqueIndex("company_invitations_token_hash_idx").on(table.tokenHash),
    companyEmailIndex: index("company_invitations_company_email_idx").on(
      table.companyId,
      table.email
    ),
    companyExpiresIndex: index("company_invitations_company_expires_idx").on(
      table.companyId,
      table.expiresAt
    ),
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

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  memberships: many(companyMemberships),
  invitations: many(companyInvitations),
  accessRequests: many(accessRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  memberships: many(companyMemberships),
  invitedMemberships: many(companyMemberships, {
    relationName: "membership_inviter",
  }),
  invitationsSent: many(companyInvitations, {
    relationName: "invitation_inviter",
  }),
}));

export const companyMembershipsRelations = relations(companyMemberships, ({ one }) => ({
  company: one(companies, {
    fields: [companyMemberships.companyId],
    references: [companies.id],
  }),
  user: one(users, {
    fields: [companyMemberships.userId],
    references: [users.id],
  }),
  invitedByUser: one(users, {
    fields: [companyMemberships.invitedByUserId],
    references: [users.id],
    relationName: "membership_inviter",
  }),
}));

export const companyInvitationsRelations = relations(companyInvitations, ({ one }) => ({
  company: one(companies, {
    fields: [companyInvitations.companyId],
    references: [companies.id],
  }),
  invitedByUser: one(users, {
    fields: [companyInvitations.invitedByUserId],
    references: [users.id],
    relationName: "invitation_inviter",
  }),
}));

export const accessRequestsRelations = relations(accessRequests, ({ one }) => ({
  targetCompany: one(companies, {
    fields: [accessRequests.targetCompanyId],
    references: [companies.id],
  }),
}));

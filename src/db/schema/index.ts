import { randomUUID } from "node:crypto";
import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .$defaultFn(() => new Date())
    .notNull(),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    ...timestamps,
  },
  (table) => ({
    emailUniqueIndex: uniqueIndex("users_email_idx").on(table.email),
  })
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIndex: index("sessions_user_id_idx").on(table.userId),
  })
);

export const passwordResetTokens = sqliteTable(
  "password_reset_tokens",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    userIdIndex: index("password_reset_tokens_user_id_idx").on(table.userId),
    tokenHashIndex: uniqueIndex("password_reset_tokens_token_hash_idx").on(
      table.tokenHash
    ),
  })
);

export const projects = sqliteTable(
  "projects",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address").notNull(),
    status: text("status").notNull().default("active"),
    description: text("description"),
    lastPourDate: text("last_pour_date"),
    projectCode: text("project_code"),
    dateStarted: text("date_started").notNull(),
    estimatedCompletionDate: text("estimated_completion_date").notNull(),
    totalConcretePoured: real("total_concrete_poured").notNull().default(0),
    estimatedTotalConcrete: real("estimated_total_concrete").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    userIdIndex: index("projects_user_id_idx").on(table.userId),
    statusIndex: index("projects_status_idx").on(table.status),
    userIdStatusIndex: index("projects_user_id_status_idx").on(
      table.userId,
      table.status
    ),
    dateStartedIndex: index("projects_date_started_idx").on(table.dateStarted),
    projectCodeIndex: index("projects_project_code_idx").on(table.projectCode),
    pouredNonNegative: check(
      "projects_total_concrete_poured_non_negative",
      sql`${table.totalConcretePoured} >= 0`
    ),
    estimatedNonNegative: check(
      "projects_estimated_total_concrete_non_negative",
      sql`${table.estimatedTotalConcrete} >= 0`
    ),
    estimatedAfterStart: check(
      "projects_estimated_completion_after_start",
      sql`${table.estimatedCompletionDate} >= ${table.dateStarted}`
    ),
    validStatus: check(
      "projects_status_valid",
      sql`${table.status} in ('active', 'completed', 'on_hold')`
    ),
  })
);

export const concretePourEvents = sqliteTable(
  "concrete_pour_events",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    pourDate: text("pour_date").notNull(),
    concreteAmount: real("concrete_amount").notNull(),
    unit: text("unit").notNull().default("cubic_yards"),
    locationDescription: text("location_description").notNull(),
    mixType: text("mix_type"),
    supplierName: text("supplier_name"),
    ticketNumber: text("ticket_number"),
    weatherNotes: text("weather_notes"),
    crewNotes: text("crew_notes"),
    ...timestamps,
  },
  (table) => ({
    projectIdIndex: index("concrete_pour_events_project_id_idx").on(table.projectId),
    pourDateIndex: index("concrete_pour_events_pour_date_idx").on(table.pourDate),
    userIdIndex: index("concrete_pour_events_user_id_idx").on(table.userId),
    projectDateIndex: index("concrete_pour_events_project_date_idx").on(
      table.projectId,
      table.pourDate
    ),
    amountNonNegative: check(
      "concrete_pour_events_amount_non_negative",
      sql`${table.concreteAmount} >= 0`
    ),
    validUnit: check(
      "concrete_pour_events_unit_valid",
      sql`${table.unit} in ('cubic_yards')`
    ),
  })
);

export const projectAttachments = sqliteTable(
  "project_attachments",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    uploadedByUserId: text("uploaded_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    originalFileName: text("original_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    storageKey: text("storage_key").notNull(),
    attachmentType: text("attachment_type").notNull(),
    caption: text("caption"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectIdIndex: index("project_attachments_project_id_idx").on(table.projectId),
    uploadedByUserIdIndex: index("project_attachments_uploaded_by_user_id_idx").on(
      table.uploadedByUserId
    ),
    createdAtIndex: index("project_attachments_created_at_idx").on(table.createdAt),
    storageKeyIndex: uniqueIndex("project_attachments_storage_key_idx").on(
      table.storageKey
    ),
    fileSizePositive: check(
      "project_attachments_file_size_positive",
      sql`${table.fileSizeBytes} > 0`
    ),
    mimeTypeValid: check(
      "project_attachments_mime_type_valid",
      sql`instr(${table.mimeType}, '/') > 1`
    ),
    validAttachmentType: check(
      "project_attachments_type_valid",
      sql`${table.attachmentType} in ('photo', 'delivery_ticket', 'inspection_doc', 'other')`
    ),
  })
);

export const projectActivity = sqliteTable(
  "project_activity",
  {
    id: text("id")
      .$defaultFn(() => randomUUID())
      .primaryKey(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: text("action_type").notNull(),
    detailsJson: text("details_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .$defaultFn(() => new Date())
      .notNull(),
  },
  (table) => ({
    projectIdIndex: index("project_activity_project_id_idx").on(table.projectId),
    userIdIndex: index("project_activity_user_id_idx").on(table.userId),
  })
);

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  sessions: many(sessions),
  pourEvents: many(concretePourEvents),
  projectAttachments: many(projectAttachments),
  projectActivity: many(projectActivity),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  activity: many(projectActivity),
  pourEvents: many(concretePourEvents),
  attachments: many(projectAttachments),
}));

export const concretePourEventsRelations = relations(
  concretePourEvents,
  ({ one }) => ({
    project: one(projects, {
      fields: [concretePourEvents.projectId],
      references: [projects.id],
    }),
    user: one(users, {
      fields: [concretePourEvents.userId],
      references: [users.id],
    }),
  })
);

export const projectAttachmentsRelations = relations(
  projectAttachments,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectAttachments.projectId],
      references: [projects.id],
    }),
    uploadedByUser: one(users, {
      fields: [projectAttachments.uploadedByUserId],
      references: [users.id],
    }),
  })
);

export const projectActivityRelations = relations(projectActivity, ({ one }) => ({
  project: one(projects, {
    fields: [projectActivity.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectActivity.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type ConcretePourEvent = typeof concretePourEvents.$inferSelect;
export type NewConcretePourEvent = typeof concretePourEvents.$inferInsert;
export type ProjectAttachment = typeof projectAttachments.$inferSelect;
export type NewProjectAttachment = typeof projectAttachments.$inferInsert;

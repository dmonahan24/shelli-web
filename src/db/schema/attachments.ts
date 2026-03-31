import { relations } from "drizzle-orm";
import { bigint, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { attachmentTypeEnum } from "@/db/schema/enums";
import { auditColumns, companyIdColumn, idColumn, notesColumn } from "@/db/schema/shared";
import { companies, users } from "@/db/schema/core";
import { pours } from "@/db/schema/operations";
import { projects } from "@/db/schema/projects";

export const attachments = pgTable(
  "attachments",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id").references(() => pours.id, { onDelete: "cascade" }),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    originalFileName: text("original_file_name").notNull(),
    storedFileName: text("stored_file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSizeBytes: bigint("file_size_bytes", { mode: "number" }).notNull(),
    storageBucket: text("storage_bucket").notNull(),
    storagePath: text("storage_path").notNull(),
    attachmentType: attachmentTypeEnum("attachment_type").notNull(),
    caption: notesColumn("caption"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyProjectIndex: index("attachments_company_project_idx").on(
      table.companyId,
      table.projectId
    ),
    companyProjectCreatedAtIndex: index("attachments_company_project_created_at_idx").on(
      table.companyId,
      table.projectId,
      table.createdAt.desc()
    ),
    storagePathIndex: index("attachments_storage_path_idx").on(
      table.storageBucket,
      table.storagePath
    ),
  })
);

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  company: one(companies, {
    fields: [attachments.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [attachments.projectId],
    references: [projects.id],
  }),
  pour: one(pours, {
    fields: [attachments.pourId],
    references: [pours.id],
  }),
  uploadedByUser: one(users, {
    fields: [attachments.uploadedByUserId],
    references: [users.id],
  }),
}));

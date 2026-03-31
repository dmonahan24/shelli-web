import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { projectMemberRoleEnum, projectStatusEnum } from "@/db/schema/enums";
import {
  auditColumns,
  companyIdColumn,
  createdByUserIdColumn,
  idColumn,
  notesColumn,
  updatedByUserIdColumn,
  volumeColumn,
} from "@/db/schema/shared";
import { companies, companyInvitations, users } from "@/db/schema/core";
import { projectBuildings } from "@/db/schema/hierarchy";

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
    slug: text("slug").notNull(),
    address: text("address").notNull(),
    status: projectStatusEnum("status").notNull().default("active"),
    description: notesColumn("description"),
    projectCode: text("project_code"),
    clientName: text("client_name"),
    generalContractor: text("general_contractor"),
    projectManagerUserId: uuid("project_manager_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    superintendentUserId: uuid("superintendent_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
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
    companyUpdatedAtIndex: index("projects_company_updated_at_idx").on(
      table.companyId,
      table.updatedAt.desc()
    ),
    companySlugIndex: uniqueIndex("projects_company_slug_idx").on(
      table.companyId,
      table.slug
    ),
    companyProjectCodeIndex: uniqueIndex("projects_company_project_code_idx").on(
      table.companyId,
      table.projectCode
    ),
  })
);

export const projectMembers = pgTable(
  "project_members",
  {
    id: idColumn(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectMemberRoleEnum("role").notNull().default("viewer"),
    createdAt: auditColumns.createdAt,
  },
  (table) => ({
    projectUserIndex: uniqueIndex("project_members_project_user_idx").on(
      table.projectId,
      table.userId
    ),
    projectRoleIndex: index("project_members_project_role_idx").on(table.projectId, table.role),
    userIndex: index("project_members_user_id_idx").on(table.userId),
  })
);

export const projectMemberInvitationAssignments = pgTable(
  "project_member_invitation_assignments",
  {
    id: idColumn(),
    companyInvitationId: uuid("company_invitation_id")
      .notNull()
      .references(() => companyInvitations.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    projectRole: projectMemberRoleEnum("project_role").notNull().default("viewer"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: auditColumns.createdAt,
  },
  (table) => ({
    invitationProjectIndex: uniqueIndex(
      "project_member_invitation_assignments_invitation_project_idx"
    ).on(table.companyInvitationId, table.projectId),
    projectIndex: index("project_member_invitation_assignments_project_id_idx").on(
      table.projectId
    ),
    invitationIndex: index(
      "project_member_invitation_assignments_invitation_id_idx"
    ).on(table.companyInvitationId),
    acceptedIndex: index(
      "project_member_invitation_assignments_project_accepted_idx"
    ).on(table.projectId, table.acceptedAt),
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

export const projectsRelations = relations(projects, ({ one, many }) => ({
  company: one(companies, {
    fields: [projects.companyId],
    references: [companies.id],
  }),
  createdByUser: one(users, {
    fields: [projects.createdByUserId],
    references: [users.id],
    relationName: "project_created_by_user",
  }),
  updatedByUser: one(users, {
    fields: [projects.updatedByUserId],
    references: [users.id],
    relationName: "project_updated_by_user",
  }),
  projectManagerUser: one(users, {
    fields: [projects.projectManagerUserId],
    references: [users.id],
    relationName: "project_manager_user",
  }),
  superintendentUser: one(users, {
    fields: [projects.superintendentUserId],
    references: [users.id],
    relationName: "project_superintendent_user",
  }),
  members: many(projectMembers),
  pendingInvitationAssignments: many(projectMemberInvitationAssignments),
  contacts: many(projectContacts),
  buildings: many(projectBuildings),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const projectMemberInvitationAssignmentsRelations = relations(
  projectMemberInvitationAssignments,
  ({ one }) => ({
    companyInvitation: one(companyInvitations, {
      fields: [projectMemberInvitationAssignments.companyInvitationId],
      references: [companyInvitations.id],
    }),
    project: one(projects, {
      fields: [projectMemberInvitationAssignments.projectId],
      references: [projects.id],
    }),
    createdByUser: one(users, {
      fields: [projectMemberInvitationAssignments.createdByUserId],
      references: [users.id],
      relationName: "project_member_invitation_assignment_created_by_user",
    }),
  })
);

export const projectContactsRelations = relations(projectContacts, ({ one }) => ({
  company: one(companies, {
    fields: [projectContacts.companyId],
    references: [companies.id],
  }),
  project: one(projects, {
    fields: [projectContacts.projectId],
    references: [projects.id],
  }),
}));

export const crewsRelations = relations(crews, ({ one }) => ({
  company: one(companies, {
    fields: [crews.companyId],
    references: [companies.id],
  }),
}));

export const mixDesignsRelations = relations(mixDesigns, ({ one }) => ({
  company: one(companies, {
    fields: [mixDesigns.companyId],
    references: [companies.id],
  }),
}));

import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  issueCategoryEnum,
  issueSeverityEnum,
  issueStatusEnum,
  loadTicketStatusEnum,
  placementAreaTypeEnum,
  pourStatusEnum,
  qcTestTypeEnum,
} from "@/db/schema/enums";
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
import { crews, mixDesigns, projects } from "@/db/schema/projects";

export const pours = pgTable(
  "pours",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mixDesignId: uuid("mix_design_id").references(() => mixDesigns.id, {
      onDelete: "set null",
    }),
    mixDesignLabel: text("mix_design_label"),
    createdByUserId: createdByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: updatedByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    scheduledDate: date("scheduled_date", { mode: "string" }).notNull(),
    placementAreaType: placementAreaTypeEnum("placement_area_type").notNull().default("other"),
    placementAreaLabel: text("placement_area_label").notNull(),
    status: pourStatusEnum("status").notNull().default("planned"),
    unit: text("unit").notNull().default("cubic_yards"),
    estimatedVolume: volumeColumn("estimated_volume"),
    actualVolume: volumeColumn("actual_volume").notNull().default("0"),
    deliveredVolume: volumeColumn("delivered_volume").notNull().default("0"),
    rejectedVolume: volumeColumn("rejected_volume").notNull().default("0"),
    acceptedLoadCount: integer("accepted_load_count").notNull().default(0),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
    placementStartAt: timestamp("placement_start_at", { withTimezone: true }),
    placementEndAt: timestamp("placement_end_at", { withTimezone: true }),
    clientSubmissionId: text("client_submission_id"),
    weatherNotes: notesColumn("weather_notes"),
    delayReason: notesColumn("delay_reason"),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyProjectDateIndex: index("pours_company_project_date_idx").on(
      table.companyId,
      table.projectId,
      table.scheduledDate
    ),
    companyStatusDateIndex: index("pours_company_status_date_idx").on(
      table.companyId,
      table.status,
      table.scheduledDate
    ),
    submissionIndex: uniqueIndex("pours_company_project_submission_id_idx").on(
      table.companyId,
      table.projectId,
      table.createdByUserId,
      table.clientSubmissionId
    ),
  })
);

export const pourAssignments = pgTable(
  "pour_assignments",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id")
      .notNull()
      .references(() => pours.id, { onDelete: "cascade" }),
    crewId: uuid("crew_id").references(() => crews.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    assignmentRole: text("assignment_role").notNull(),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyPourIndex: index("pour_assignments_company_pour_idx").on(
      table.companyId,
      table.pourId
    ),
  })
);

export const pourMixRequirements = pgTable(
  "pour_mix_requirements",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id")
      .notNull()
      .references(() => pours.id, { onDelete: "cascade" }),
    mixDesignId: uuid("mix_design_id")
      .notNull()
      .references(() => mixDesigns.id, { onDelete: "cascade" }),
    targetVolume: volumeColumn("target_volume"),
    notes: notesColumn("notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyPourIndex: index("pour_mix_requirements_company_pour_idx").on(
      table.companyId,
      table.pourId
    ),
  })
);

export const loadTickets = pgTable(
  "load_tickets",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id")
      .notNull()
      .references(() => pours.id, { onDelete: "cascade" }),
    createdByUserId: createdByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: updatedByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    ticketNumber: text("ticket_number"),
    supplierName: text("supplier_name"),
    truckIdentifier: text("truck_identifier"),
    quantity: volumeColumn("quantity").notNull().default("0"),
    batchTime: timestamp("batch_time", { withTimezone: true }),
    arrivalTime: timestamp("arrival_time", { withTimezone: true }),
    dischargeStartAt: timestamp("discharge_start_at", { withTimezone: true }),
    dischargeEndAt: timestamp("discharge_end_at", { withTimezone: true }),
    status: loadTicketStatusEnum("status").notNull().default("accepted"),
    rejectionReason: notesColumn("rejection_reason"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyPourIndex: index("load_tickets_company_pour_idx").on(table.companyId, table.pourId),
    companyProjectIndex: index("load_tickets_company_project_idx").on(
      table.companyId,
      table.projectId
    ),
  })
);

export const qcTests = pgTable(
  "qc_tests",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id")
      .notNull()
      .references(() => pours.id, { onDelete: "cascade" }),
    loadTicketId: uuid("load_ticket_id").references(() => loadTickets.id, {
      onDelete: "set null",
    }),
    technicianUserId: uuid("technician_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    testType: qcTestTypeEnum("test_type").notNull(),
    sampleTime: timestamp("sample_time", { withTimezone: true }).notNull(),
    slumpInches: text("slump_inches"),
    airContentPercent: text("air_content_percent"),
    concreteTemperatureF: text("concrete_temperature_f"),
    ambientWeatherNotes: notesColumn("ambient_weather_notes"),
    cylinderCount: integer("cylinder_count"),
    cylinderIdentifiers: text("cylinder_identifiers"),
    resultNotes: notesColumn("result_notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyPourSampleIndex: index("qc_tests_company_pour_sample_idx").on(
      table.companyId,
      table.pourId,
      table.sampleTime
    ),
  })
);

export const issues = pgTable(
  "issues",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, { onDelete: "cascade" }),
    pourId: uuid("pour_id").references(() => pours.id, { onDelete: "cascade" }),
    ownerUserId: uuid("owner_user_id").references(() => users.id, { onDelete: "set null" }),
    category: issueCategoryEnum("category").notNull(),
    severity: issueSeverityEnum("severity").notNull().default("medium"),
    status: issueStatusEnum("status").notNull().default("open"),
    summary: text("summary").notNull(),
    notes: notesColumn("notes"),
    resolutionNotes: notesColumn("resolution_notes"),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyStatusIndex: index("issues_company_status_idx").on(table.companyId, table.status),
  })
);

export const dailyReports = pgTable(
  "daily_reports",
  {
    id: idColumn(),
    companyId: companyIdColumn().references(() => companies.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    reportDate: date("report_date", { mode: "string" }).notNull(),
    summary: notesColumn("summary"),
    weatherSummary: notesColumn("weather_summary"),
    createdByUserId: createdByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    updatedByUserId: updatedByUserIdColumn().references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: auditColumns.createdAt,
    updatedAt: auditColumns.updatedAt,
  },
  (table) => ({
    companyProjectDateIndex: index("daily_reports_company_project_date_idx").on(
      table.companyId,
      table.projectId,
      table.reportDate
    ),
  })
);

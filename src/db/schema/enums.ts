import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "project_manager",
  "field_supervisor",
  "viewer",
]);

export const companyMembershipStatusEnum = pgEnum("company_membership_status", [
  "invited",
  "active",
  "inactive",
]);

export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "project_admin",
  "editor",
  "contributor",
  "viewer",
]);

export const accessRequestStatusEnum = pgEnum("access_request_status", [
  "pending",
  "approved",
  "rejected",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "completed",
  "on_hold",
]);

export const pourStatusEnum = pgEnum("pour_status", [
  "planned",
  "ready",
  "in_progress",
  "completed",
  "delayed",
  "cancelled",
]);

export const placementAreaTypeEnum = pgEnum("placement_area_type", [
  "slab",
  "footing",
  "wall",
  "column",
  "deck",
  "curb",
  "other",
]);

export const loadTicketStatusEnum = pgEnum("load_ticket_status", [
  "accepted",
  "rejected",
  "pending",
]);

export const qcTestTypeEnum = pgEnum("qc_test_type", [
  "slump",
  "air",
  "temperature",
  "unit_weight",
  "cylinders",
  "break",
  "other",
]);

export const issueCategoryEnum = pgEnum("issue_category", [
  "delay",
  "rejected_load",
  "weather",
  "equipment",
  "finish",
  "safety",
  "other",
]);

export const issueSeverityEnum = pgEnum("issue_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const issueStatusEnum = pgEnum("issue_status", ["open", "resolved"]);

export const attachmentTypeEnum = pgEnum("attachment_type", [
  "photo",
  "delivery_ticket",
  "inspection_doc",
  "other",
]);

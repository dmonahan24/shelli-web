export * from "@/db/schema/enums";
export * from "@/db/schema/shared";
export * from "@/db/schema/core";
export * from "@/db/schema/projects";
export * from "@/db/schema/operations";
export * from "@/db/schema/attachments";
export * from "@/db/schema/audit";

export { attachments as projectAttachments } from "@/db/schema/attachments";
export { auditEvents as projectActivity } from "@/db/schema/audit";
export { pours as concretePourEvents } from "@/db/schema/operations";

import { users } from "@/db/schema/core";
import { projects } from "@/db/schema/projects";

export type NewUser = typeof users.$inferInsert;
export type NewProject = typeof projects.$inferInsert;

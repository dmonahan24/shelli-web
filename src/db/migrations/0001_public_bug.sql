CREATE TABLE `concrete_pour_events` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`pour_date` text NOT NULL,
	`concrete_amount` real NOT NULL,
	`unit` text DEFAULT 'cubic_yards' NOT NULL,
	`location_description` text NOT NULL,
	`mix_type` text,
	`supplier_name` text,
	`ticket_number` text,
	`weather_notes` text,
	`crew_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "concrete_pour_events_amount_non_negative" CHECK("concrete_pour_events"."concrete_amount" >= 0),
	CONSTRAINT "concrete_pour_events_unit_valid" CHECK("concrete_pour_events"."unit" in ('cubic_yards'))
);
--> statement-breakpoint
CREATE INDEX `concrete_pour_events_project_id_idx` ON `concrete_pour_events` (`project_id`);--> statement-breakpoint
CREATE INDEX `concrete_pour_events_pour_date_idx` ON `concrete_pour_events` (`pour_date`);--> statement-breakpoint
CREATE INDEX `concrete_pour_events_user_id_idx` ON `concrete_pour_events` (`user_id`);--> statement-breakpoint
CREATE INDEX `concrete_pour_events_project_date_idx` ON `concrete_pour_events` (`project_id`,`pour_date`);--> statement-breakpoint
CREATE TABLE `project_attachments` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`uploaded_by_user_id` text NOT NULL,
	`file_name` text NOT NULL,
	`original_file_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size_bytes` integer NOT NULL,
	`storage_key` text NOT NULL,
	`attachment_type` text NOT NULL,
	`caption` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "project_attachments_file_size_positive" CHECK("project_attachments"."file_size_bytes" > 0),
	CONSTRAINT "project_attachments_mime_type_valid" CHECK(instr("project_attachments"."mime_type", '/') > 1),
	CONSTRAINT "project_attachments_type_valid" CHECK("project_attachments"."attachment_type" in ('photo', 'delivery_ticket', 'inspection_doc', 'other'))
);
--> statement-breakpoint
CREATE INDEX `project_attachments_project_id_idx` ON `project_attachments` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_attachments_uploaded_by_user_id_idx` ON `project_attachments` (`uploaded_by_user_id`);--> statement-breakpoint
CREATE INDEX `project_attachments_created_at_idx` ON `project_attachments` (`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `project_attachments_storage_key_idx` ON `project_attachments` (`storage_key`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`description` text,
	`last_pour_date` text,
	`project_code` text,
	`date_started` text NOT NULL,
	`estimated_completion_date` text NOT NULL,
	`total_concrete_poured` real DEFAULT 0 NOT NULL,
	`estimated_total_concrete` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "projects_total_concrete_poured_non_negative" CHECK("__new_projects"."total_concrete_poured" >= 0),
	CONSTRAINT "projects_estimated_total_concrete_non_negative" CHECK("__new_projects"."estimated_total_concrete" >= 0),
	CONSTRAINT "projects_estimated_completion_after_start" CHECK("__new_projects"."estimated_completion_date" >= "__new_projects"."date_started"),
	CONSTRAINT "projects_status_valid" CHECK("__new_projects"."status" in ('active', 'completed', 'on_hold'))
);
--> statement-breakpoint
INSERT INTO `__new_projects`("id", "user_id", "name", "address", "status", "description", "last_pour_date", "project_code", "date_started", "estimated_completion_date", "total_concrete_poured", "estimated_total_concrete", "created_at", "updated_at")
SELECT
	"id",
	"user_id",
	"name",
	"address",
	'active',
	NULL,
	NULL,
	NULL,
	"date_started",
	"estimated_completion_date",
	"total_concrete_poured",
	"estimated_total_concrete",
	"created_at",
	"updated_at"
FROM `projects`;--> statement-breakpoint
DROP TABLE `projects`;--> statement-breakpoint
ALTER TABLE `__new_projects` RENAME TO `projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `projects_user_id_idx` ON `projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `projects_status_idx` ON `projects` (`status`);--> statement-breakpoint
CREATE INDEX `projects_user_id_status_idx` ON `projects` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `projects_date_started_idx` ON `projects` (`date_started`);--> statement-breakpoint
CREATE INDEX `projects_project_code_idx` ON `projects` (`project_code`);

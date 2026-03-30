CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `password_reset_tokens_user_id_idx` ON `password_reset_tokens` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_hash_idx` ON `password_reset_tokens` (`token_hash`);--> statement-breakpoint
CREATE TABLE `project_activity` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`user_id` text NOT NULL,
	`action_type` text NOT NULL,
	`details_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `project_activity_project_id_idx` ON `project_activity` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_activity_user_id_idx` ON `project_activity` (`user_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`address` text NOT NULL,
	`date_started` text NOT NULL,
	`estimated_completion_date` text NOT NULL,
	`total_concrete_poured` real DEFAULT 0 NOT NULL,
	`estimated_total_concrete` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "projects_total_concrete_poured_non_negative" CHECK("projects"."total_concrete_poured" >= 0),
	CONSTRAINT "projects_estimated_total_concrete_non_negative" CHECK("projects"."estimated_total_concrete" >= 0),
	CONSTRAINT "projects_estimated_completion_after_start" CHECK("projects"."estimated_completion_date" >= "projects"."date_started")
);
--> statement-breakpoint
CREATE INDEX `projects_user_id_idx` ON `projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `projects_date_started_idx` ON `projects` (`date_started`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_idx` ON `users` (`email`);
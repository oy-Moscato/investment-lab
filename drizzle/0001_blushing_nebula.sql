CREATE TABLE `assumption_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assumption_id` integer NOT NULL,
	`observed_date` text NOT NULL,
	`status` text NOT NULL,
	`observed_value` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assumption_observations_date_idx` ON `assumption_observations` (`assumption_id`,`observed_date`);--> statement-breakpoint
CREATE TABLE `assumptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`statement` text NOT NULL,
	`target` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'Unknown' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`last_checked_date` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `assumptions_company_idx` ON `assumptions` (`company_id`);--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`assumption_id` integer,
	`claim` text NOT NULL,
	`polarity` text DEFAULT 'support' NOT NULL,
	`source_type` text DEFAULT '笔记' NOT NULL,
	`source_title` text DEFAULT '' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`source_date` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`conclusion` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `evidence_company_idx` ON `evidence` (`company_id`);--> statement-breakpoint
CREATE INDEX `evidence_assumption_idx` ON `evidence` (`assumption_id`);--> statement-breakpoint
CREATE TABLE `investment_snapshots` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`snapshot_type` text DEFAULT 'review' NOT NULL,
	`snapshot_date` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`position_weight` real DEFAULT 0 NOT NULL,
	`conviction` integer DEFAULT 0 NOT NULL,
	`thesis_bull` text DEFAULT '' NOT NULL,
	`thesis_bear` text DEFAULT '' NOT NULL,
	`key_assumptions` text DEFAULT '' NOT NULL,
	`kill_criteria` text DEFAULT '' NOT NULL,
	`fair_value_bear` real DEFAULT 0 NOT NULL,
	`fair_value_base` real DEFAULT 0 NOT NULL,
	`fair_value_bull` real DEFAULT 0 NOT NULL,
	`next_review_date` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `investment_snapshots_company_date_idx` ON `investment_snapshots` (`company_id`,`snapshot_date`);
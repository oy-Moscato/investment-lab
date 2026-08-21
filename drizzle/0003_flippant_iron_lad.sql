CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `source_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`type` text DEFAULT 'manual_note' NOT NULL,
	`title` text NOT NULL,
	`url` text DEFAULT '' NOT NULL,
	`filing_date` text DEFAULT '' NOT NULL,
	`period_end` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`unit_scale` integer DEFAULT 1 NOT NULL,
	`verified` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `source_documents_company_idx` ON `source_documents` (`company_id`);--> statement-breakpoint
CREATE INDEX `source_documents_period_idx` ON `source_documents` (`company_id`,`period_end`);--> statement-breakpoint
ALTER TABLE `companies` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `unit_scale` integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `source_document_id` integer;--> statement-breakpoint
ALTER TABLE `transactions` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `fx_rate_to_base` real;--> statement-breakpoint
ALTER TABLE `transactions` ADD `reversal_of_transaction_id` integer;
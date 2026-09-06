CREATE TABLE `source_documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`title` text NOT NULL,
	`source_type` text DEFAULT '年报' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`filing_date` text DEFAULT '' NOT NULL,
	`period_start` text DEFAULT '' NOT NULL,
	`period_end` text DEFAULT '' NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`unit_scale` text DEFAULT 'millions' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`is_sample` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `source_documents_company_date_idx` ON `source_documents` (`company_id`,`filing_date`);--> statement-breakpoint
ALTER TABLE `companies` ADD `currency` text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `period_end` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `filing_date` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `currency` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `unit_scale` text DEFAULT 'units' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `data_status` text DEFAULT 'reported' NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `source_document_id` integer;--> statement-breakpoint
ALTER TABLE `financials` ADD `audit_note` text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX `financials_source_document_idx` ON `financials` (`source_document_id`);
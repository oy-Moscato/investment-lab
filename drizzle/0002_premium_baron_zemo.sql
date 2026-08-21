ALTER TABLE `investment_snapshots` ADD `revenue` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_snapshots` ADD `gross_margin` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_snapshots` ADD `fcf_margin` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_snapshots` ADD `roic` real DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `investment_snapshots` ADD `debt` real DEFAULT 0 NOT NULL;
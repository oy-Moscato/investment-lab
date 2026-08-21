CREATE TABLE `companies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`ticker` text NOT NULL,
	`market` text DEFAULT '' NOT NULL,
	`country` text DEFAULT '' NOT NULL,
	`industry` text DEFAULT '' NOT NULL,
	`status` text DEFAULT '发现' NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`market_cap` real DEFAULT 0 NOT NULL,
	`enterprise_value` real DEFAULT 0 NOT NULL,
	`fair_value` real DEFAULT 0 NOT NULL,
	`conviction` integer DEFAULT 0 NOT NULL,
	`last_research_date` text DEFAULT '' NOT NULL,
	`business_model` text DEFAULT '' NOT NULL,
	`moat_score` integer DEFAULT 0 NOT NULL,
	`moat_evidence` text DEFAULT '[]' NOT NULL,
	`management_name` text DEFAULT '' NOT NULL,
	`management_score` integer DEFAULT 0 NOT NULL,
	`management_notes` text DEFAULT '' NOT NULL,
	`thesis_bull` text DEFAULT '' NOT NULL,
	`thesis_bear` text DEFAULT '' NOT NULL,
	`key_assumptions` text DEFAULT '' NOT NULL,
	`kill_criteria` text DEFAULT '' NOT NULL,
	`is_sample` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `companies_ticker_market_idx` ON `companies` (`ticker`,`market`);--> statement-breakpoint
CREATE INDEX `companies_industry_idx` ON `companies` (`industry`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer,
	`title` text NOT NULL,
	`kind` text DEFAULT '复盘' NOT NULL,
	`event_date` text NOT NULL,
	`completed` integer DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `events_event_date_idx` ON `events` (`event_date`);--> statement-breakpoint
CREATE TABLE `financials` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`year` integer NOT NULL,
	`revenue` real DEFAULT 0 NOT NULL,
	`gross_profit` real DEFAULT 0 NOT NULL,
	`operating_income` real DEFAULT 0 NOT NULL,
	`net_income` real DEFAULT 0 NOT NULL,
	`eps` real DEFAULT 0 NOT NULL,
	`operating_cash_flow` real DEFAULT 0 NOT NULL,
	`capex` real DEFAULT 0 NOT NULL,
	`free_cash_flow` real DEFAULT 0 NOT NULL,
	`cash` real DEFAULT 0 NOT NULL,
	`debt` real DEFAULT 0 NOT NULL,
	`shares_outstanding` real DEFAULT 0 NOT NULL,
	`stock_based_compensation` real DEFAULT 0 NOT NULL,
	`dividend` real DEFAULT 0 NOT NULL,
	`buyback` real DEFAULT 0 NOT NULL,
	`roe` real DEFAULT 0 NOT NULL,
	`roa` real DEFAULT 0 NOT NULL,
	`roic` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `financials_company_year_idx` ON `financials` (`company_id`,`year`);--> statement-breakpoint
CREATE INDEX `financials_company_idx` ON `financials` (`company_id`);--> statement-breakpoint
CREATE TABLE `industries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`market_size` text DEFAULT '' NOT NULL,
	`cagr` text DEFAULT '' NOT NULL,
	`supply_chain` text DEFAULT '' NOT NULL,
	`upstream` text DEFAULT '' NOT NULL,
	`midstream` text DEFAULT '' NOT NULL,
	`downstream` text DEFAULT '' NOT NULL,
	`key_companies` text DEFAULT '' NOT NULL,
	`competition` text DEFAULT '' NOT NULL,
	`tech_trends` text DEFAULT '' NOT NULL,
	`risks` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer,
	`entry_date` text NOT NULL,
	`action` text NOT NULL,
	`price` real DEFAULT 0 NOT NULL,
	`judgment` text DEFAULT '' NOT NULL,
	`reasons` text DEFAULT '' NOT NULL,
	`risks` text DEFAULT '' NOT NULL,
	`consensus` text DEFAULT '' NOT NULL,
	`divergence` text DEFAULT '' NOT NULL,
	`conviction` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `journal_entry_date_idx` ON `journal` (`entry_date`);--> statement-breakpoint
CREATE TABLE `screener_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`criteria` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer,
	`title` text NOT NULL,
	`priority` integer DEFAULT 2 NOT NULL,
	`status` text DEFAULT '待处理' NOT NULL,
	`due_date` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`trade_date` text NOT NULL,
	`type` text DEFAULT 'buy' NOT NULL,
	`shares` real NOT NULL,
	`price` real NOT NULL,
	`fees` real DEFAULT 0 NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `transactions_company_date_idx` ON `transactions` (`company_id`,`trade_date`);--> statement-breakpoint
CREATE TABLE `valuations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` integer NOT NULL,
	`scenario` text NOT NULL,
	`revenue_growth` real DEFAULT 0.1 NOT NULL,
	`operating_margin` real DEFAULT 0.2 NOT NULL,
	`tax_rate` real DEFAULT 0.2 NOT NULL,
	`capex_pct` real DEFAULT 0.08 NOT NULL,
	`da_pct` real DEFAULT 0.03 NOT NULL,
	`working_capital_pct` real DEFAULT 0.02 NOT NULL,
	`wacc` real DEFAULT 0.09 NOT NULL,
	`terminal_growth` real DEFAULT 0.03 NOT NULL,
	`shares` real DEFAULT 1 NOT NULL,
	`fair_value` real DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `valuations_company_scenario_idx` ON `valuations` (`company_id`,`scenario`);
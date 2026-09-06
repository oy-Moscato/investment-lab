-- Schema-only snapshot generated from all checked-in migrations. No records.
CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE `assumption_observations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assumption_id` integer NOT NULL,
	`observed_date` text NOT NULL,
	`status` text NOT NULL,
	`observed_value` text DEFAULT '' NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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
, `currency` text DEFAULT 'USD' NOT NULL, `currency_verified` integer DEFAULT 0 NOT NULL);

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
, `period_end` text DEFAULT '' NOT NULL, `filing_date` text DEFAULT '' NOT NULL, `currency` text DEFAULT '' NOT NULL, `unit_scale` text DEFAULT 'units' NOT NULL, `data_status` text DEFAULT 'reported' NOT NULL, `source_document_id` integer, `audit_note` text DEFAULT '' NOT NULL, `basis_confirmed` integer DEFAULT 0 NOT NULL);

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
, `revenue` real DEFAULT 0 NOT NULL, `gross_margin` real DEFAULT 0 NOT NULL, `fcf_margin` real DEFAULT 0 NOT NULL, `roic` real DEFAULT 0 NOT NULL, `debt` real DEFAULT 0 NOT NULL);

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

CREATE TABLE `screener_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`criteria` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

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
, `currency` text DEFAULT '' NOT NULL, `fx_rate_to_base` real, `reversal_of_transaction_id` integer, `fx_base_currency` text DEFAULT '' NOT NULL);

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

CREATE INDEX `assumption_observations_date_idx` ON `assumption_observations` (`assumption_id`,`observed_date`);

CREATE INDEX `assumptions_company_idx` ON `assumptions` (`company_id`);

CREATE INDEX `companies_industry_idx` ON `companies` (`industry`);

CREATE UNIQUE INDEX `companies_ticker_market_idx` ON `companies` (`ticker`,`market`);

CREATE INDEX `events_event_date_idx` ON `events` (`event_date`);

CREATE INDEX `evidence_assumption_idx` ON `evidence` (`assumption_id`);

CREATE INDEX `evidence_company_idx` ON `evidence` (`company_id`);

CREATE INDEX `financials_company_idx` ON `financials` (`company_id`);

CREATE UNIQUE INDEX `financials_company_year_idx` ON `financials` (`company_id`,`year`);

CREATE INDEX `financials_source_document_idx` ON `financials` (`source_document_id`);

CREATE INDEX `investment_snapshots_company_date_idx` ON `investment_snapshots` (`company_id`,`snapshot_date`);

CREATE INDEX `journal_entry_date_idx` ON `journal` (`entry_date`);

CREATE INDEX `source_documents_company_date_idx` ON `source_documents` (`company_id`,`filing_date`);

CREATE INDEX `tasks_status_idx` ON `tasks` (`status`);

CREATE INDEX `transactions_company_date_idx` ON `transactions` (`company_id`,`trade_date`);

CREATE UNIQUE INDEX `valuations_company_scenario_idx` ON `valuations` (`company_id`,`scenario`);

CREATE TRIGGER financials_validate_source_insert BEFORE INSERT ON financials
WHEN NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id)
  OR (NEW.source_document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM source_documents WHERE id = NEW.source_document_id AND company_id = NEW.company_id))
BEGIN SELECT RAISE(ABORT, 'INVALID_REFERENCE'); END;

CREATE TRIGGER financials_validate_source_update BEFORE UPDATE ON financials
WHEN OLD.company_id != NEW.company_id OR NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id)
  OR (NEW.source_document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM source_documents WHERE id = NEW.source_document_id AND company_id = NEW.company_id))
BEGIN SELECT RAISE(ABORT, 'INVALID_REFERENCE'); END;

CREATE TRIGGER sources_restrict_delete BEFORE DELETE ON source_documents
WHEN EXISTS (SELECT 1 FROM financials WHERE source_document_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'SOURCE_BOUND'); END;

CREATE TRIGGER transactions_no_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_TRANSACTION'); END;

CREATE TRIGGER transactions_no_update BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_TRANSACTION'); END;

CREATE TRIGGER transactions_validate_insert BEFORE INSERT ON transactions
BEGIN
  SELECT CASE WHEN NEW.type NOT IN ('buy','sell') OR NEW.shares <= 0 OR NEW.price < 0 OR NEW.fees < 0 OR NEW.reversal_of_transaction_id IS NOT NULL
    THEN RAISE(ABORT, 'INVALID_TRANSACTION') END;
  SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id AND currency_verified = 1 AND currency = NEW.currency)
    THEN RAISE(ABORT, 'INVALID_REFERENCE') END;
  SELECT CASE WHEN EXISTS (
    SELECT 1 FROM (
      SELECT SUM(CASE WHEN type = 'buy' THEN shares ELSE -shares END)
        OVER (ORDER BY trade_date, id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
      FROM (
        SELECT id, trade_date, type, shares FROM transactions WHERE company_id = NEW.company_id
        UNION ALL SELECT (SELECT COALESCE(MAX(id), 0) + 1 FROM transactions), NEW.trade_date, NEW.type, NEW.shares
      )
    ) WHERE balance < -0.000000001
  ) THEN RAISE(ABORT, 'LEDGER_INVALID') END;
END;

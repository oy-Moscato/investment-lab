CREATE TABLE `app_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `companies` ADD `currency_verified` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `financials` ADD `basis_confirmed` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `currency` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `transactions` ADD `fx_rate_to_base` real;--> statement-breakpoint
ALTER TABLE `transactions` ADD `reversal_of_transaction_id` integer;
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TRIGGER transactions_no_update BEFORE UPDATE ON transactions BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_TRANSACTION'); END;
--> statement-breakpoint
CREATE TRIGGER transactions_no_delete BEFORE DELETE ON transactions BEGIN SELECT RAISE(ABORT, 'IMMUTABLE_TRANSACTION'); END;
--> statement-breakpoint
CREATE TRIGGER sources_restrict_delete BEFORE DELETE ON source_documents
WHEN EXISTS (SELECT 1 FROM financials WHERE source_document_id = OLD.id)
BEGIN SELECT RAISE(ABORT, 'SOURCE_BOUND'); END;
--> statement-breakpoint
CREATE TRIGGER financials_validate_source_insert BEFORE INSERT ON financials
WHEN NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id)
  OR (NEW.source_document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM source_documents WHERE id = NEW.source_document_id AND company_id = NEW.company_id))
BEGIN SELECT RAISE(ABORT, 'INVALID_REFERENCE'); END;
--> statement-breakpoint
CREATE TRIGGER financials_validate_source_update BEFORE UPDATE ON financials
WHEN OLD.company_id != NEW.company_id OR NOT EXISTS (SELECT 1 FROM companies WHERE id = NEW.company_id)
  OR (NEW.source_document_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM source_documents WHERE id = NEW.source_document_id AND company_id = NEW.company_id))
BEGIN SELECT RAISE(ABORT, 'INVALID_REFERENCE'); END;

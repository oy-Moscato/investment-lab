-- Investment Lab public audit snapshot
-- This mirrors the actual D1 bootstrap statements in db/index.ts.
-- The current production schema does not declare FOREIGN KEY constraints;
-- company_id and assumption_id relationships are application-managed.

CREATE TABLE IF NOT EXISTS companies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ticker TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  industry TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT '发现',
  price REAL NOT NULL DEFAULT 0,
  market_cap REAL NOT NULL DEFAULT 0,
  enterprise_value REAL NOT NULL DEFAULT 0,
  fair_value REAL NOT NULL DEFAULT 0,
  conviction INTEGER NOT NULL DEFAULT 0,
  last_research_date TEXT NOT NULL DEFAULT '',
  business_model TEXT NOT NULL DEFAULT '',
  moat_score INTEGER NOT NULL DEFAULT 0,
  moat_evidence TEXT NOT NULL DEFAULT '[]',
  management_name TEXT NOT NULL DEFAULT '',
  management_score INTEGER NOT NULL DEFAULT 0,
  management_notes TEXT NOT NULL DEFAULT '',
  thesis_bull TEXT NOT NULL DEFAULT '',
  thesis_bear TEXT NOT NULL DEFAULT '',
  key_assumptions TEXT NOT NULL DEFAULT '',
  kill_criteria TEXT NOT NULL DEFAULT '',
  is_sample INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS companies_ticker_market_idx ON companies(ticker, market);
CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies(industry);

CREATE TABLE IF NOT EXISTS financials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  year INTEGER NOT NULL,
  revenue REAL NOT NULL DEFAULT 0,
  gross_profit REAL NOT NULL DEFAULT 0,
  operating_income REAL NOT NULL DEFAULT 0,
  net_income REAL NOT NULL DEFAULT 0,
  eps REAL NOT NULL DEFAULT 0,
  operating_cash_flow REAL NOT NULL DEFAULT 0,
  capex REAL NOT NULL DEFAULT 0,
  free_cash_flow REAL NOT NULL DEFAULT 0,
  cash REAL NOT NULL DEFAULT 0,
  debt REAL NOT NULL DEFAULT 0,
  shares_outstanding REAL NOT NULL DEFAULT 0,
  stock_based_compensation REAL NOT NULL DEFAULT 0,
  dividend REAL NOT NULL DEFAULT 0,
  buyback REAL NOT NULL DEFAULT 0,
  roe REAL NOT NULL DEFAULT 0,
  roa REAL NOT NULL DEFAULT 0,
  roic REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  unit_scale INTEGER NOT NULL DEFAULT 1,
  source_document_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS financials_company_year_idx ON financials(company_id, year);
CREATE INDEX IF NOT EXISTS financials_company_idx ON financials(company_id);

CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  trade_date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'buy',
  shares REAL NOT NULL,
  price REAL NOT NULL,
  fees REAL NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  fx_rate_to_base REAL,
  reversal_of_transaction_id INTEGER,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS transactions_company_date_idx ON transactions(company_id, trade_date);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  title TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 2,
  status TEXT NOT NULL DEFAULT '待处理',
  due_date TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  title TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT '复盘',
  event_date TEXT NOT NULL,
  completed INTEGER NOT NULL DEFAULT 0,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date);

CREATE TABLE IF NOT EXISTS journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER,
  entry_date TEXT NOT NULL,
  action TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  judgment TEXT NOT NULL DEFAULT '',
  reasons TEXT NOT NULL DEFAULT '',
  risks TEXT NOT NULL DEFAULT '',
  consensus TEXT NOT NULL DEFAULT '',
  divergence TEXT NOT NULL DEFAULT '',
  conviction INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS journal_entry_date_idx ON journal(entry_date);

CREATE TABLE IF NOT EXISTS industries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  market_size TEXT NOT NULL DEFAULT '',
  cagr TEXT NOT NULL DEFAULT '',
  supply_chain TEXT NOT NULL DEFAULT '',
  upstream TEXT NOT NULL DEFAULT '',
  midstream TEXT NOT NULL DEFAULT '',
  downstream TEXT NOT NULL DEFAULT '',
  key_companies TEXT NOT NULL DEFAULT '',
  competition TEXT NOT NULL DEFAULT '',
  tech_trends TEXT NOT NULL DEFAULT '',
  risks TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS valuations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  scenario TEXT NOT NULL,
  revenue_growth REAL NOT NULL DEFAULT 0.1,
  operating_margin REAL NOT NULL DEFAULT 0.2,
  tax_rate REAL NOT NULL DEFAULT 0.2,
  capex_pct REAL NOT NULL DEFAULT 0.08,
  da_pct REAL NOT NULL DEFAULT 0.03,
  working_capital_pct REAL NOT NULL DEFAULT 0.02,
  wacc REAL NOT NULL DEFAULT 0.09,
  terminal_growth REAL NOT NULL DEFAULT 0.03,
  shares REAL NOT NULL DEFAULT 1,
  fair_value REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS valuations_company_scenario_idx ON valuations(company_id, scenario);

CREATE TABLE IF NOT EXISTS screener_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  criteria TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS investment_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  snapshot_type TEXT NOT NULL DEFAULT 'review',
  snapshot_date TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  position_weight REAL NOT NULL DEFAULT 0,
  conviction INTEGER NOT NULL DEFAULT 0,
  thesis_bull TEXT NOT NULL DEFAULT '',
  thesis_bear TEXT NOT NULL DEFAULT '',
  key_assumptions TEXT NOT NULL DEFAULT '',
  kill_criteria TEXT NOT NULL DEFAULT '',
  fair_value_bear REAL NOT NULL DEFAULT 0,
  fair_value_base REAL NOT NULL DEFAULT 0,
  fair_value_bull REAL NOT NULL DEFAULT 0,
  next_review_date TEXT NOT NULL DEFAULT '',
  revenue REAL NOT NULL DEFAULT 0,
  gross_margin REAL NOT NULL DEFAULT 0,
  fcf_margin REAL NOT NULL DEFAULT 0,
  roic REAL NOT NULL DEFAULT 0,
  debt REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS investment_snapshots_company_date_idx ON investment_snapshots(company_id, snapshot_date);

CREATE TABLE IF NOT EXISTS assumptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  statement TEXT NOT NULL,
  target TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Unknown',
  note TEXT NOT NULL DEFAULT '',
  last_checked_date TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS assumptions_company_idx ON assumptions(company_id);

CREATE TABLE IF NOT EXISTS assumption_observations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assumption_id INTEGER NOT NULL,
  observed_date TEXT NOT NULL,
  status TEXT NOT NULL,
  observed_value TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS assumption_observations_date_idx ON assumption_observations(assumption_id, observed_date);

CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  assumption_id INTEGER,
  claim TEXT NOT NULL,
  polarity TEXT NOT NULL DEFAULT 'support',
  source_type TEXT NOT NULL DEFAULT '笔记',
  source_title TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL DEFAULT '',
  source_date TEXT NOT NULL DEFAULT '',
  note TEXT NOT NULL DEFAULT '',
  conclusion TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS evidence_company_idx ON evidence(company_id);
CREATE INDEX IF NOT EXISTS evidence_assumption_idx ON evidence(assumption_id);

CREATE TABLE IF NOT EXISTS source_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual_note',
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  filing_date TEXT NOT NULL DEFAULT '',
  period_end TEXT NOT NULL DEFAULT '',
  currency TEXT NOT NULL DEFAULT 'USD',
  unit_scale INTEGER NOT NULL DEFAULT 1,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS source_documents_company_idx ON source_documents(company_id);
CREATE INDEX IF NOT EXISTS source_documents_period_idx ON source_documents(company_id, period_end);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

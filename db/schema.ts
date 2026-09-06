import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const companies = sqliteTable(
  "companies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    ticker: text("ticker").notNull(),
    market: text("market").notNull().default(""),
    currency: text("currency").notNull().default("USD"),
    currencyVerified: integer("currency_verified").notNull().default(0),
    country: text("country").notNull().default(""),
    industry: text("industry").notNull().default(""),
    status: text("status").notNull().default("发现"),
    price: real("price").notNull().default(0),
    marketCap: real("market_cap").notNull().default(0),
    enterpriseValue: real("enterprise_value").notNull().default(0),
    fairValue: real("fair_value").notNull().default(0),
    conviction: integer("conviction").notNull().default(0),
    lastResearchDate: text("last_research_date").notNull().default(""),
    businessModel: text("business_model").notNull().default(""),
    moatScore: integer("moat_score").notNull().default(0),
    moatEvidence: text("moat_evidence").notNull().default("[]"),
    managementName: text("management_name").notNull().default(""),
    managementScore: integer("management_score").notNull().default(0),
    managementNotes: text("management_notes").notNull().default(""),
    thesisBull: text("thesis_bull").notNull().default(""),
    thesisBear: text("thesis_bear").notNull().default(""),
    keyAssumptions: text("key_assumptions").notNull().default(""),
    killCriteria: text("kill_criteria").notNull().default(""),
    isSample: integer("is_sample").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    tickerMarketIdx: uniqueIndex("companies_ticker_market_idx").on(
      table.ticker,
      table.market,
    ),
    industryIdx: index("companies_industry_idx").on(table.industry),
  }),
);

export const financials = sqliteTable(
  "financials",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    year: integer("year").notNull(),
    revenue: real("revenue").notNull().default(0),
    grossProfit: real("gross_profit").notNull().default(0),
    operatingIncome: real("operating_income").notNull().default(0),
    netIncome: real("net_income").notNull().default(0),
    eps: real("eps").notNull().default(0),
    operatingCashFlow: real("operating_cash_flow").notNull().default(0),
    capex: real("capex").notNull().default(0),
    freeCashFlow: real("free_cash_flow").notNull().default(0),
    cash: real("cash").notNull().default(0),
    debt: real("debt").notNull().default(0),
    sharesOutstanding: real("shares_outstanding").notNull().default(0),
    stockBasedCompensation: real("stock_based_compensation").notNull().default(0),
    dividend: real("dividend").notNull().default(0),
    buyback: real("buyback").notNull().default(0),
    roe: real("roe").notNull().default(0),
    roa: real("roa").notNull().default(0),
    roic: real("roic").notNull().default(0),
    periodEnd: text("period_end").notNull().default(""),
    filingDate: text("filing_date").notNull().default(""),
    currency: text("currency").notNull().default(""),
    unitScale: text("unit_scale").notNull().default("units"),
    dataStatus: text("data_status").notNull().default("reported"),
    sourceDocumentId: integer("source_document_id"),
    auditNote: text("audit_note").notNull().default(""),
    basisConfirmed: integer("basis_confirmed").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    companyYearIdx: uniqueIndex("financials_company_year_idx").on(
      table.companyId,
      table.year,
    ),
    companyIdx: index("financials_company_idx").on(table.companyId),
    sourceDocumentIdx: index("financials_source_document_idx").on(table.sourceDocumentId),
  }),
);

export const sourceDocuments = sqliteTable(
  "source_documents",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    title: text("title").notNull(),
    sourceType: text("source_type").notNull().default("年报"),
    sourceUrl: text("source_url").notNull().default(""),
    filingDate: text("filing_date").notNull().default(""),
    periodStart: text("period_start").notNull().default(""),
    periodEnd: text("period_end").notNull().default(""),
    currency: text("currency").notNull().default("USD"),
    unitScale: text("unit_scale").notNull().default("millions"),
    note: text("note").notNull().default(""),
    isSample: integer("is_sample").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    companyDateIdx: index("source_documents_company_date_idx").on(
      table.companyId,
      table.filingDate,
    ),
  }),
);

export const transactions = sqliteTable(
  "transactions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    tradeDate: text("trade_date").notNull(),
    type: text("type").notNull().default("buy"),
    shares: real("shares").notNull(),
    price: real("price").notNull(),
    fees: real("fees").notNull().default(0),
    currency: text("currency").notNull().default(""),
    fxRateToBase: real("fx_rate_to_base"),
    fxBaseCurrency: text("fx_base_currency").notNull().default(""),
    reversalOfTransactionId: integer("reversal_of_transaction_id"),
    note: text("note").notNull().default(""),
    ...timestamps,
  },
  (table) => ({
    companyDateIdx: index("transactions_company_date_idx").on(
      table.companyId,
      table.tradeDate,
    ),
  }),
);

export const tasks = sqliteTable(
  "tasks",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id"),
    title: text("title").notNull(),
    priority: integer("priority").notNull().default(2),
    status: text("status").notNull().default("待处理"),
    dueDate: text("due_date").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    statusIdx: index("tasks_status_idx").on(table.status),
  }),
);

export const events = sqliteTable(
  "events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id"),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("复盘"),
    eventDate: text("event_date").notNull(),
    completed: integer("completed").notNull().default(0),
    note: text("note").notNull().default(""),
    ...timestamps,
  },
  (table) => ({
    eventDateIdx: index("events_event_date_idx").on(table.eventDate),
  }),
);

export const journal = sqliteTable(
  "journal",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id"),
    entryDate: text("entry_date").notNull(),
    action: text("action").notNull(),
    price: real("price").notNull().default(0),
    judgment: text("judgment").notNull().default(""),
    reasons: text("reasons").notNull().default(""),
    risks: text("risks").notNull().default(""),
    consensus: text("consensus").notNull().default(""),
    divergence: text("divergence").notNull().default(""),
    conviction: integer("conviction").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    journalDateIdx: index("journal_entry_date_idx").on(table.entryDate),
  }),
);

export const industries = sqliteTable("industries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  marketSize: text("market_size").notNull().default(""),
  cagr: text("cagr").notNull().default(""),
  supplyChain: text("supply_chain").notNull().default(""),
  upstream: text("upstream").notNull().default(""),
  midstream: text("midstream").notNull().default(""),
  downstream: text("downstream").notNull().default(""),
  keyCompanies: text("key_companies").notNull().default(""),
  competition: text("competition").notNull().default(""),
  techTrends: text("tech_trends").notNull().default(""),
  risks: text("risks").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const valuations = sqliteTable(
  "valuations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    scenario: text("scenario").notNull(),
    revenueGrowth: real("revenue_growth").notNull().default(0.1),
    operatingMargin: real("operating_margin").notNull().default(0.2),
    taxRate: real("tax_rate").notNull().default(0.2),
    capexPct: real("capex_pct").notNull().default(0.08),
    daPct: real("da_pct").notNull().default(0.03),
    workingCapitalPct: real("working_capital_pct").notNull().default(0.02),
    wacc: real("wacc").notNull().default(0.09),
    terminalGrowth: real("terminal_growth").notNull().default(0.03),
    shares: real("shares").notNull().default(1),
    fairValue: real("fair_value").notNull().default(0),
    ...timestamps,
  },
  (table) => ({
    companyScenarioIdx: uniqueIndex("valuations_company_scenario_idx").on(
      table.companyId,
      table.scenario,
    ),
  }),
);

export const screenerTemplates = sqliteTable("screener_templates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  criteria: text("criteria").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

// Append-only research history. Current company fields may evolve; these rows never do.
export const investmentSnapshots = sqliteTable(
  "investment_snapshots",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    snapshotType: text("snapshot_type").notNull().default("review"),
    snapshotDate: text("snapshot_date").notNull(),
    price: real("price").notNull().default(0),
    positionWeight: real("position_weight").notNull().default(0),
    conviction: integer("conviction").notNull().default(0),
    thesisBull: text("thesis_bull").notNull().default(""),
    thesisBear: text("thesis_bear").notNull().default(""),
    keyAssumptions: text("key_assumptions").notNull().default(""),
    killCriteria: text("kill_criteria").notNull().default(""),
    fairValueBear: real("fair_value_bear").notNull().default(0),
    fairValueBase: real("fair_value_base").notNull().default(0),
    fairValueBull: real("fair_value_bull").notNull().default(0),
    nextReviewDate: text("next_review_date").notNull().default(""),
    revenue: real("revenue").notNull().default(0),
    grossMargin: real("gross_margin").notNull().default(0),
    fcfMargin: real("fcf_margin").notNull().default(0),
    roic: real("roic").notNull().default(0),
    debt: real("debt").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    companyDateIdx: index("investment_snapshots_company_date_idx").on(
      table.companyId,
      table.snapshotDate,
    ),
  }),
);

export const assumptions = sqliteTable(
  "assumptions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    statement: text("statement").notNull(),
    target: text("target").notNull().default(""),
    status: text("status").notNull().default("Unknown"),
    note: text("note").notNull().default(""),
    lastCheckedDate: text("last_checked_date").notNull().default(""),
    ...timestamps,
  },
  (table) => ({
    companyIdx: index("assumptions_company_idx").on(table.companyId),
  }),
);

export const assumptionObservations = sqliteTable(
  "assumption_observations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    assumptionId: integer("assumption_id").notNull(),
    observedDate: text("observed_date").notNull(),
    status: text("status").notNull(),
    observedValue: text("observed_value").notNull().default(""),
    note: text("note").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    assumptionDateIdx: index("assumption_observations_date_idx").on(
      table.assumptionId,
      table.observedDate,
    ),
  }),
);

export const evidence = sqliteTable(
  "evidence",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id").notNull(),
    assumptionId: integer("assumption_id"),
    claim: text("claim").notNull(),
    polarity: text("polarity").notNull().default("support"),
    sourceType: text("source_type").notNull().default("笔记"),
    sourceTitle: text("source_title").notNull().default(""),
    sourceUrl: text("source_url").notNull().default(""),
    sourceDate: text("source_date").notNull().default(""),
    note: text("note").notNull().default(""),
    conclusion: text("conclusion").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    companyIdx: index("evidence_company_idx").on(table.companyId),
    assumptionIdx: index("evidence_assumption_idx").on(table.assumptionId),
  }),
);

export const appSettings = sqliteTable("app_settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

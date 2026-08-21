import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { assumptions, assumptionObservations, companies, evidence, financials, industries, investmentSnapshots, journal, sourceDocuments, tasks, events, valuations } from "./schema";
import * as schema from "./schema";

export function getDb() {
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS companies (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, ticker TEXT NOT NULL, market TEXT NOT NULL DEFAULT '', country TEXT NOT NULL DEFAULT '', industry TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT '发现', price REAL NOT NULL DEFAULT 0, market_cap REAL NOT NULL DEFAULT 0, enterprise_value REAL NOT NULL DEFAULT 0, fair_value REAL NOT NULL DEFAULT 0, conviction INTEGER NOT NULL DEFAULT 0, last_research_date TEXT NOT NULL DEFAULT '', business_model TEXT NOT NULL DEFAULT '', moat_score INTEGER NOT NULL DEFAULT 0, moat_evidence TEXT NOT NULL DEFAULT '[]', management_name TEXT NOT NULL DEFAULT '', management_score INTEGER NOT NULL DEFAULT 0, management_notes TEXT NOT NULL DEFAULT '', thesis_bull TEXT NOT NULL DEFAULT '', thesis_bear TEXT NOT NULL DEFAULT '', key_assumptions TEXT NOT NULL DEFAULT '', kill_criteria TEXT NOT NULL DEFAULT '', is_sample INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS companies_ticker_market_idx ON companies(ticker, market)`,
  `CREATE INDEX IF NOT EXISTS companies_industry_idx ON companies(industry)`,
  `CREATE TABLE IF NOT EXISTS financials (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, year INTEGER NOT NULL, revenue REAL NOT NULL DEFAULT 0, gross_profit REAL NOT NULL DEFAULT 0, operating_income REAL NOT NULL DEFAULT 0, net_income REAL NOT NULL DEFAULT 0, eps REAL NOT NULL DEFAULT 0, operating_cash_flow REAL NOT NULL DEFAULT 0, capex REAL NOT NULL DEFAULT 0, free_cash_flow REAL NOT NULL DEFAULT 0, cash REAL NOT NULL DEFAULT 0, debt REAL NOT NULL DEFAULT 0, shares_outstanding REAL NOT NULL DEFAULT 0, stock_based_compensation REAL NOT NULL DEFAULT 0, dividend REAL NOT NULL DEFAULT 0, buyback REAL NOT NULL DEFAULT 0, roe REAL NOT NULL DEFAULT 0, roa REAL NOT NULL DEFAULT 0, roic REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS financials_company_year_idx ON financials(company_id, year)`,
  `CREATE INDEX IF NOT EXISTS financials_company_idx ON financials(company_id)`,
  `CREATE TABLE IF NOT EXISTS transactions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, trade_date TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'buy', shares REAL NOT NULL, price REAL NOT NULL, fees REAL NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS transactions_company_date_idx ON transactions(company_id, trade_date)`,
  `CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, title TEXT NOT NULL, priority INTEGER NOT NULL DEFAULT 2, status TEXT NOT NULL DEFAULT '待处理', due_date TEXT NOT NULL DEFAULT '', sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(status)`,
  `CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, title TEXT NOT NULL, kind TEXT NOT NULL DEFAULT '复盘', event_date TEXT NOT NULL, completed INTEGER NOT NULL DEFAULT 0, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS events_event_date_idx ON events(event_date)`,
  `CREATE TABLE IF NOT EXISTS journal (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER, entry_date TEXT NOT NULL, action TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, judgment TEXT NOT NULL DEFAULT '', reasons TEXT NOT NULL DEFAULT '', risks TEXT NOT NULL DEFAULT '', consensus TEXT NOT NULL DEFAULT '', divergence TEXT NOT NULL DEFAULT '', conviction INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS journal_entry_date_idx ON journal(entry_date)`,
  `CREATE TABLE IF NOT EXISTS industries (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, market_size TEXT NOT NULL DEFAULT '', cagr TEXT NOT NULL DEFAULT '', supply_chain TEXT NOT NULL DEFAULT '', upstream TEXT NOT NULL DEFAULT '', midstream TEXT NOT NULL DEFAULT '', downstream TEXT NOT NULL DEFAULT '', key_companies TEXT NOT NULL DEFAULT '', competition TEXT NOT NULL DEFAULT '', tech_trends TEXT NOT NULL DEFAULT '', risks TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS valuations (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, scenario TEXT NOT NULL, revenue_growth REAL NOT NULL DEFAULT 0.1, operating_margin REAL NOT NULL DEFAULT 0.2, tax_rate REAL NOT NULL DEFAULT 0.2, capex_pct REAL NOT NULL DEFAULT 0.08, da_pct REAL NOT NULL DEFAULT 0.03, working_capital_pct REAL NOT NULL DEFAULT 0.02, wacc REAL NOT NULL DEFAULT 0.09, terminal_growth REAL NOT NULL DEFAULT 0.03, shares REAL NOT NULL DEFAULT 1, fair_value REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS valuations_company_scenario_idx ON valuations(company_id, scenario)`,
  `CREATE TABLE IF NOT EXISTS screener_templates (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, criteria TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS investment_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, snapshot_type TEXT NOT NULL DEFAULT 'review', snapshot_date TEXT NOT NULL, price REAL NOT NULL DEFAULT 0, position_weight REAL NOT NULL DEFAULT 0, conviction INTEGER NOT NULL DEFAULT 0, thesis_bull TEXT NOT NULL DEFAULT '', thesis_bear TEXT NOT NULL DEFAULT '', key_assumptions TEXT NOT NULL DEFAULT '', kill_criteria TEXT NOT NULL DEFAULT '', fair_value_bear REAL NOT NULL DEFAULT 0, fair_value_base REAL NOT NULL DEFAULT 0, fair_value_bull REAL NOT NULL DEFAULT 0, next_review_date TEXT NOT NULL DEFAULT '', revenue REAL NOT NULL DEFAULT 0, gross_margin REAL NOT NULL DEFAULT 0, fcf_margin REAL NOT NULL DEFAULT 0, roic REAL NOT NULL DEFAULT 0, debt REAL NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS investment_snapshots_company_date_idx ON investment_snapshots(company_id, snapshot_date)`,
  `CREATE TABLE IF NOT EXISTS assumptions (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, statement TEXT NOT NULL, target TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'Unknown', note TEXT NOT NULL DEFAULT '', last_checked_date TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS assumptions_company_idx ON assumptions(company_id)`,
  `CREATE TABLE IF NOT EXISTS assumption_observations (id INTEGER PRIMARY KEY AUTOINCREMENT, assumption_id INTEGER NOT NULL, observed_date TEXT NOT NULL, status TEXT NOT NULL, observed_value TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS assumption_observations_date_idx ON assumption_observations(assumption_id, observed_date)`,
  `CREATE TABLE IF NOT EXISTS evidence (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, assumption_id INTEGER, claim TEXT NOT NULL, polarity TEXT NOT NULL DEFAULT 'support', source_type TEXT NOT NULL DEFAULT '笔记', source_title TEXT NOT NULL DEFAULT '', source_url TEXT NOT NULL DEFAULT '', source_date TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', conclusion TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS evidence_company_idx ON evidence(company_id)`,
  `CREATE INDEX IF NOT EXISTS evidence_assumption_idx ON evidence(assumption_id)`,
];

async function ensureColumn(table: string, column: string, definition: string) {
  const result = await env.DB.prepare(`PRAGMA table_info(${table})`).all<{ name: string }>();
  if (!(result.results ?? []).some((item) => item.name === column)) {
    await env.DB.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
  }
}

const compatibilityStatements = [
  `CREATE TABLE IF NOT EXISTS source_documents (id INTEGER PRIMARY KEY AUTOINCREMENT, company_id INTEGER NOT NULL, type TEXT NOT NULL DEFAULT 'manual_note', title TEXT NOT NULL, url TEXT NOT NULL DEFAULT '', filing_date TEXT NOT NULL DEFAULT '', period_end TEXT NOT NULL DEFAULT '', currency TEXT NOT NULL DEFAULT 'USD', unit_scale INTEGER NOT NULL DEFAULT 1, verified INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS source_documents_company_idx ON source_documents(company_id)`,
  `CREATE INDEX IF NOT EXISTS source_documents_period_idx ON source_documents(period_end)`,
  `CREATE TABLE IF NOT EXISTS app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
];

const sampleCompanies = [
  {
    name: "NVIDIA", ticker: "NVDA", market: "NASDAQ", country: "美国", currency: "USD", industry: "AI / 半导体", status: "深度研究", price: 0, fairValue: 142, conviction: 8, lastResearchDate: "2026-08-18", isSample: 1,
    businessModel: "以加速计算平台、数据中心系统与软件生态为核心，收入来自芯片、系统和持续的软件开发者生态。\n\n内置研究模板示例：价格与财务数据需要替换为自己的原始资料。",
    moatScore: 4, moatEvidence: JSON.stringify([{ name: "技术壁垒", score: 5, evidence: "CUDA 生态与软硬件协同" }, { name: "平台生态", score: 5, evidence: "开发者工具链带来迁移成本" }, { name: "规模效应", score: 4, evidence: "研发与供应链规模" }, { name: "定价权", score: 4, evidence: "高性能计算需求旺盛" }]),
    managementName: "Jensen Huang / Colette Kress", managementScore: 4, managementNotes: "观察资本配置、供应约束下的交付兑现与股权激励稀释。",
    thesisBull: "AI 基础设施投资持续，软件生态与系统级产品提高客户锁定，长期现金流质量优于单一芯片周期。", thesisBear: "客户自研芯片、竞争对手追赶或 AI 资本开支回报下降，可能压缩增长与估值。", keyAssumptions: "AI 数据中心需求保持高增长；软件生态继续扩张；毛利率保持在高位。", killCriteria: "连续两年核心市场份额下降；ROIC 长期低于资本成本；关键生态被替代。",
  },
  {
    name: "Microsoft", ticker: "MSFT", market: "NASDAQ", country: "美国", currency: "USD", industry: "软件 / 云计算", status: "等待价格", price: 0, fairValue: 505, conviction: 7, lastResearchDate: "2026-08-14", isSample: 1,
    businessModel: "通过生产力软件、云服务、企业平台与开发者工具获得订阅和消费型收入。", moatScore: 5, moatEvidence: JSON.stringify([{ name: "迁移成本", score: 5, evidence: "企业工作流与身份系统深度嵌入" }, { name: "规模效应", score: 5, evidence: "全球云基础设施与销售网络" }, { name: "平台生态", score: 4, evidence: "Azure、GitHub、Office 协同" }]),
    managementName: "Satya Nadella / Amy Hood", managementScore: 4, managementNotes: "重点跟踪云业务资本开支回报与 AI 产品的增量收入。", thesisBull: "企业软件、云基础设施与 AI 助手形成交叉销售，现金流复投资能力强。", thesisBear: "AI 基础设施投入过重、云竞争加剧，或监管限制平台协同。", keyAssumptions: "Azure 增长保持；AI 产品能够带来可量化的付费增量；资本回报稳定。", killCriteria: "云业务连续多个周期增速显著低于预期且利润率恶化；核心产品被替代。",
  },
  {
    name: "ASML", ticker: "ASML", market: "NASDAQ", country: "荷兰", currency: "EUR", industry: "AI / 半导体", status: "正在研究", price: 0, fairValue: 1110, conviction: 6, lastResearchDate: "2026-08-11", isSample: 1,
    businessModel: "提供先进光刻设备、服务与升级，客户集中于晶圆制造商，收入具有设备周期性。", moatScore: 5, moatEvidence: JSON.stringify([{ name: "技术壁垒", score: 5, evidence: "极高复杂度的系统集成与供应链" }, { name: "供应链", score: 5, evidence: "关键部件协同与长期验证" }, { name: "牌照 / 监管", score: 3, evidence: "出口管制是机会也是约束" }]),
    managementName: "Christophe Fouquet / Roger Dassen", managementScore: 4, managementNotes: "需要同时理解订单周期、客户资本开支与出口限制。", thesisBull: "先进制程持续提升设备价值，服务收入与技术复杂度构成长期壁垒。", thesisBear: "客户资本开支周期、地缘政治与出口管制造成订单波动。", keyAssumptions: "先进制程需求持续；服务收入扩大；供应链不出现结构性断裂。", killCriteria: "技术路线发生根本改变；客户集中度风险恶化且新增订单持续萎缩。",
  },
  {
    name: "BYD", ticker: "1211.HK", market: "港股", country: "中国", currency: "HKD", industry: "汽车 / 新能源", status: "初步筛选", price: 0, fairValue: 390, conviction: 5, lastResearchDate: "2026-08-08", isSample: 1,
    businessModel: "覆盖新能源汽车、动力电池与零部件，规模制造与供应链垂直协同是重要变量。", moatScore: 4, moatEvidence: JSON.stringify([{ name: "规模效应", score: 5, evidence: "车型、产能与供应链规模" }, { name: "成本优势", score: 4, evidence: "电池与零部件协同" }, { name: "品牌", score: 3, evidence: "品牌矩阵仍需持续验证" }]),
    managementName: "王传福 / 李柯", managementScore: 4, managementNotes: "重点核对海外市场盈利、渠道效率与价格竞争。", thesisBull: "电动化渗透、垂直整合和海外扩张带来规模与成本优势。", thesisBear: "价格战、海外政策与产能利用率下降压缩回报。", keyAssumptions: "海外销量增长；电池成本曲线延续；价格竞争可控。", killCriteria: "海外业务长期亏损；市场份额连续下降；资本回报跌破资本成本。",
  },
];

const sampleFinancials: Record<string, number[][]> = {
  NVDA: [[2022, 26914, 17475, 5600, 4368, 1.74, 9108, 976, 8132, 19300, 11000, 2500, 120, 0, 400, 14, 9, 17], [2023, 26974, 15633, 4400, 4355, 1.76, 5641, 1833, 3808, 15900, 11100, 2500, 110, 0, 500, 13, 8, 15], [2024, 60922, 46729, 32972, 29760, 12.05, 28090, 1067, 27023, 25900, 22000, 2500, 180, 0, 0, 75, 45, 70], [2025, 130497, 101467, 81453, 72880, 2.94, 64000, 5367, 58633, 43800, 29000, 2440, 300, 0, 0, 115, 72, 105], [2026, 165000, 127000, 100000, 90000, 3.65, 82000, 7000, 75000, 55000, 36000, 2400, 450, 0, 0, 118, 74, 108]],
  MSFT: [[2022, 198270, 135620, 83383, 72738, 9.65, 89035, 23825, 65210, 104757, 61270, 7540, 7540, 0, 10740, 48, 19, 29], [2023, 211915, 146052, 88523, 72361, 9.68, 87582, 28107, 59475, 111256, 59900, 7440, 8000, 0, 13000, 38, 17, 26], [2024, 245122, 168088, 109433, 88136, 11.8, 118548, 44477, 74071, 79566, 78800, 7430, 9600, 0, 15000, 37, 18, 28], [2025, 275000, 190000, 125000, 102000, 13.7, 130000, 50000, 80000, 90000, 90000, 7350, 10500, 0, 16000, 39, 19, 29], [2026, 315000, 218000, 145000, 118000, 15.9, 151000, 57000, 94000, 105000, 100000, 7300, 12000, 0, 17000, 40, 20, 30]],
  ASML: [[2022, 21173, 10740, 6529, 5590, 14.14, 6500, 1290, 5210, 7080, 4700, 4700, 400, 0, 1000, 49, 25, 35], [2023, 27600, 14000, 9000, 7800, 19.8, 9800, 1600, 8200, 8000, 5000, 4600, 420, 0, 1200, 50, 27, 38], [2024, 28400, 15000, 9200, 7800, 19.9, 10500, 1800, 8700, 6000, 5200, 3900, 450, 0, 1400, 45, 24, 35], [2025, 33000, 17700, 11100, 9500, 24.1, 12500, 2100, 10400, 7500, 6000, 3900, 500, 0, 1500, 46, 25, 36], [2026, 39000, 21100, 13500, 11600, 29.4, 14800, 2500, 12300, 9000, 6800, 3850, 550, 0, 1600, 47, 26, 37]],
  "1211.HK": [[2022, 424061, 100000, 29000, 16600, 6.05, 50000, 19000, 31000, 56700, 100000, 28000, 2900, 0, 2000, 16, 5, 11], [2023, 602315, 115000, 36000, 30000, 10.3, 68000, 28000, 40000, 64000, 92000, 35000, 3100, 0, 2500, 22, 7, 14], [2024, 602000, 135000, 48000, 40000, 13.7, 95000, 32000, 63000, 102000, 105000, 42000, 3100, 0, 3000, 27, 9, 18], [2025, 800000, 180000, 65000, 55000, 18.8, 125000, 46000, 79000, 130000, 110000, 50000, 3050, 0, 3200, 29, 10, 19], [2026, 950000, 215000, 80000, 68000, 23.3, 145000, 52000, 93000, 160000, 120000, 55000, 3000, 0, 3500, 30, 11, 20]],
};

function financialValues(values: number[]) {
  const [year, revenue, grossProfit, operatingIncome, netIncome, eps, operatingCashFlow, capex, freeCashFlow, cash, debt, sharesOutstanding, stockBasedCompensation, dividend, buyback, roe, roa, roic] = values;
  return { year, revenue, grossProfit, operatingIncome, netIncome, eps, operatingCashFlow, capex, freeCashFlow, cash, debt, sharesOutstanding, stockBasedCompensation, dividend, buyback, roe, roa, roic };
}

export async function ensureDatabase() {
  if (!env.DB) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  await env.DB.batch(schemaStatements.map((statement) => env.DB.prepare(statement)));
  await env.DB.batch(compatibilityStatements.map((statement) => env.DB.prepare(statement)));
  await ensureColumn("companies", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  await ensureColumn("financials", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  await ensureColumn("financials", "unit_scale", "INTEGER NOT NULL DEFAULT 1");
  await ensureColumn("financials", "source_document_id", "INTEGER");
  await ensureColumn("transactions", "currency", "TEXT NOT NULL DEFAULT 'USD'");
  await ensureColumn("transactions", "fx_rate_to_base", "REAL");
  await ensureColumn("transactions", "reversal_of_transaction_id", "INTEGER");
  const snapshotColumns = await env.DB.prepare("PRAGMA table_info(investment_snapshots)").all<{ name: string }>();
  const existingSnapshotColumns = new Set((snapshotColumns.results ?? []).map((column) => column.name));
  const missingSnapshotColumns = [
    ["revenue", "REAL NOT NULL DEFAULT 0"],
    ["gross_margin", "REAL NOT NULL DEFAULT 0"],
    ["fcf_margin", "REAL NOT NULL DEFAULT 0"],
    ["roic", "REAL NOT NULL DEFAULT 0"],
    ["debt", "REAL NOT NULL DEFAULT 0"],
  ].filter(([name]) => !existingSnapshotColumns.has(name)).map(([name, definition]) => env.DB.prepare(`ALTER TABLE investment_snapshots ADD COLUMN ${name} ${definition}`));
  if (missingSnapshotColumns.length) await env.DB.batch(missingSnapshotColumns);
  const db = getDb();
  const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM companies").first<{ count: number }>();
  if (Number(count?.count ?? 0) === 0) await db.insert(companies).values(sampleCompanies).run();
  const currencyMigration = await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'currency_migration_v1'").first<{ value: string }>();
  if (!currencyMigration) await env.DB.batch([
    env.DB.prepare("UPDATE companies SET currency = 'USD' WHERE is_sample = 1 AND ticker IN ('NVDA', 'MSFT')"),
    env.DB.prepare("UPDATE companies SET currency = 'EUR' WHERE is_sample = 1 AND ticker = 'ASML'"),
    env.DB.prepare("UPDATE companies SET currency = 'HKD' WHERE is_sample = 1 AND ticker = '1211.HK'"),
    env.DB.prepare("UPDATE financials SET currency = (SELECT currency FROM companies WHERE companies.id = financials.company_id) WHERE company_id IS NOT NULL"),
    env.DB.prepare("UPDATE transactions SET currency = (SELECT currency FROM companies WHERE companies.id = transactions.company_id) WHERE company_id IS NOT NULL"),
    env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('currency_migration_v1', '1')"),
  ]);
  await env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('base_currency', 'USD')").run();
  const companyRows = await db.select({ id: companies.id, ticker: companies.ticker, currency: companies.currency, isSample: companies.isSample }).from(companies);
  const companyByTicker = new Map(companyRows.map((row) => [row.ticker, row.id]));
  const unitScaleMigration = await env.DB.prepare("SELECT value FROM app_settings WHERE key = 'unit_scale_migration_v1'").first<{ value: string }>();
  if (!unitScaleMigration) await env.DB.batch([
    env.DB.prepare("UPDATE financials SET unit_scale = 1000000 WHERE company_id IN (SELECT id FROM companies WHERE is_sample = 1)"),
    env.DB.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('unit_scale_migration_v1', '1')"),
  ]);
  const financialRows = Object.entries(sampleFinancials).flatMap(([ticker, rows]) => rows.map((row) => ({ companyId: companyByTicker.get(ticker)!, currency: companyRows.find((company) => company.ticker === ticker)?.currency ?? "USD", unitScale: 1_000_000, ...financialValues(row) })));
  const financialCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM financials").first<{ count: number }>();
  if (Number(financialCount?.count ?? 0) === 0) for (const row of financialRows) await db.insert(financials).values(row).run();
  const sourceDocumentCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM source_documents").first<{ count: number }>();
  if (Number(sourceDocumentCount?.count ?? 0) === 0) {
    for (const company of companyRows.filter((row) => row.isSample === 1 && ["NVDA", "MSFT", "ASML", "1211.HK"].includes(row.ticker))) {
      await db.insert(sourceDocuments).values({ companyId: company.id, type: "demo_annual_report", title: `${company.ticker} FY2025 Annual Report (DEMO DATA)`, url: "", filingDate: "2026-02-01", periodEnd: "2025-12-31", currency: company.currency, unitScale: 1_000_000, verified: 0 }).run();
      await env.DB.prepare("UPDATE financials SET source_document_id = (SELECT id FROM source_documents WHERE company_id = financials.company_id AND period_end = '2025-12-31' ORDER BY id DESC LIMIT 1) WHERE company_id = ? AND year = 2025").bind(company.id).run();
    }
  }

  const taskCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM tasks").first<{ count: number }>();
  if (Number(taskCount?.count ?? 0) === 0) await db.insert(tasks).values([
    { title: "阅读 NVDA 最新年报并记录现金流质量", companyId: companyByTicker.get("NVDA"), priority: 1, status: "待处理", dueDate: "2026-08-28", sortOrder: 1 },
    { title: "比较主要 AI 芯片公司的毛利率与 ROIC", companyId: companyByTicker.get("NVDA"), priority: 2, status: "进行中", dueDate: "2026-09-02", sortOrder: 2 },
    { title: "核对 MSFT AI 资本开支的回报假设", companyId: companyByTicker.get("MSFT"), priority: 1, status: "待处理", dueDate: "2026-09-05", sortOrder: 3 },
    { title: "建立汽车行业竞争格局地图", companyId: companyByTicker.get("1211.HK"), priority: 3, status: "待处理", dueDate: "2026-09-12", sortOrder: 4 },
    { title: "更新 ASML Bear Case 估值", companyId: companyByTicker.get("ASML"), priority: 2, status: "已完成", dueDate: "2026-08-18", sortOrder: 5 },
  ]).run();
  const eventCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM events").first<{ count: number }>();
  if (Number(eventCount?.count ?? 0) === 0) await db.insert(events).values([
    { title: "季度研究复盘：检查所有 Kill Criteria", kind: "复盘", eventDate: "2026-09-01", note: "逐家公司回到原始投资逻辑。" },
    { title: "更新半导体产业链地图", kind: "研究", eventDate: "2026-09-10", note: "加入设备、代工、封装与软件环节。" },
    { title: "MSFT 财报阅读窗口", companyId: companyByTicker.get("MSFT"), kind: "财报", eventDate: "2026-10-25", note: "重点看云业务与 AI 增量。" },
    { title: "年度投资决策回顾", kind: "复盘", eventDate: "2026-12-31", note: "把判断与结果分开评价。" },
  ]).run();
  const industryCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM industries").first<{ count: number }>();
  if (Number(industryCount?.count ?? 0) === 0) await db.insert(industries).values([
    { name: "AI / 半导体", marketSize: "待补充原始资料", cagr: "> 10%（假设）", supplyChain: "设备 → 设计 → 制造 → 封装 → 云计算 → 应用", upstream: "光刻、设备、EDA、材料", midstream: "芯片设计、晶圆制造、封装测试", downstream: "云服务、模型、机器人、企业软件", keyCompanies: "NVDA / ASML / TSM / AMD", competition: "技术迭代快，客户集中度与资本开支周期明显。", techTrends: "加速计算、先进封装、能效、专用 ASIC", risks: "出口管制、周期反转、客户自研、估值过高" },
    { name: "汽车 / 新能源", marketSize: "待补充地区拆分", cagr: "按地区分层", supplyChain: "矿产 → 电池 → 零部件 → 整车 → 渠道 → 售后", upstream: "锂、镍、芯片、材料", midstream: "电池、电驱、智能驾驶、整车", downstream: "消费者、车队、充电与服务", keyCompanies: "BYD / TSLA / CATL / Toyota", competition: "价格、品牌、渠道、软件与制造效率共同竞争。", techTrends: "电池成本、智能驾驶、平台化、海外本地化", risks: "价格战、政策变化、产能过剩、召回" },
    { name: "软件 / 云计算", marketSize: "按席位与消费额拆分", cagr: "待验证", supplyChain: "算力 → 云平台 → 中间件 → 应用 → 工作流", upstream: "芯片、数据中心、网络", midstream: "云服务、开发工具、基础软件", downstream: "企业与个人订阅、AI 应用", keyCompanies: "MSFT / AMZN / GOOGL / ORCL", competition: "留存、迁移成本、生态和销售效率是关键。", techTrends: "AI Agent、云原生、数据治理、垂直 SaaS", risks: "客户降本、平台替代、监管、算力成本" },
  ]).run();
  const journalCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM journal").first<{ count: number }>();
  if (Number(journalCount?.count ?? 0) === 0) await db.insert(journal).values([
    { companyId: companyByTicker.get("NVDA"), entryDate: "2026-08-21", action: "开始研究", price: 0, judgment: "先建立业务与现金流基线，再决定是否进入估值。", reasons: "避免只从股价和新闻开始研究。", risks: "示例记录，不代表真实交易。", consensus: "市场高度关注 AI 资本开支。", divergence: "需要验证软件生态与长期回报是否被高估。", conviction: 7 },
    { companyId: companyByTicker.get("MSFT"), entryDate: "2026-08-14", action: "加入观察名单", price: 0, judgment: "商业质量高，但等待更好的价格与 AI 回报证据。", reasons: "企业工作流、云与开发者生态形成组合壁垒。", risks: "资本开支与监管。", consensus: "AI 将推升云需求。", divergence: "增量利润率仍需用财报验证。", conviction: 6 },
  ]).run();
  const valuationCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM valuations").first<{ count: number }>();
  if (Number(valuationCount?.count ?? 0) === 0) {
    const latestSharesByCompany = new Map<number, { year: number; shares: number }>();
    for (const row of financialRows) {
      if (!row.companyId || !Number.isFinite(row.sharesOutstanding)) continue;
      const previous = latestSharesByCompany.get(row.companyId);
      if (!previous || row.year > previous.year) latestSharesByCompany.set(row.companyId, { year: row.year, shares: row.sharesOutstanding });
    }
    const valuationRows = Array.from(companyByTicker.values()).flatMap((companyId) => {
      const shares = latestSharesByCompany.get(companyId)?.shares ?? 0;
      return [
        { companyId, scenario: "Bear", revenueGrowth: 0.06, operatingMargin: 0.18, taxRate: 0.22, capexPct: 0.1, daPct: 0.03, workingCapitalPct: 0.03, wacc: 0.11, terminalGrowth: 0.02, shares, fairValue: 0 },
        { companyId, scenario: "Base", revenueGrowth: 0.12, operatingMargin: 0.24, taxRate: 0.2, capexPct: 0.08, daPct: 0.03, workingCapitalPct: 0.02, wacc: 0.09, terminalGrowth: 0.03, shares, fairValue: 0 },
        { companyId, scenario: "Bull", revenueGrowth: 0.2, operatingMargin: 0.3, taxRate: 0.2, capexPct: 0.07, daPct: 0.04, workingCapitalPct: 0.015, wacc: 0.085, terminalGrowth: 0.035, shares, fairValue: 0 },
      ];
    });
    for (const row of valuationRows) await db.insert(valuations).values(row).run();
  }
  await env.DB.prepare("UPDATE valuations SET shares = (SELECT f.shares_outstanding FROM financials f WHERE f.company_id = valuations.company_id ORDER BY f.year DESC LIMIT 1) WHERE shares <= 1 AND company_id IN (SELECT id FROM companies WHERE is_sample = 1)").run();

  const snapshotCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM investment_snapshots").first<{ count: number }>();
  if (Number(snapshotCount?.count ?? 0) === 0) {
    const today = "2026-08-21";
    const snapshotRows = sampleCompanies.map((sample) => ({
      companyId: companyByTicker.get(sample.ticker)!,
      snapshotType: "baseline",
      snapshotDate: sample.lastResearchDate || today,
      price: sample.price,
      positionWeight: 0,
      conviction: sample.conviction,
      thesisBull: sample.thesisBull,
      thesisBear: sample.thesisBear,
      keyAssumptions: sample.keyAssumptions,
      killCriteria: sample.killCriteria,
      fairValueBear: Math.round(sample.fairValue * 0.7),
      fairValueBase: sample.fairValue,
      fairValueBull: Math.round(sample.fairValue * 1.3),
      nextReviewDate: "2026-11-21",
      revenue: sampleFinancials[sample.ticker]?.at(-1)?.[1] ?? 0,
      grossMargin: sampleFinancials[sample.ticker]?.at(-1)?.[2] && sampleFinancials[sample.ticker]?.at(-1)?.[1] ? (sampleFinancials[sample.ticker].at(-1)![2] / sampleFinancials[sample.ticker].at(-1)![1]) : 0,
      fcfMargin: sampleFinancials[sample.ticker]?.at(-1)?.[8] && sampleFinancials[sample.ticker]?.at(-1)?.[1] ? (sampleFinancials[sample.ticker].at(-1)![8] / sampleFinancials[sample.ticker].at(-1)![1]) : 0,
      roic: sampleFinancials[sample.ticker]?.at(-1)?.[17] ?? 0,
      debt: sampleFinancials[sample.ticker]?.at(-1)?.[10] ?? 0,
    }));
    for (const row of snapshotRows) await db.insert(investmentSnapshots).values(row).run();
  }

  const assumptionCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM assumptions").first<{ count: number }>();
  if (Number(assumptionCount?.count ?? 0) === 0) {
    const nvda = companyByTicker.get("NVDA");
    const msft = companyByTicker.get("MSFT");
    await db.insert(assumptions).values([
      { companyId: nvda!, statement: "AI 数据中心需求保持高增长", target: "未来 3 年 CAGR > 20%", status: "Stable", note: "跟踪超大规模客户 CapEx、订单与交付。", lastCheckedDate: "2026-08-18" },
      { companyId: nvda!, statement: "CUDA / 软件生态仍然保持迁移成本", target: "开发者与客户替代信号未显著增加", status: "Confirmed", note: "用开发者工具、客户自研芯片与竞品采用验证。", lastCheckedDate: "2026-08-18" },
      { companyId: nvda!, statement: "毛利率维持在高位", target: "Gross Margin > 65%", status: "Weakening", note: "最近年度毛利率变化需要结合系统产品结构调查。", lastCheckedDate: "2026-08-18" },
      { companyId: msft!, statement: "AI 产品带来可量化的增量收入", target: "云业务与 Copilot 付费增长高于投入增速", status: "Unknown", note: "等待财报披露更清晰的增量指标。", lastCheckedDate: "2026-08-14" },
    ]).run();
  }

  const evidenceCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM evidence").first<{ count: number }>();
  if (Number(evidenceCount?.count ?? 0) === 0) {
    const nvda = companyByTicker.get("NVDA");
    const nvdaAssumption = await db.select({ id: assumptions.id }).from(assumptions).where(eq(assumptions.companyId, nvda!)).limit(1);
    await db.insert(evidence).values([
      { companyId: nvda!, assumptionId: nvdaAssumption[0]?.id ?? null, claim: "AI compute demand remains structurally strong", polarity: "support", sourceType: "年报", sourceTitle: "2025 Annual Report · data center demand", sourceDate: "2026-08-18", note: "示例证据：请替换为自己保存的原始资料与页码。", conclusion: "支持，但需要继续检查 CapEx 回报。" },
      { companyId: nvda!, assumptionId: nvdaAssumption[0]?.id ?? null, claim: "Customers increasingly consider alternatives", polarity: "counter", sourceType: "研究笔记", sourceTitle: "Customer / competitor notes", sourceDate: "2026-08-18", note: "反面证据应与支持证据并列，而不是被删掉。", conclusion: "值得进一步调查。" },
    ]).run();
  }

  const observationCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM assumption_observations").first<{ count: number }>();
  if (Number(observationCount?.count ?? 0) === 0) {
    const rows = await db.select({ id: assumptions.id, status: assumptions.status, lastCheckedDate: assumptions.lastCheckedDate }).from(assumptions);
    for (const row of rows) {
      await db.insert(assumptionObservations).values({ assumptionId: row.id, observedDate: row.lastCheckedDate || "2026-08-21", status: row.status, observedValue: "基线记录", note: "初始化时保存的基线状态。" }).run();
    }
  }
}

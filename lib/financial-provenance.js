const aliases = {
  ticker: ["ticker", "symbol", "代码", "股票代码"],
  companyId: ["companyid", "company_id", "公司id", "公司 ID"],
  year: ["year", "年度", "年份"],
  periodEnd: ["periodend", "period_end", "期间结束", "期末"],
  filingDate: ["filingdate", "filing_date", "披露日期"],
  currency: ["currency", "币种"],
  unitScale: ["unitscale", "unit_scale", "单位", "单位规模"],
  dataStatus: ["datastatus", "data_status", "数据状态"],
  sourceDocumentId: ["sourcedocumentid", "source_document_id", "来源id", "来源 ID"],
  auditNote: ["auditnote", "audit_note", "审计备注"],
  revenue: ["revenue", "收入"],
  grossProfit: ["grossprofit", "gross_profit", "毛利"],
  operatingIncome: ["operatingincome", "operating_income", "营业利润"],
  netIncome: ["netincome", "net_income", "净利润"],
  eps: ["eps"],
  operatingCashFlow: ["operatingcashflow", "operating_cash_flow", "经营现金流"],
  capex: ["capex", "资本开支"],
  freeCashFlow: ["freecashflow", "free_cash_flow", "自由现金流"],
  cash: ["cash", "现金"],
  debt: ["debt", "债务"],
  sharesOutstanding: ["sharesoutstanding", "shares_outstanding", "流通股"],
  stockBasedCompensation: ["stockbasedcompensation", "stock_based_compensation", "股权激励"],
  dividend: ["dividend", "分红"],
  buyback: ["buyback", "回购"],
  roe: ["roe"],
  roa: ["roa"],
  roic: ["roic"],
};

const numericFields = [
  "revenue", "grossProfit", "operatingIncome", "netIncome", "eps", "operatingCashFlow", "capex", "freeCashFlow", "cash", "debt",
  "sharesOutstanding", "stockBasedCompensation", "dividend", "buyback", "roe", "roa", "roic", "sourceDocumentId", "companyId", "year",
];

function normalizeHeader(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function parseCsvCells(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; index += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value !== "")) rows.push(row);
      row = []; cell = ""; continue;
    }
    cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function findHeader(headers, field) {
  const candidates = aliases[field].map(normalizeHeader);
  return headers.findIndex((header) => candidates.includes(normalizeHeader(header)));
}

function valueFor(row, headers, field) {
  const index = findHeader(headers, field);
  return index >= 0 ? row[index] ?? "" : "";
}

function numberOrZero(value) {
  if (value === "" || value == null) return 0;
  const parsed = Number(String(value).replaceAll(",", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseFinancialCsv(text) {
  const cells = parseCsvCells(text.replace(/^\uFEFF/, ""));
  if (cells.length < 2) return { rows: [], errors: ["CSV 至少需要一行表头和一行数据"] };
  const headers = cells[0];
  const rows = [];
  const errors = [];
  for (let index = 1; index < cells.length; index += 1) {
    const source = cells[index];
    const record = {
      ticker: valueFor(source, headers, "ticker").toUpperCase(),
      companyId: numberOrZero(valueFor(source, headers, "companyId")),
      year: numberOrZero(valueFor(source, headers, "year")),
      periodEnd: valueFor(source, headers, "periodEnd"),
      filingDate: valueFor(source, headers, "filingDate"),
      currency: valueFor(source, headers, "currency").toUpperCase(),
      unitScale: valueFor(source, headers, "unitScale"),
      dataStatus: valueFor(source, headers, "dataStatus") || "reported",
      sourceDocumentId: numberOrZero(valueFor(source, headers, "sourceDocumentId")),
      auditNote: valueFor(source, headers, "auditNote"),
    };
    for (const field of numericFields) {
      if (["companyId", "year", "sourceDocumentId"].includes(field)) continue;
      record[field] = numberOrZero(valueFor(source, headers, field));
    }
    if (!record.ticker && !record.companyId) errors.push(`第 ${index + 1} 行缺少 ticker 或 companyId`);
    if (!record.year || !Number.isInteger(record.year)) errors.push(`第 ${index + 1} 行的 year 无效`);
    if (!["reported", "derived", "estimate"].includes(record.dataStatus)) errors.push(`第 ${index + 1} 行的 dataStatus 无效`);
    rows.push(record);
  }
  return { rows, errors };
}

export const FINANCIAL_IMPORT_EXAMPLE = "ticker,year,periodEnd,filingDate,currency,unitScale,dataStatus,revenue,grossProfit,freeCashFlow,roic,sourceDocumentId\nNVDA,2025,2025-01-26,2025-02-28,USD,millions,reported,130497,101467,58633,1.15,1";

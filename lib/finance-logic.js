export function validateDcfInputs(values) {
  const errors = [];
  const numericKeys = [
    "revenueGrowth",
    "operatingMargin",
    "taxRate",
    "capexPct",
    "daPct",
    "workingCapitalPct",
    "wacc",
    "terminalGrowth",
    "shares",
  ];
  for (const key of numericKeys) {
    if (!Number.isFinite(Number(values[key]))) errors.push(`${key} 必须是有效数字`);
  }
  if (Number(values.wacc) <= 0 || Number(values.wacc) > 0.5) errors.push("WACC 必须大于 0 且不高于 50%");
  if (Number(values.terminalGrowth) >= Number(values.wacc)) errors.push("Terminal Growth 必须小于 WACC");
  if (Number(values.shares) <= 0) errors.push("Shares Outstanding 必须大于 0");
  return errors;
}

export function calculateDcf(values) {
  const validation = validateDcfInputs(values);
  if (validation.length) throw new Error(validation.join("；"));

  const revenue0 = Number(values.latestRevenue) || 100;
  const netDebt = Number(values.netDebt) || 0;
  let revenue = revenue0;
  let previousNwc = revenue0 * Number(values.workingCapitalPct);
  let pv = 0;
  const forecast = [];

  for (let year = 1; year <= 5; year += 1) {
    revenue *= 1 + Number(values.revenueGrowth);
    const nopat = revenue * Number(values.operatingMargin) * (1 - Number(values.taxRate));
    const da = revenue * Number(values.daPct);
    const capex = revenue * Number(values.capexPct);
    const nwc = revenue * Number(values.workingCapitalPct);
    const deltaNwc = nwc - previousNwc;
    const fcf = nopat + da - capex - deltaNwc;
    pv += fcf / Math.pow(1 + Number(values.wacc), year);
    previousNwc = nwc;
    forecast.push({ year, revenue, fcf, nwc, deltaNwc });
  }

  const terminalFcf = forecast.at(-1)?.fcf ?? 0;
  const terminal = terminalFcf * (1 + Number(values.terminalGrowth)) / (Number(values.wacc) - Number(values.terminalGrowth));
  const enterpriseValue = pv + terminal / Math.pow(1 + Number(values.wacc), 5);
  const equityValue = enterpriseValue - netDebt;
  return {
    enterpriseValue,
    equityValue,
    fairValue: equityValue / Number(values.shares),
    forecast,
  };
}

export function calculateAvailableShares(rows, companyId) {
  let shares = 0;
  for (const row of [...rows]
    .filter((item) => Number(item.companyId) === Number(companyId))
    .sort((a, b) => String(a.tradeDate).localeCompare(String(b.tradeDate)) || Number(a.id) - Number(b.id))) {
    if (row.type === "buy") shares += Number(row.shares) || 0;
    if (row.type === "sell") shares -= Number(row.shares) || 0;
  }
  return Math.max(0, shares);
}

export function validateTransaction(values) {
  const errors = [];
  const type = String(values.type ?? "").trim().toLowerCase();
  const shares = Number(values.shares);
  const price = Number(values.price);
  const availableShares = Number(values.availableShares);

  if (!values.companyExists) errors.push("交易关联的公司不存在");
  if (type !== "buy" && type !== "sell") errors.push("交易类型无效");
  if (!Number.isFinite(shares) || shares <= 0) errors.push("股数必须大于 0");
  if (!Number.isFinite(price) || price < 0) errors.push("价格不能为负数");
  if (type === "sell" && Number.isFinite(availableShares) && shares > availableShares + 1e-9) {
    errors.push(`卖出数量超过可用持仓（可卖 ${availableShares} 股）`);
  }
  return errors;
}

export function portfolioCurrencyStatus(rows, companyCurrency = "USD") {
  const fallback = String(companyCurrency || "USD").trim().toUpperCase();
  const currencies = [...new Set(rows.map((row) => String(row.currency || fallback).trim().toUpperCase()))];
  const mixed = currencies.length !== 1 || currencies[0] !== fallback;
  return { currencies, mixed, currency: mixed ? "MIXED" : currencies[0] || fallback };
}

export function summarizePortfolio(positions, baseCurrency = "USD") {
  const aggregateAvailable = positions.every((position) => (
    position.baseCost !== null &&
    position.baseCurrent !== null &&
    position.baseUnrealized !== null
  ));
  const currencyTotals = {};
  for (const position of positions) {
    const currency = position.currency || "USD";
    const current = currencyTotals[currency] ?? { cost: 0, current: 0, unrealized: 0 };
    current.cost += Number(position.cost) || 0;
    current.current += Number(position.current) || 0;
    current.unrealized += Number(position.unrealized) || 0;
    currencyTotals[currency] = current;
  }
  if (!aggregateAvailable) {
    return { aggregateAvailable: false, baseCurrency, totalCost: null, currentValue: null, unrealized: null, currencyTotals };
  }
  return {
    aggregateAvailable: true,
    baseCurrency,
    totalCost: positions.reduce((sum, position) => sum + (position.baseCost ?? 0), 0),
    currentValue: positions.reduce((sum, position) => sum + (position.baseCurrent ?? 0), 0),
    unrealized: positions.reduce((sum, position) => sum + (position.baseUnrealized ?? 0), 0),
    currencyTotals,
  };
}

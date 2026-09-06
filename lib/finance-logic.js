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
    if (values[key] == null || values[key] === "" || !Number.isFinite(Number(values[key]))) errors.push(`${key} 必须是有效数字`);
  }
  if (Number(values.wacc) <= 0 || Number(values.wacc) > 0.5) errors.push("WACC 必须大于 0 且不高于 50%");
  if (Number(values.terminalGrowth) >= Number(values.wacc)) errors.push("Terminal Growth 必须小于 WACC");
  if (Number(values.shares) <= 0) errors.push("Shares Outstanding 必须大于 0");
  if (Number(values.revenueGrowth) <= -1 || Number(values.terminalGrowth) <= -1) errors.push("增长率必须大于 -100%");
  for (const key of ["taxRate", "capexPct", "daPct"]) if (Number(values[key]) < 0 || Number(values[key]) > 1) errors.push(`${key} 必须介于 0 和 1`);
  if (Math.abs(Number(values.operatingMargin)) > 1 || Math.abs(Number(values.workingCapitalPct)) > 1) errors.push("利润率和营运资本比例必须介于 -100% 和 100%");
  if (Object.hasOwn(values, "latestRevenue") && (!Number.isFinite(values.latestRevenue) || values.latestRevenue < 0)) errors.push("财务收入缺失或无效");
  return errors;
}

export function calculateDcf(values) {
  const validation = validateDcfInputs(values);
  if (validation.length) throw new Error(validation.join("；"));

  if (!Number.isFinite(values.latestRevenue) || values.latestRevenue < 0) throw new Error("财务收入缺失或无效");
  const revenue0 = values.latestRevenue;
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

  const terminalRevenue = revenue * (1 + Number(values.terminalGrowth));
  const terminalFcf = terminalRevenue * (Number(values.operatingMargin) * (1 - Number(values.taxRate)) + Number(values.daPct) - Number(values.capexPct)) - (terminalRevenue - revenue) * Number(values.workingCapitalPct);
  const terminal = terminalFcf / (Number(values.wacc) - Number(values.terminalGrowth));
  const enterpriseValue = pv + terminal / Math.pow(1 + Number(values.wacc), 5);
  const equityValue = enterpriseValue - netDebt;
  return {
    enterpriseValue,
    equityValue,
    fairValue: equityValue / Number(values.shares),
    forecast,
    terminalFcf,
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
  return shares;
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
  const currencies = [...new Set(rows.map((row) => String(row.currency || "UNKNOWN").trim().toUpperCase()))];
  const mixed = currencies.length !== 1 || currencies[0] !== fallback;
  return { currencies, mixed, currency: mixed ? "MIXED" : currencies[0] || fallback };
}

export function summarizePortfolio(positions, baseCurrency = "USD") {
  const aggregateAvailable = positions.every((position) => (
    Number.isFinite(position.baseCost) &&
    Number.isFinite(position.baseCurrent) &&
    Number.isFinite(position.baseUnrealized)
  ));
  const currencyTotals = {};
  for (const position of positions) {
    const currency = position.currency || "USD";
    const current = currencyTotals[currency] ?? { cost: 0, current: 0, unrealized: 0 };
    current.cost += Number(position.cost);
    current.current += Number(position.current);
    current.unrealized += Number(position.unrealized);
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

export function derivePositions(companies, transactions, baseCurrency = 'USD') {
  const ids = [...new Set(transactions.map(row => row.companyId))];
  return ids.map(companyId => {
    const company = companies.find(row => row.id === companyId);
    const rows = transactions.filter(row => row.companyId === companyId).sort((a, b) => a.tradeDate.localeCompare(b.tradeDate) || a.id - b.id);
    const status = portfolioCurrencyStatus(rows, company?.currency || 'UNKNOWN');
    let shares = 0, cost = 0, realized = 0;
    let invalid = status.mixed || !company?.currencyVerified;
    for (const row of rows) {
      if (row.type === 'buy') { shares += row.shares; cost += row.shares * row.price + row.fees; }
      else if (row.type === 'sell') {
        if (row.shares > shares + 1e-9) invalid = true;
        const avg = shares ? cost / shares : 0;
        realized += (row.price - avg) * row.shares - row.fees;
        shares -= row.shares; cost -= avg * row.shares;
      } else invalid = true;
    }
    const avgCost = invalid ? NaN : shares ? cost / shares : 0;
    // No market quote means unknown market value, never an invented cost-price quote.
    const current = !invalid && company?.price > 0 ? shares * company.price : NaN;
    const nativeCost = invalid ? NaN : cost;
    const unrealized = current - nativeCost;
    // Execution FX is not a current FX quote. Cross-currency aggregation awaits a quote model.
    const inBase = !invalid && status.currency === baseCurrency;
    return { companyId, shares, cost: nativeCost, avgCost, current, unrealized, realized: invalid ? NaN : realized,
      currency: status.currency, invalid, fxRateToBase: inBase ? 1 : null,
      baseCost: inBase && Number.isFinite(cost) ? cost : null,
      baseCurrent: inBase && Number.isFinite(current) ? current : null,
      baseUnrealized: inBase && Number.isFinite(unrealized) ? unrealized : null };
  }).filter(row => Math.abs(row.shares) > 1e-9 || row.invalid);
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateAvailableShares,
  calculateDcf,
  portfolioCurrencyStatus,
  summarizePortfolio,
  validateDcfInputs,
  validateTransaction,
} from "../lib/finance-logic.js";

const dcfInputs = {
  revenueGrowth: 0.1,
  operatingMargin: 0.2,
  taxRate: 0.2,
  capexPct: 0.08,
  daPct: 0.03,
  workingCapitalPct: 0.02,
  wacc: 0.09,
  terminalGrowth: 0.03,
  shares: 100,
  latestRevenue: 1_000,
  latestFcf: 100,
  netDebt: 50,
};

test("DCF rejects terminal growth at or above WACC and invalid shares", () => {
  assert.ok(validateDcfInputs({ ...dcfInputs, terminalGrowth: 0.09 }).some((item) => item.includes("Terminal Growth")));
  assert.ok(validateDcfInputs({ ...dcfInputs, shares: 0 }).some((item) => item.includes("Shares Outstanding")));
  assert.throws(() => calculateDcf({ ...dcfInputs, wacc: 0 }), /WACC/);
});

test("DCF uses change in NWC instead of charging the full NWC balance", () => {
  const result = calculateDcf(dcfInputs);
  const firstForecast = result.forecast[0];
  const revenue = 1_000 * 1.1;
  const nopat = revenue * 0.2 * 0.8;
  const da = revenue * 0.03;
  const capex = revenue * 0.08;
  const deltaNwc = revenue * 0.02 - 1_000 * 0.02;
  assert.equal(firstForecast.deltaNwc, deltaNwc);
  assert.equal(firstForecast.fcf, nopat + da - capex - deltaNwc);
});

test("available shares are calculated from the append-only transaction ledger", () => {
  const rows = [
    { id: 1, companyId: 7, tradeDate: "2026-01-01", type: "buy", shares: 10 },
    { id: 2, companyId: 7, tradeDate: "2026-02-01", type: "buy", shares: 5 },
    { id: 3, companyId: 7, tradeDate: "2026-03-01", type: "sell", shares: 4 },
    { id: 4, companyId: 99, tradeDate: "2026-03-01", type: "buy", shares: 100 },
  ];
  assert.equal(calculateAvailableShares(rows, 7), 11);
});

test("transaction validation rejects unknown companies, invalid types, and oversells", () => {
  assert.ok(validateTransaction({ companyExists: false, type: "buy", shares: 1, price: 10 }).includes("交易关联的公司不存在"));
  assert.ok(validateTransaction({ companyExists: true, type: "transfer", shares: 1, price: 10 }).includes("交易类型无效"));
  assert.ok(validateTransaction({ companyExists: true, type: "sell", shares: 11, price: 10, availableShares: 10 }).some((item) => item.includes("卖出数量超过可用持仓")));
  assert.deepEqual(validateTransaction({ companyExists: true, type: "sell", shares: 6, price: 10, availableShares: 6 }), []);
});

test("portfolio summary refuses a fake base-currency total when FX is missing", () => {
  const summary = summarizePortfolio([
    { currency: "USD", cost: 100, current: 120, unrealized: 20, baseCost: 100, baseCurrent: 120, baseUnrealized: 20 },
    { currency: "HKD", cost: 800, current: 900, unrealized: 100, baseCost: null, baseCurrent: null, baseUnrealized: null },
  ], "USD");
  assert.equal(summary.aggregateAvailable, false);
  assert.equal(summary.totalCost, null);
  assert.deepEqual(summary.currencyTotals.HKD, { cost: 800, current: 900, unrealized: 100 });
});

test("historical transaction currency is not silently relabeled after a company currency change", () => {
  const status = portfolioCurrencyStatus([{ currency: "USD" }], "HKD");
  assert.equal(status.mixed, true);
  assert.equal(status.currency, "MIXED");
});

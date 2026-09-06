import { test } from 'node:test';
import assert from 'node:assert/strict';
import { persistAndRefresh } from '../lib/persistence.js';
import { derivePositions, summarizePortfolio, calculateDcf } from '../lib/finance-logic.js';
import { normalizeFinancialRows } from '../lib/financial-basis.js';

test('a rejected write returns failure, so forms retain drafts', async () => {
  let requests = 0;
  const result = await persistAndRefresh({}, async () => { requests++; return Response.json({ error: 'invalid input' }, { status: 400 }); });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid input');
  assert.equal(requests, 1);
});
test('write success followed by read failure is saved-but-stale, never a retryable failed write', async () => {
  let requests = 0;
  const result = await persistAndRefresh({}, async () => ++requests === 1 ? Response.json({ ok: true }) : Response.json({ error: 'offline' }, { status: 503 }));
  assert.equal(result.ok, true);
  assert.equal(result.refreshFailed, true);
  assert.equal(result.data, undefined);
});
test('a lost write response is uncertain and must be checked before retry', async () => {
  const result = await persistAndRefresh({}, async () => { throw new TypeError('network'); });
  assert.equal(result.ok, false);
  assert.equal(result.uncertain, true);
});
test('a zero or missing price is never replaced by average cost', () => {
  const rows = derivePositions([{ id: 1, currency: 'USD', currencyVerified: 1, price: 0 }], [{ id: 1, companyId: 1, currency: 'USD', type: 'buy', tradeDate: '2026-01-01', shares: 10, price: 20, fees: 0 }]);
  assert.equal(rows[0].cost, 200);
  assert.ok(Number.isNaN(rows[0].current));
  assert.equal(summarizePortfolio(rows).aggregateAvailable, false);
});
test('historical execution FX is not reused as a current portfolio quote', () => {
  const rows = derivePositions([{ id: 1, currency: 'HKD', currencyVerified: 1, price: 100 }], [{ id: 1, companyId: 1, currency: 'HKD', type: 'buy', tradeDate: '2026-01-01', shares: 10, price: 80, fees: 0, fxRateToBase: .128 }]);
  assert.equal(rows[0].current, 1000);
  assert.equal(rows[0].baseCurrent, null);
});
test('financial scaling leaves per-share DCF invariant when money and shares scale together', () => {
  const input = { revenueGrowth: .1, operatingMargin: .2, taxRate: .2, capexPct: .08, daPct: .03, workingCapitalPct: .02, wacc: .09, terminalGrowth: .03, shares: 100, latestRevenue: 1000, netDebt: 50 };
  const a = calculateDcf(input), b = calculateDcf({ ...input, shares: 100e6, latestRevenue: 1000e6, netDebt: 50e6 });
  assert.ok(Math.abs(a.fairValue - b.fairValue) < 1e-10);
  assert.throws(() => calculateDcf({ ...input, latestRevenue: undefined }));
});

test('trend inputs normalize millions to units and refuse unconfirmed/mixed currencies', () => {
  const a = { year: 2024, basisConfirmed: 1, currency: 'USD', unitScale: 'millions', revenue: 1, eps: 2, roic: 15 };
  const b = { ...a, year: 2025, unitScale: 'units', revenue: 1200000 };
  const rows = normalizeFinancialRows([a, b]);
  assert.equal(rows[0].revenue, 1000000);
  assert.equal(rows[1].revenue / rows[0].revenue, 1.2);
  assert.equal(rows[0].eps, 2);
  assert.equal(rows[0].roic, 15);
  assert.deepEqual(normalizeFinancialRows([a, { ...b, currency: 'EUR' }]), []);
  assert.deepEqual(normalizeFinancialRows([{ ...a, basisConfirmed: 0 }]), []);
});

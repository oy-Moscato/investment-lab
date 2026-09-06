import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { readFile, readdir, mkdir } from 'node:fs/promises';
import { build } from 'esbuild';
import { Miniflare } from 'miniflare';

let mf, db, handlers, createDataHandlers;
let serial = 0;
const row = { year: 2025, periodEnd: '2025-12-31', currency: 'USD', unitScale: 'millions', dataStatus: 'reported', revenue: 1000, debt: 10, cash: 20, sharesOutstanding: 100 };
const dcf = { scenario: 'Base', revenueGrowth: .1, operatingMargin: .2, taxRate: .2, capexPct: .08, daPct: .03, workingCapitalPct: .02, wacc: .09, terminalGrowth: .03, shares: 100 };

before(async () => {
  await mkdir('.test-build', { recursive: true });
  await build({ entryPoints: ['server/data-service.ts'], outfile: '.test-build/data-service.mjs', bundle: true, format: 'esm', platform: 'node', packages: 'external' });
  ({ createDataHandlers } = await import('../.test-build/data-service.mjs'));
  mf = new Miniflare({ modules: true, script: 'export default { fetch() { return new Response("test"); } }', d1Databases: ['DB', 'LEGACY'], compatibilityDate: '2026-05-01' });
  db = await mf.getD1Database('DB');
  for (const file of (await readdir('drizzle')).filter(f => f.endsWith('.sql')).sort()) {
    const sql = await readFile(`drizzle/${file}`, 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').filter(s => s.trim())) await db.prepare(statement).run();
  }
  handlers = createDataHandlers(db);
});
after(async () => { await mf?.dispose(); });
async function post(payload, handler = handlers) {
  const response = await handler.POST(new Request('http://local/api/data', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) }));
  return { status: response.status, body: await response.json() };
}
async function company(currency = 'USD') {
  const ticker = `TEST${++serial}`;
  assert.equal((await post({ action: 'create_company', name: `Synthetic fixture ${serial}`, ticker, currency })).status, 200);
  return db.prepare('SELECT * FROM companies WHERE ticker = ?').bind(ticker).first();
}
async function trade(c, type, shares, tradeDate = '2026-02-01') {
  return post({ action: 'create_transaction', companyId: c.id, type, shares, price: 10, fees: 0, currency: c.currency, tradeDate });
}

test('GET on an empty database does not create demo, sources, tasks or snapshots', async () => {
  const data = await (await handlers.GET()).json();
  for (const key of ['companies', 'financials', 'sourceDocuments', 'tasks', 'snapshots']) assert.deepEqual(data[key], []);
});

test('source and financial writes survive fresh handler instances; linked deletion is rejected', async () => {
  const c = await company();
  assert.equal((await post({ action: 'create_source_document', companyId: c.id, title: 'Synthetic report', currency: 'USD', unitScale: 'millions' })).status, 200);
  const source = await db.prepare('SELECT id FROM source_documents WHERE company_id = ?').bind(c.id).first();
  assert.equal((await post({ action: 'create_financial', companyId: c.id, ...row, sourceDocumentId: source.id })).status, 200);
  const fresh = await (await createDataHandlers(db).GET()).json();
  assert.equal(fresh.financials.find(f => f.companyId === c.id).revenue, 1000);
  assert.equal((await post({ action: 'delete_source_document', id: source.id })).status, 409);
  const financial = fresh.financials.find(f => f.companyId === c.id);
  assert.equal((await post({ action: 'update_financial', id: financial.id, companyId: c.id, sourceDocumentId: null })).status, 200);
  assert.equal((await post({ action: 'delete_source_document', id: source.id })).status, 200);
});

test('company metadata edits create no snapshots; explicit snapshot does', async () => {
  const c = await company();
  const current = (await (await handlers.GET()).json()).companies.find(x => x.id === c.id);
  assert.equal((await post({ action: 'update_company', ...current, name: 'Renamed fixture' })).status, 200);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM investment_snapshots WHERE company_id = ?').bind(c.id).first()).n, 0);
  assert.equal((await post({ action: 'create_snapshot', companyId: c.id, snapshotDate: '2026-02-01' })).status, 200);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM investment_snapshots WHERE company_id = ?').bind(c.id).first()).n, 1);
});

test('oversell and backdated sell are rejected, full liquidation remains valid', async () => {
  const c = await company();
  assert.equal((await trade(c, 'buy', 10)).status, 200);
  assert.equal((await trade(c, 'sell', 11, '2026-03-01')).status, 400);
  assert.equal((await trade(c, 'sell', 1, '2026-01-01')).status, 400);
  assert.equal((await trade(c, 'sell', 4, '2026-03-01')).status, 200);
  assert.equal((await trade(c, 'sell', 6, '2026-03-02')).status, 200);
});

test('concurrent sells cannot both spend the same available shares', async () => {
  const c = await company();
  await trade(c, 'buy', 10);
  const results = await Promise.all([trade(c, 'sell', 7), trade(c, 'sell', 7)]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 400]);
  const balance = await db.prepare("SELECT SUM(CASE WHEN type='buy' THEN shares ELSE -shares END) n FROM transactions WHERE company_id=?").bind(c.id).first();
  assert.equal(balance.n, 3);
});

test('non-finite price, negative fee, invalid date/type and unimplemented reversal cannot enter ledger', async () => {
  const c = await company();
  for (const patch of [{ price: 'nonsense' }, { price: null }, { fees: -1 }, { tradeDate: '2026-02-30' }, { type: 'transfer' }, { reversalOfTransactionId: 1 }]) {
    const response = await post({ action: 'create_transaction', companyId: c.id, type: 'buy', shares: 1, price: 1, tradeDate: '2026-02-01', ...patch });
    assert.equal(response.status, 400, JSON.stringify(patch));
  }
});

test('CSV ticker is never replaced by page company; ambiguous tickers and mismatched IDs reject', async () => {
  const a = await company(), b = await company();
  assert.equal((await post({ action: 'import_financial_csv', companyId: a.id, rows: [{ ...row, ticker: b.ticker }] })).status, 200);
  assert.equal((await db.prepare('SELECT company_id FROM financials WHERE company_id=?').bind(b.id).first()).company_id, b.id);
  assert.equal((await post({ action: 'import_financial_csv', rows: [{ ...row, ticker: b.ticker, companyId: a.id }] })).status, 400);
});

test('CSV duplicate rows, invalid numbers and cross-company sources leave zero partial inserts', async () => {
  const a = await company(), b = await company();
  await post({ action: 'create_source_document', companyId: b.id, title: 'Other company report', currency: 'USD', unitScale: 'millions' });
  const source = await db.prepare('SELECT id FROM source_documents WHERE company_id=?').bind(b.id).first();
  for (const rows of [[{ ...row, year: 2023 }, { ...row, year: 2023 }], [{ ...row, year: 2023 }, { ...row, revenue: 'bad' }], [{ ...row, year: 2023 }, { ...row, sourceDocumentId: source.id }]]) {
    assert.ok([400, 409].includes((await post({ action: 'import_financial_csv', companyId: a.id, rows })).status));
    assert.equal((await db.prepare('SELECT COUNT(*) n FROM financials WHERE company_id=?').bind(a.id).first()).n, 0);
  }
});

test('database failure midway through a CSV batch rolls back earlier inserts', async (t) => {
  t.mock.method(console, 'error', () => {});
  const c = await company();
  await db.prepare(`CREATE TRIGGER test_fail_row BEFORE INSERT ON financials WHEN NEW.company_id = ${c.id} AND NEW.year = 2031 BEGIN SELECT RAISE(ABORT, 'injected_failure'); END;`).run();
  const result = await post({ action: 'import_financial_csv', companyId: c.id, rows: [{ ...row, year: 2030 }, { ...row, year: 2031 }] });
  assert.equal(result.status, 500);
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM financials WHERE company_id=?').bind(c.id).first()).n, 0);
});

test('insert conflicts never overwrite; explicit updates retain omitted fields', async () => {
  const c = await company();
  await post({ action: 'create_financial', companyId: c.id, ...row });
  assert.equal((await post({ action: 'import_financial_csv', companyId: c.id, rows: [{ ...row, revenue: 999 }] })).status, 409);
  assert.equal((await post({ action: 'import_financial_csv', companyId: c.id, mode: 'upsert', rows: [{ year: 2025, revenue: 1200 }] })).status, 200);
  const saved = await db.prepare('SELECT revenue, debt FROM financials WHERE company_id=?').bind(c.id).first();
  assert.deepEqual(saved, { revenue: 1200, debt: 10 });
});

test('financial updates cannot move another company record', async () => {
  const a = await company(), b = await company();
  await post({ action: 'create_financial', companyId: a.id, ...row });
  const f = await db.prepare('SELECT id FROM financials WHERE company_id=?').bind(a.id).first();
  assert.equal((await post({ action: 'update_financial', id: f.id, companyId: b.id, ...row })).status, 404);
});

test('DCF rejects missing data, currency mismatch, bad parameters and ignores client fairValue', async () => {
  const c = await company();
  assert.equal((await post({ action: 'save_valuation', companyId: c.id, ...dcf })).status, 400);
  await post({ action: 'create_financial', companyId: c.id, ...row });
  for (const patch of [{ wacc: .03 }, { taxRate: 2 }, { shares: null }, { revenueGrowth: 'bad' }]) assert.equal((await post({ action: 'save_valuation', companyId: c.id, ...dcf, ...patch })).status, 400);
  assert.equal((await post({ action: 'save_valuation', companyId: c.id, ...dcf, fairValue: 999999 })).status, 200);
  const saved = await db.prepare('SELECT fair_value FROM valuations WHERE company_id=?').bind(c.id).first();
  assert.ok(saved.fair_value > 0 && saved.fair_value < 999999);
  const foreign = await company('HKD');
  await post({ action: 'create_financial', companyId: foreign.id, ...row });
  assert.equal((await post({ action: 'save_valuation', companyId: foreign.id, ...dcf })).status, 400);
});

test('old financial basis is preserved and remains explicitly unconfirmed', async () => {
  const c = await company();
  await db.prepare('INSERT INTO financials(company_id,year,revenue) VALUES(?,?,?)').bind(c.id, 2020, 321).run();
  await handlers.GET(); await handlers.GET();
  const legacy = await db.prepare('SELECT revenue,basis_confirmed,source_document_id FROM financials WHERE company_id=?').bind(c.id).first();
  assert.deepEqual(legacy, { revenue: 321, basis_confirmed: 0, source_document_id: null });
});

test('version-4 schema upgrades preserve old records without assigning invented provenance', async () => {
  const legacy = await mf.getD1Database('LEGACY');
  const names = (await readdir('drizzle')).filter(f => f.endsWith('.sql')).sort();
  const apply = async name => {
    for (const statement of (await readFile(`drizzle/${name}`, 'utf8')).split('--> statement-breakpoint').filter(s => s.trim())) await legacy.prepare(statement).run();
  };
  for (const name of names.slice(0, 3)) await apply(name);
  await legacy.batch([
    legacy.prepare("INSERT INTO companies(id,name,ticker) VALUES(1,'Legacy synthetic fixture','LEGACY')"),
    legacy.prepare('INSERT INTO financials(company_id,year,revenue,shares_outstanding) VALUES(1,2024,12345,567)'),
    legacy.prepare("INSERT INTO transactions(company_id,trade_date,type,shares,price) VALUES(1,'2025-01-01','buy',10,20)"),
    legacy.prepare("INSERT INTO journal(company_id,entry_date,action,judgment) VALUES(1,'2025-01-01','research','Preserve this synthetic note')"),
  ]);
  for (const name of names.slice(3)) await apply(name);
  const data = await (await createDataHandlers(legacy).GET()).json();
  assert.equal(data.financials[0].revenue, 12345);
  assert.equal(data.financials[0].sharesOutstanding, 567);
  assert.equal(data.financials[0].basisConfirmed, 0);
  assert.equal(data.financials[0].sourceDocumentId, null);
  assert.equal(data.companies[0].currencyVerified, 0);
  assert.equal(data.transactions[0].currency, '');
  assert.equal(data.transactions[0].shares, 10);
  assert.equal(data.journal[0].judgment, 'Preserve this synthetic note');
  assert.deepEqual(data.sourceDocuments, []);
});

test('changing portfolio base currency does not relabel execution FX history', async () => {
  const c = await company('HKD');
  assert.equal((await post({ action: 'create_transaction', companyId: c.id, type: 'buy', shares: 1, price: 80, tradeDate: '2026-01-01', fxRateToBase: .128 })).status, 200);
  await post({ action: 'update_settings', baseCurrency: 'EUR' });
  const historical = await db.prepare('SELECT fx_base_currency FROM transactions WHERE company_id=?').bind(c.id).first();
  assert.equal(historical.fx_base_currency, 'USD');
  await post({ action: 'update_settings', baseCurrency: 'USD' });
});

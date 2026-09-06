// Local-only setup. This file has no remote D1/Cloudflare credentials or remote mode.
import { Miniflare } from 'miniflare';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const mf = new Miniflare({
  modules: true, script: 'export default { fetch() { return new Response("local setup"); } }',
  compatibilityDate: '2026-05-15',
  defaultPersistRoot: resolve('.wrangler/state/v3'),
  d1Databases: { DB: '00000000-0000-4000-8000-000000000000' },
});
try {
  const db = await mf.getD1Database('DB');
  await db.prepare('CREATE TABLE IF NOT EXISTS __preview_migrations (name TEXT PRIMARY KEY)').run();
  for (const name of (await readdir('drizzle')).filter(f => f.endsWith('.sql')).sort()) {
    if (await db.prepare('SELECT name FROM __preview_migrations WHERE name = ?').bind(name).first()) continue;
    const sql = await readFile(`drizzle/${name}`, 'utf8');
    const statements = sql.split('--> statement-breakpoint').filter(s => s.trim()).map(s => db.prepare(s));
    await db.batch([...statements, db.prepare('INSERT INTO __preview_migrations(name) VALUES (?)').bind(name)]);
    console.log(`Applied local migration ${name}`);
  }
  if (process.argv.includes('--demo')) {
    if ((await db.prepare('SELECT COUNT(*) n FROM companies').first()).n > 0) {
      console.log('Local database has records; demo seed skipped.');
    } else {
      await db.batch([
        db.prepare("INSERT INTO companies(id,name,ticker,market,currency,currency_verified,industry,price,is_sample,business_model) VALUES(1,'演示科技（虚构）','DEMOUSD','演示市场','USD',1,'软件',12,1,'仅用于界面与计算验证的虚构公司。')"),
        db.prepare("INSERT INTO companies(id,name,ticker,market,currency,currency_verified,industry,price,is_sample,business_model) VALUES(2,'演示工业（虚构）','DEMOHKD','演示市场','HKD',1,'工业',80,1,'仅用于混合币种验证的虚构公司。')"),
        db.prepare("INSERT INTO source_documents(id,company_id,title,source_type,currency,unit_scale,is_sample,note) VALUES(1,1,'虚构财报 · 演示数据','DEMO DATA','USD','millions',1,'合成数据，不能用于投资判断')"),
        db.prepare("INSERT INTO financials(company_id,year,revenue,operating_income,net_income,free_cash_flow,shares_outstanding,cash,debt,currency,unit_scale,period_end,data_status,source_document_id,basis_confirmed) VALUES(1,2025,1000,200,160,150,100,20,10,'USD','millions','2025-12-31','estimate',1,1)"),
        db.prepare("INSERT INTO transactions(company_id,trade_date,type,shares,price,currency) VALUES(1,'2026-01-01','buy',10,10,'USD')"),
        db.prepare("INSERT INTO transactions(company_id,trade_date,type,shares,price,currency) VALUES(2,'2026-01-01','buy',20,60,'HKD')"),
      ]);
      console.log('Added two explicitly fictional local demo companies.');
    }
  }
} finally { await mf.dispose(); }

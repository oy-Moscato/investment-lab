import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle, type AnyD1Database } from "drizzle-orm/d1";
import * as schema from "../db/schema";
import { currency, date, financialValues, numeric, positiveId, sourceValues, InputError } from "../lib/validation.js";
import { calculateDcf, validateDcfInputs, validateTransaction } from "../lib/finance-logic.js";
import {
  assumptions,
  assumptionObservations,
  companies,
  evidence,
  events,
  financials,
  industries,
  investmentSnapshots,
  journal,
  screenerTemplates,
  sourceDocuments,
  tasks,
  transactions,
  valuations,
  appSettings,
} from "../db/schema";

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function integerValue(value: unknown, fallback = 0) {
  return Math.round(numberValue(value, fallback));
}

function nullableId(value: unknown) {
  const id = integerValue(value, 0);
  return id > 0 ? id : null;
}

const supportedScenarios = new Set(["Bear", "Base", "Bull"]);
function currencyValue(value: unknown, fallback = "USD") { return currency(value === undefined ? fallback : value); }

export function createDataHandlers(binding: AnyD1Database) {
const db = drizzle(binding, { schema });
async function GET() {
  try {
    const [companyRows, financialRows, transactionRows, taskRows, eventRows, journalRows, industryRows, valuationRows, templateRows, snapshotRows, assumptionRows, observationRows, evidenceRows, sourceDocumentRows, settingRows] = await Promise.all([
      db.select().from(companies).orderBy(asc(companies.name)),
      db.select().from(financials).orderBy(asc(financials.companyId), asc(financials.year)),
      db.select().from(transactions).orderBy(desc(transactions.tradeDate), desc(transactions.id)),
      db.select().from(tasks).orderBy(asc(tasks.status), asc(tasks.priority), asc(tasks.sortOrder)),
      db.select().from(events).orderBy(asc(events.eventDate)),
      db.select().from(journal).orderBy(desc(journal.entryDate), desc(journal.id)),
      db.select().from(industries).orderBy(asc(industries.name)),
      db.select().from(valuations).orderBy(asc(valuations.companyId), asc(valuations.scenario)),
      db.select().from(screenerTemplates).orderBy(desc(screenerTemplates.id)),
      db.select().from(investmentSnapshots).orderBy(desc(investmentSnapshots.snapshotDate), desc(investmentSnapshots.id)),
      db.select().from(assumptions).orderBy(asc(assumptions.companyId), asc(assumptions.id)),
      db.select().from(assumptionObservations).orderBy(desc(assumptionObservations.observedDate), desc(assumptionObservations.id)),
      db.select().from(evidence).orderBy(desc(evidence.sourceDate), desc(evidence.id)),
      db.select().from(sourceDocuments).orderBy(desc(sourceDocuments.periodEnd), desc(sourceDocuments.id)),
      db.select().from(appSettings).orderBy(asc(appSettings.key)),
    ]);
    const baseCurrency = settingRows.find((row) => row.key === "base_currency")?.value ?? "USD";
    return Response.json({ companies: companyRows, financials: financialRows, transactions: transactionRows, tasks: taskRows, events: eventRows, journal: journalRows, industries: industryRows, valuations: valuationRows, templates: templateRows, snapshots: snapshotRows, assumptions: assumptionRows, observations: observationRows, evidence: evidenceRows, sourceDocuments: sourceDocumentRows, settings: { baseCurrency: currencyValue(baseCurrency) } });
  } catch (error) {
    console.error("Investment Lab data load failed", error);
    return Response.json({ error: "数据加载失败，请重试；数据库升级状态需要由维护者核对" }, { status: 500 });
  }
}

async function POST(request: Request) {
  try {
    let payload: Record<string, unknown>;
    try { payload = await request.json(); } catch { throw new InputError("请求正文必须是 JSON"); }
    if (!payload || Array.isArray(payload) || typeof payload !== "object") throw new InputError("请求正文无效");
    const action = textValue(payload.action);

    if (action === "create_company") {
      const name = textValue(payload.name);
      const ticker = textValue(payload.ticker).toUpperCase();
      if (!name || !ticker) return Response.json({ error: "公司名称和股票代码不能为空" }, { status: 400 });
      await db.insert(companies).values({
        name, ticker, market: textValue(payload.market, "未设置"), country: textValue(payload.country, "未设置"), currency: currencyValue(payload.currency), currencyVerified: 1, industry: textValue(payload.industry, "未分类"), status: textValue(payload.status, "发现"), price: numberValue(payload.price), fairValue: numberValue(payload.fairValue), conviction: integerValue(payload.conviction), lastResearchDate: textValue(payload.lastResearchDate), businessModel: textValue(payload.businessModel), isSample: 0,
      }).run();
    } else if (action === "update_company") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "公司 ID 无效" }, { status: 400 });
      const current = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      if (!current[0]) return Response.json({ error: "公司不存在" }, { status: 404 });
      await db.update(companies).set({
        name: textValue(payload.name), ticker: textValue(payload.ticker).toUpperCase(), market: textValue(payload.market), country: textValue(payload.country), currency: currencyValue(payload.currency, current[0].currency), currencyVerified: payload.currency !== undefined ? 1 : current[0].currencyVerified, industry: textValue(payload.industry), status: textValue(payload.status), price: numberValue(payload.price), marketCap: numberValue(payload.marketCap), enterpriseValue: numberValue(payload.enterpriseValue), fairValue: numberValue(payload.fairValue), conviction: integerValue(payload.conviction), lastResearchDate: textValue(payload.lastResearchDate), businessModel: textValue(payload.businessModel), moatScore: integerValue(payload.moatScore), moatEvidence: textValue(payload.moatEvidence, "[]"), managementName: textValue(payload.managementName), managementScore: integerValue(payload.managementScore), managementNotes: textValue(payload.managementNotes), thesisBull: textValue(payload.thesisBull), thesisBear: textValue(payload.thesisBear), keyAssumptions: textValue(payload.keyAssumptions), killCriteria: textValue(payload.killCriteria), updatedAt: new Date().toISOString(),
      }).where(eq(companies.id, id)).run();
    } else if (action === "create_task") {
      const title = textValue(payload.title);
      if (!title) return Response.json({ error: "任务内容不能为空" }, { status: 400 });
      await db.insert(tasks).values({ companyId: nullableId(payload.companyId), title, priority: integerValue(payload.priority, 2), status: textValue(payload.status, "待处理"), dueDate: textValue(payload.dueDate), sortOrder: integerValue(payload.sortOrder) }).run();
    } else if (action === "update_task") {
      const id = integerValue(payload.id);
      await db.update(tasks).set({ title: textValue(payload.title), priority: integerValue(payload.priority, 2), status: textValue(payload.status, "待处理"), dueDate: textValue(payload.dueDate), companyId: nullableId(payload.companyId), updatedAt: new Date().toISOString() }).where(eq(tasks.id, id)).run();
    } else if (action === "delete_task") {
      await db.delete(tasks).where(eq(tasks.id, integerValue(payload.id))).run();
    } else if (action === "create_event") {
      const title = textValue(payload.title);
      const eventDate = textValue(payload.eventDate);
      if (!title || !eventDate) return Response.json({ error: "事件标题和日期不能为空" }, { status: 400 });
      await db.insert(events).values({ companyId: nullableId(payload.companyId), title, kind: textValue(payload.kind, "复盘"), eventDate, note: textValue(payload.note) }).run();
    } else if (action === "toggle_event") {
      await db.update(events).set({ completed: integerValue(payload.completed) ? 0 : 1, updatedAt: new Date().toISOString() }).where(eq(events.id, integerValue(payload.id))).run();
    } else if (action === "create_journal") {
      const judgment = textValue(payload.judgment);
      if (!judgment) return Response.json({ error: "判断内容不能为空" }, { status: 400 });
      await db.insert(journal).values({ companyId: nullableId(payload.companyId), entryDate: textValue(payload.entryDate, new Date().toISOString().slice(0, 10)), action: textValue(payload.actionLabel, "研究记录"), price: numberValue(payload.price), judgment, reasons: textValue(payload.reasons), risks: textValue(payload.risks), consensus: textValue(payload.consensus), divergence: textValue(payload.divergence), conviction: integerValue(payload.conviction) }).run();
    } else if (action === "create_snapshot") {
      const companyId = integerValue(payload.companyId);
      if (!companyId) return Response.json({ error: "快照必须关联公司" }, { status: 400 });
      const latestFinancial = await db.select().from(financials).where(eq(financials.companyId, companyId)).orderBy(desc(financials.year)).limit(1);
      const financial = latestFinancial[0];
      await db.insert(investmentSnapshots).values({
        companyId,
        snapshotType: textValue(payload.snapshotType, "review"),
        snapshotDate: textValue(payload.snapshotDate, new Date().toISOString().slice(0, 10)),
        price: numberValue(payload.price),
        positionWeight: numberValue(payload.positionWeight),
        conviction: integerValue(payload.conviction),
        thesisBull: textValue(payload.thesisBull),
        thesisBear: textValue(payload.thesisBear),
        keyAssumptions: textValue(payload.keyAssumptions),
        killCriteria: textValue(payload.killCriteria),
        fairValueBear: numberValue(payload.fairValueBear),
        fairValueBase: numberValue(payload.fairValueBase),
        fairValueBull: numberValue(payload.fairValueBull),
        nextReviewDate: textValue(payload.nextReviewDate),
        revenue: numberValue(payload.revenue, financial?.revenue ?? 0),
        grossMargin: numberValue(payload.grossMargin, financial?.revenue ? financial.grossProfit / financial.revenue : 0),
        fcfMargin: numberValue(payload.fcfMargin, financial?.revenue ? financial.freeCashFlow / financial.revenue : 0),
        roic: numberValue(payload.roic, financial?.roic ?? 0),
        debt: numberValue(payload.debt, financial?.debt ?? 0),
      }).run();
    } else if (action === "create_assumption") {
      const companyId = integerValue(payload.companyId);
      const statement = textValue(payload.statement);
      if (!companyId || !statement) return Response.json({ error: "假设必须关联公司并填写内容" }, { status: 400 });
      await db.insert(assumptions).values({ companyId, statement, target: textValue(payload.target), status: textValue(payload.status, "Unknown"), note: textValue(payload.note), lastCheckedDate: textValue(payload.lastCheckedDate, new Date().toISOString().slice(0, 10)) }).run();
    } else if (action === "update_assumption") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "假设 ID 无效" }, { status: 400 });
      await db.update(assumptions).set({ statement: textValue(payload.statement), target: textValue(payload.target), status: textValue(payload.status, "Unknown"), note: textValue(payload.note), lastCheckedDate: textValue(payload.lastCheckedDate, new Date().toISOString().slice(0, 10)), updatedAt: new Date().toISOString() }).where(eq(assumptions.id, id)).run();
    } else if (action === "create_assumption_observation") {
      const assumptionId = integerValue(payload.assumptionId);
      const status = textValue(payload.status, "Unknown");
      if (!assumptionId) return Response.json({ error: "观察记录必须关联假设" }, { status: 400 });
      const observedDate = textValue(payload.observedDate, new Date().toISOString().slice(0, 10));
      const observedValue = textValue(payload.observedValue);
      const note = textValue(payload.note);
      const existingObservation = await db
        .select({ id: assumptionObservations.id })
        .from(assumptionObservations)
        .where(and(
          eq(assumptionObservations.assumptionId, assumptionId),
          eq(assumptionObservations.observedDate, observedDate),
          eq(assumptionObservations.status, status),
          eq(assumptionObservations.observedValue, observedValue),
          eq(assumptionObservations.note, note),
        ))
        .limit(1);
      if (!existingObservation[0]) {
        await db.insert(assumptionObservations).values({ assumptionId, observedDate, status, observedValue, note }).run();
      }
      await db.update(assumptions).set({ status, lastCheckedDate: observedDate, note: textValue(payload.assumptionNote, textValue(payload.note)), updatedAt: new Date().toISOString() }).where(eq(assumptions.id, assumptionId)).run();
    } else if (action === "delete_assumption_observation") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "观察记录 ID 无效" }, { status: 400 });
      await db.delete(assumptionObservations).where(eq(assumptionObservations.id, id)).run();
    } else if (action === "create_evidence") {
      const companyId = integerValue(payload.companyId);
      const claim = textValue(payload.claim);
      if (!companyId || !claim) return Response.json({ error: "证据必须关联公司并填写 Claim" }, { status: 400 });
      await db.insert(evidence).values({ companyId, assumptionId: nullableId(payload.assumptionId), claim, polarity: textValue(payload.polarity, "support"), sourceType: textValue(payload.sourceType, "笔记"), sourceTitle: textValue(payload.sourceTitle), sourceUrl: textValue(payload.sourceUrl), sourceDate: textValue(payload.sourceDate, new Date().toISOString().slice(0, 10)), note: textValue(payload.note), conclusion: textValue(payload.conclusion) }).run();
    } else if (action === "create_source_document" || action === "update_source_document") {
      const companyId = positiveId(payload.companyId, "公司 ID");
      const company = (await db.select().from(companies).where(eq(companies.id, companyId)).limit(1))[0];
      if (!company) throw new InputError("公司不存在", 404);
      const values = sourceValues(payload);
      if (action === "create_source_document") {
        await db.insert(sourceDocuments).values({ ...values, companyId, isSample: company.isSample }).run();
      } else {
        const id = positiveId(payload.id);
        const current = (await db.select().from(sourceDocuments).where(and(eq(sourceDocuments.id, id), eq(sourceDocuments.companyId, companyId))).limit(1))[0];
        if (!current) throw new InputError("来源不存在或不属于该公司", 404);
        await db.update(sourceDocuments).set(values).where(eq(sourceDocuments.id, id)).run();
      }
    } else if (action === "delete_source_document") {
      const id = positiveId(payload.id);
      const current = (await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1))[0];
      if (!current) throw new InputError("来源不存在", 404);
      // A database trigger also protects this relationship during concurrent writes.
      const bound = await db.select({ id: financials.id }).from(financials).where(eq(financials.sourceDocumentId, id)).limit(1);
      if (bound[0]) throw new InputError("该来源仍绑定财务年度，请先解绑后再删除", 409);
      await db.delete(sourceDocuments).where(eq(sourceDocuments.id, id)).run();
    } else if (action === "create_financial" || action === "update_financial") {
      const companyId = positiveId(payload.companyId, "公司 ID");
      if (!(await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1))[0]) throw new InputError("公司不存在", 404);
      const id = action === "update_financial" ? positiveId(payload.id) : 0;
      const current = id ? (await db.select().from(financials).where(eq(financials.id, id)).limit(1))[0] : undefined;
      if (id && (!current || current.companyId !== companyId)) throw new InputError("财务记录不存在或不属于该公司", 404);
      const values = financialValues({ ...current, ...payload }, companyId);
      await validateSource(values.sourceDocumentId, companyId);
      if (id) await db.update(financials).set(values).where(eq(financials.id, id)).run();
      else await db.insert(financials).values(values).run();
    } else if (action === "delete_financial") {
      const id = positiveId(payload.id);
      if (!(await db.select({ id: financials.id }).from(financials).where(eq(financials.id, id)).limit(1))[0]) throw new InputError("财务记录不存在", 404);
      await db.delete(financials).where(eq(financials.id, id)).run();
    } else if (action === "import_financial_csv") {
      const rows = Array.isArray(payload.rows) ? payload.rows as Record<string, unknown>[] : [];
      const mode = textValue(payload.mode, "insert");
      if (!rows.length || rows.length > 200) throw new InputError("每次导入须为 1–200 行");
      if (!["insert", "upsert"].includes(mode)) throw new InputError("导入模式无效");
      const seen = new Set<string>();
      const prepared = [];
      for (const row of rows) {
        if (!row || typeof row !== "object") throw new InputError("CSV 行无效");
        // A row identity wins over the currently selected company. Never relabel another ticker.
        const ticker = textValue(row.ticker || row.symbol).toUpperCase();
        const requestedId = row.companyId ? positiveId(row.companyId) : (!ticker && payload.companyId ? positiveId(payload.companyId) : 0);
        const matches = requestedId ? await db.select().from(companies).where(eq(companies.id, requestedId)) : await db.select().from(companies).where(eq(companies.ticker, ticker));
        if (matches.length !== 1 || (ticker && matches[0].ticker !== ticker)) throw new InputError("CSV 公司不存在、代码歧义或 ID 与代码不一致");
        const companyId = matches[0].id;
        const key = `${companyId}:${row.year}`;
        if (seen.has(key)) throw new InputError("CSV 文件内存在重复公司年度", 409);
        seen.add(key);
        const current = (await db.select().from(financials).where(and(eq(financials.companyId, companyId), eq(financials.year, numeric(row.year, "年度")))).limit(1))[0];
        if (current && mode === "insert") throw new InputError("包含已有年度；仅新增模式不会覆盖", 409);
        // Omitted columns retain their stored values during explicit updates.
        const values = financialValues({ ...(mode === "upsert" ? current : {}), ...row }, companyId);
        await validateSource(values.sourceDocumentId, companyId);
        const query = db.insert(financials).values(values);
        prepared.push(mode === "upsert" ? query.onConflictDoUpdate({ target: [financials.companyId, financials.year], set: values }) : query);
      }
      // D1 batch is a transaction: a failing row rolls back the entire import.
      await db.batch(prepared as [typeof prepared[number], ...typeof prepared]);
    } else if (action === "create_transaction") {
      const companyId = positiveId(payload.companyId, "公司 ID");
      const shares = numeric(payload.shares, "股数");
      const price = numeric(payload.price, "价格");
      const fees = numeric(payload.fees, "费用", 0);
      const type = textValue(payload.type).toLowerCase();
      const company = (await db.select().from(companies).where(eq(companies.id, companyId)).limit(1))[0];
      if (!company || !company.currencyVerified) throw new InputError("请先在公司档案中核对交易币种");
      const errors = validateTransaction({ companyExists: true, type, shares, price });
      if (errors.length || fees < 0) throw new InputError(errors.join("；") || "费用不能为负数");
      const tradeCurrency = currencyValue(payload.currency || company.currency);
      if (tradeCurrency !== company.currency) throw new InputError("交易币种必须与证券报价币种一致");
      if (payload.reversalOfTransactionId) throw new InputError("交易更正流程尚未实现，不能伪造撤销记录");
      const fxRateToBase = payload.fxRateToBase == null || payload.fxRateToBase === "" ? null : numeric(payload.fxRateToBase, "成交汇率");
      if (fxRateToBase !== null && fxRateToBase <= 0) throw new InputError("成交汇率必须大于零");
      const tradeDate = date(payload.tradeDate, "交易日期");
      const baseSetting = (await db.select().from(appSettings).where(eq(appSettings.key, "base_currency")).limit(1))[0];
      const fxBaseCurrency = fxRateToBase === null ? "" : currencyValue(baseSetting?.value ?? "USD");
      await db.insert(transactions).values({ companyId, tradeDate, type, shares, price, fees, currency: tradeCurrency, fxRateToBase, fxBaseCurrency, note: textValue(payload.note) }).run();
    } else if (action === "save_valuation") {
      const companyId = integerValue(payload.companyId);
      const scenario = textValue(payload.scenario, "Base");
      if (!supportedScenarios.has(scenario)) return Response.json({ error: "估值情景无效" }, { status: 400 });
      const company = (await db.select().from(companies).where(eq(companies.id, companyId)).limit(1))[0];
      const latestFinancial = (await db.select().from(financials).where(eq(financials.companyId, companyId)).orderBy(desc(financials.year)).limit(1))[0];
      if (!company) return Response.json({ error: "估值关联的公司不存在" }, { status: 400 });
      if (!latestFinancial || !latestFinancial.basisConfirmed || !company.currencyVerified) throw new InputError("请先核对公司币种和财务年度口径");
      if (latestFinancial.currency !== company.currency) throw new InputError("报表币种与交易币种不同，当前不支持跨币种每股估值");
      const shares = numeric(payload.shares, "股数", latestFinancial.sharesOutstanding);
      const values = { companyId, scenario, revenueGrowth: numeric(payload.revenueGrowth, "revenueGrowth"), operatingMargin: numeric(payload.operatingMargin, "operatingMargin"), taxRate: numeric(payload.taxRate, "taxRate"), capexPct: numeric(payload.capexPct, "capexPct"), daPct: numeric(payload.daPct, "daPct"), workingCapitalPct: numeric(payload.workingCapitalPct, "workingCapitalPct"), wacc: numeric(payload.wacc, "wacc"), terminalGrowth: numeric(payload.terminalGrowth, "terminalGrowth"), shares, fairValue: 0, updatedAt: new Date().toISOString() };
      const validation = validateDcfInputs(values);
      if (validation.length) return Response.json({ error: validation.join("；") }, { status: 400 });
      const output = calculateDcf({ ...values, latestRevenue: latestFinancial.revenue, netDebt: latestFinancial.debt - latestFinancial.cash });
      values.fairValue = output.fairValue;
      const existing = await db.select({ id: valuations.id }).from(valuations).where(and(eq(valuations.companyId, companyId), eq(valuations.scenario, scenario))).limit(1);
      const valuationWrite = existing[0] ? db.update(valuations).set(values).where(eq(valuations.id, existing[0].id)) : db.insert(valuations).values(values);
      if (scenario === "Base") await db.batch([valuationWrite, db.update(companies).set({ fairValue: values.fairValue, updatedAt: new Date().toISOString() }).where(eq(companies.id, companyId))]);
      else await valuationWrite.run();
    } else if (action === "create_industry") {
      const name = textValue(payload.name);
      if (!name) return Response.json({ error: "行业名称不能为空" }, { status: 400 });
      await db.insert(industries).values({ name, marketSize: textValue(payload.marketSize), cagr: textValue(payload.cagr), supplyChain: textValue(payload.supplyChain), upstream: textValue(payload.upstream), midstream: textValue(payload.midstream), downstream: textValue(payload.downstream), keyCompanies: textValue(payload.keyCompanies), competition: textValue(payload.competition), techTrends: textValue(payload.techTrends), risks: textValue(payload.risks) }).run();
    } else if (action === "update_industry") {
      await db.update(industries).set({ name: textValue(payload.name), marketSize: textValue(payload.marketSize), cagr: textValue(payload.cagr), supplyChain: textValue(payload.supplyChain), upstream: textValue(payload.upstream), midstream: textValue(payload.midstream), downstream: textValue(payload.downstream), keyCompanies: textValue(payload.keyCompanies), competition: textValue(payload.competition), techTrends: textValue(payload.techTrends), risks: textValue(payload.risks), updatedAt: new Date().toISOString() }).where(eq(industries.id, integerValue(payload.id))).run();
    } else if (action === "update_settings") {
      const baseCurrency = currencyValue(payload.baseCurrency);
      await db.insert(appSettings).values({ key: "base_currency", value: baseCurrency, updatedAt: new Date().toISOString() }).onConflictDoUpdate({ target: appSettings.key, set: { value: baseCurrency, updatedAt: new Date().toISOString() } }).run();
    } else if (action === "save_screener") {
      const name = textValue(payload.name);
      if (!name) return Response.json({ error: "筛选模板名称不能为空" }, { status: 400 });
      await db.insert(screenerTemplates).values({ name, criteria: JSON.stringify(payload.criteria ?? {}) }).run();
    } else {
      return Response.json({ error: `未知操作：${action}` }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof InputError) return Response.json({ error: error.message }, { status: error.status });
    const cause = error instanceof Error && error.cause instanceof Error ? error.cause.message : error instanceof Error ? error.message : "";
    if (/LEDGER_INVALID/.test(cause)) return Response.json({ error: "卖出数量超过可用持仓，或交易日期导致历史持仓为负" }, { status: 400 });
    if (/SOURCE_BOUND|UNIQUE constraint/.test(cause)) return Response.json({ error: "记录冲突：年度已存在或来源仍被引用" }, { status: 409 });
    if (/INVALID_REFERENCE|INVALID_TRANSACTION|IMMUTABLE/.test(cause)) return Response.json({ error: "关联记录无效或历史记录不可修改" }, { status: 400 });
    console.error("Investment Lab data operation failed", error);
    return Response.json({ error: "数据保存失败，请稍后重试" }, { status: 500 });
  }
}

return { GET, POST };
async function validateSource(id: number | null, companyId: number) {
  if (!id) return;
  const source = (await db.select().from(sourceDocuments).where(eq(sourceDocuments.id, id)).limit(1))[0];
  if (!source || source.companyId !== companyId) throw new InputError("来源文档不属于该公司");
}
}

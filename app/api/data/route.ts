import { and, asc, desc, eq } from "drizzle-orm";
import { ensureDatabase, getDb } from "../../../db";
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
} from "../../../db/schema";

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

function financialValues(payload: Record<string, unknown>, companyId: number) {
  const year = integerValue(payload.year);
  return {
    companyId,
    year,
    revenue: numberValue(payload.revenue),
    grossProfit: numberValue(payload.grossProfit),
    operatingIncome: numberValue(payload.operatingIncome),
    netIncome: numberValue(payload.netIncome),
    eps: numberValue(payload.eps),
    operatingCashFlow: numberValue(payload.operatingCashFlow),
    capex: numberValue(payload.capex),
    freeCashFlow: numberValue(payload.freeCashFlow),
    cash: numberValue(payload.cash),
    debt: numberValue(payload.debt),
    sharesOutstanding: numberValue(payload.sharesOutstanding),
    stockBasedCompensation: numberValue(payload.stockBasedCompensation),
    dividend: numberValue(payload.dividend),
    buyback: numberValue(payload.buyback),
    roe: numberValue(payload.roe),
    roa: numberValue(payload.roa),
    roic: numberValue(payload.roic),
    periodEnd: textValue(payload.periodEnd, year ? `${year}-12-31` : ""),
    filingDate: textValue(payload.filingDate),
    currency: textValue(payload.currency, "USD").toUpperCase(),
    unitScale: textValue(payload.unitScale, "millions"),
    dataStatus: textValue(payload.dataStatus, "reported"),
    sourceDocumentId: nullableId(payload.sourceDocumentId),
    auditNote: textValue(payload.auditNote),
    updatedAt: new Date().toISOString(),
  };
}

function validDataStatus(value: string) {
  return ["reported", "derived", "estimate"].includes(value);
}

export async function GET() {
  try {
    await ensureDatabase();
    const db = getDb();
    const [companyRows, financialRows, transactionRows, taskRows, eventRows, journalRows, industryRows, valuationRows, templateRows, snapshotRows, assumptionRows, observationRows, evidenceRows, sourceDocumentRows] = await Promise.all([
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
      db.select().from(sourceDocuments).orderBy(asc(sourceDocuments.companyId), desc(sourceDocuments.filingDate), desc(sourceDocuments.id)),
    ]);
    return Response.json({ companies: companyRows, financials: financialRows, transactions: transactionRows, tasks: taskRows, events: eventRows, journal: journalRows, industries: industryRows, valuations: valuationRows, templates: templateRows, snapshots: snapshotRows, assumptions: assumptionRows, observations: observationRows, evidence: evidenceRows, sourceDocuments: sourceDocumentRows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "数据加载失败";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureDatabase();
    const db = getDb();
    const payload = (await request.json()) as Record<string, unknown>;
    const action = textValue(payload.action);

    if (action === "create_company") {
      const name = textValue(payload.name);
      const ticker = textValue(payload.ticker).toUpperCase();
      if (!name || !ticker) return Response.json({ error: "公司名称和股票代码不能为空" }, { status: 400 });
      await db.insert(companies).values({
        name, ticker, market: textValue(payload.market, "未设置"), currency: textValue(payload.currency, "USD").toUpperCase(), country: textValue(payload.country, "未设置"), industry: textValue(payload.industry, "未分类"), status: textValue(payload.status, "发现"), price: numberValue(payload.price), fairValue: numberValue(payload.fairValue), conviction: integerValue(payload.conviction), lastResearchDate: textValue(payload.lastResearchDate), businessModel: textValue(payload.businessModel), isSample: 0,
      }).run();
    } else if (action === "update_company") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "公司 ID 无效" }, { status: 400 });
      const current = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
      if (current[0]) {
        const scenarioRows = await db.select().from(valuations).where(eq(valuations.companyId, id));
        const latestFinancial = await db.select().from(financials).where(eq(financials.companyId, id)).orderBy(desc(financials.year)).limit(1);
        const financial = latestFinancial[0];
        const grossMargin = financial?.revenue ? financial.grossProfit / financial.revenue : 0;
        const fcfMargin = financial?.revenue ? financial.freeCashFlow / financial.revenue : 0;
        const scenarioValue = (scenario: string) => scenarioRows.find((row) => row.scenario === scenario)?.fairValue ?? 0;
        await db.insert(investmentSnapshots).values({
          companyId: id,
          snapshotType: textValue(payload.snapshotType, "thesis_edit"),
          snapshotDate: textValue(payload.lastResearchDate, new Date().toISOString().slice(0, 10)),
          price: numberValue(payload.price),
          positionWeight: numberValue(payload.positionWeight),
          conviction: integerValue(payload.conviction),
          thesisBull: textValue(payload.thesisBull),
          thesisBear: textValue(payload.thesisBear),
          keyAssumptions: textValue(payload.keyAssumptions),
          killCriteria: textValue(payload.killCriteria),
          fairValueBear: scenarioValue("Bear"),
          fairValueBase: scenarioValue("Base") || numberValue(payload.fairValue),
          fairValueBull: scenarioValue("Bull"),
          nextReviewDate: textValue(payload.nextReviewDate),
          revenue: financial?.revenue ?? 0,
          grossMargin,
          fcfMargin,
          roic: financial?.roic ?? 0,
          debt: financial?.debt ?? 0,
        }).run();
      }
      await db.update(companies).set({
        name: textValue(payload.name), ticker: textValue(payload.ticker).toUpperCase(), market: textValue(payload.market), currency: textValue(payload.currency, "USD").toUpperCase(), country: textValue(payload.country), industry: textValue(payload.industry), status: textValue(payload.status), price: numberValue(payload.price), marketCap: numberValue(payload.marketCap), enterpriseValue: numberValue(payload.enterpriseValue), fairValue: numberValue(payload.fairValue), conviction: integerValue(payload.conviction), lastResearchDate: textValue(payload.lastResearchDate), businessModel: textValue(payload.businessModel), moatScore: integerValue(payload.moatScore), moatEvidence: textValue(payload.moatEvidence, "[]"), managementName: textValue(payload.managementName), managementScore: integerValue(payload.managementScore), managementNotes: textValue(payload.managementNotes), thesisBull: textValue(payload.thesisBull), thesisBear: textValue(payload.thesisBear), keyAssumptions: textValue(payload.keyAssumptions), killCriteria: textValue(payload.killCriteria), updatedAt: new Date().toISOString(),
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
      await db.insert(assumptionObservations).values({ assumptionId, observedDate, status, observedValue: textValue(payload.observedValue), note: textValue(payload.note) }).run();
      await db.update(assumptions).set({ status, lastCheckedDate: observedDate, note: textValue(payload.assumptionNote, textValue(payload.note)), updatedAt: new Date().toISOString() }).where(eq(assumptions.id, assumptionId)).run();
    } else if (action === "create_evidence") {
      const companyId = integerValue(payload.companyId);
      const claim = textValue(payload.claim);
      if (!companyId || !claim) return Response.json({ error: "证据必须关联公司并填写 Claim" }, { status: 400 });
      await db.insert(evidence).values({ companyId, assumptionId: nullableId(payload.assumptionId), claim, polarity: textValue(payload.polarity, "support"), sourceType: textValue(payload.sourceType, "笔记"), sourceTitle: textValue(payload.sourceTitle), sourceUrl: textValue(payload.sourceUrl), sourceDate: textValue(payload.sourceDate, new Date().toISOString().slice(0, 10)), note: textValue(payload.note), conclusion: textValue(payload.conclusion) }).run();
    } else if (action === "create_source_document") {
      const companyId = integerValue(payload.companyId);
      const title = textValue(payload.title);
      const company = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1);
      if (!company[0] || !title) return Response.json({ error: "来源必须关联有效公司并填写标题" }, { status: 400 });
      await db.insert(sourceDocuments).values({
        companyId,
        title,
        sourceType: textValue(payload.sourceType, "年报"),
        sourceUrl: textValue(payload.sourceUrl),
        filingDate: textValue(payload.filingDate),
        periodStart: textValue(payload.periodStart),
        periodEnd: textValue(payload.periodEnd),
        currency: textValue(payload.currency, "USD").toUpperCase(),
        unitScale: textValue(payload.unitScale, "millions"),
        note: textValue(payload.note),
        isSample: 0,
      }).run();
    } else if (action === "update_source_document") {
      const id = integerValue(payload.id);
      const companyId = integerValue(payload.companyId);
      const title = textValue(payload.title);
      if (!id || !companyId || !title) return Response.json({ error: "来源编辑信息不完整" }, { status: 400 });
      await db.update(sourceDocuments).set({ title, sourceType: textValue(payload.sourceType, "年报"), sourceUrl: textValue(payload.sourceUrl), filingDate: textValue(payload.filingDate), periodStart: textValue(payload.periodStart), periodEnd: textValue(payload.periodEnd), currency: textValue(payload.currency, "USD").toUpperCase(), unitScale: textValue(payload.unitScale, "millions"), note: textValue(payload.note), updatedAt: new Date().toISOString() }).where(and(eq(sourceDocuments.id, id), eq(sourceDocuments.companyId, companyId))).run();
    } else if (action === "delete_source_document") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "来源 ID 无效" }, { status: 400 });
      const bound = await db.select({ id: financials.id }).from(financials).where(eq(financials.sourceDocumentId, id)).limit(1);
      if (bound[0]) return Response.json({ error: "该来源仍绑定财务年度，请先解绑后再删除" }, { status: 409 });
      await db.delete(sourceDocuments).where(eq(sourceDocuments.id, id)).run();
    } else if (action === "create_financial") {
      const companyId = integerValue(payload.companyId);
      const year = integerValue(payload.year);
      const company = await db.select({ id: companies.id }).from(companies).where(eq(companies.id, companyId)).limit(1);
      if (!company[0] || !year) return Response.json({ error: "财务年度必须关联有效公司" }, { status: 400 });
      const existing = await db.select({ id: financials.id }).from(financials).where(and(eq(financials.companyId, companyId), eq(financials.year, year))).limit(1);
      if (existing[0]) return Response.json({ error: "该公司年度已存在，请使用编辑或明确的 CSV 更新模式" }, { status: 409 });
      const values = financialValues(payload, companyId);
      if (!validDataStatus(values.dataStatus)) return Response.json({ error: "dataStatus 必须是 reported、derived 或 estimate" }, { status: 400 });
      if (values.sourceDocumentId) {
        const source = await db.select({ companyId: sourceDocuments.companyId }).from(sourceDocuments).where(eq(sourceDocuments.id, values.sourceDocumentId)).limit(1);
        if (!source[0] || source[0].companyId !== companyId) return Response.json({ error: "来源文档不属于该公司" }, { status: 400 });
      }
      await db.insert(financials).values(values).run();
    } else if (action === "update_financial") {
      const id = integerValue(payload.id);
      const companyId = integerValue(payload.companyId);
      const year = integerValue(payload.year);
      if (!id || !companyId || !year) return Response.json({ error: "财务编辑信息不完整" }, { status: 400 });
      const duplicate = await db.select({ id: financials.id }).from(financials).where(and(eq(financials.companyId, companyId), eq(financials.year, year))).limit(2);
      if (duplicate.some((row) => row.id !== id)) return Response.json({ error: "该公司年度已存在另一条财务记录" }, { status: 409 });
      const values = financialValues(payload, companyId);
      if (!validDataStatus(values.dataStatus)) return Response.json({ error: "dataStatus 必须是 reported、derived 或 estimate" }, { status: 400 });
      if (values.sourceDocumentId) {
        const source = await db.select({ companyId: sourceDocuments.companyId }).from(sourceDocuments).where(eq(sourceDocuments.id, values.sourceDocumentId)).limit(1);
        if (!source[0] || source[0].companyId !== companyId) return Response.json({ error: "来源文档不属于该公司" }, { status: 400 });
      }
      await db.update(financials).set(values).where(eq(financials.id, id)).run();
    } else if (action === "delete_financial") {
      const id = integerValue(payload.id);
      if (!id) return Response.json({ error: "财务记录 ID 无效" }, { status: 400 });
      await db.delete(financials).where(eq(financials.id, id)).run();
    } else if (action === "import_financial_csv") {
      const rows = (Array.isArray(payload.rows) ? payload.rows : []) as Array<Record<string, unknown>>;
      const mode = textValue(payload.mode, "insert");
      if (!rows.length) return Response.json({ error: "没有可导入的 CSV 行" }, { status: 400 });
      if (!["insert", "upsert"].includes(mode)) return Response.json({ error: "导入模式必须明确选择 insert 或 upsert" }, { status: 400 });
      const prepared: Array<{ values: ReturnType<typeof financialValues>; rowNumber: number }> = [];
      const conflicts: number[] = [];
      for (const [index, row] of rows.entries()) {
        const ticker = textValue(row.ticker || row.symbol).toUpperCase();
        const requestedCompanyId = integerValue(row.companyId || payload.companyId);
        const company = requestedCompanyId
          ? await db.select({ id: companies.id }).from(companies).where(eq(companies.id, requestedCompanyId)).limit(1)
          : await db.select({ id: companies.id }).from(companies).where(eq(companies.ticker, ticker)).limit(1);
        const companyId = company[0]?.id ?? 0;
        const values = financialValues(row, companyId);
        if (!companyId || !values.year || !validDataStatus(values.dataStatus)) return Response.json({ error: `CSV 第 ${index + 2} 行缺少有效公司、年度或 dataStatus` }, { status: 400 });
        if (values.sourceDocumentId) {
          const source = await db.select({ companyId: sourceDocuments.companyId }).from(sourceDocuments).where(eq(sourceDocuments.id, values.sourceDocumentId)).limit(1);
          if (!source[0] || source[0].companyId !== companyId) return Response.json({ error: `CSV 第 ${index + 2} 行的来源不属于该公司` }, { status: 400 });
        }
        const existing = await db.select({ id: financials.id }).from(financials).where(and(eq(financials.companyId, companyId), eq(financials.year, values.year))).limit(1);
        if (existing[0]) conflicts.push(index + 2);
        prepared.push({ values, rowNumber: index + 2 });
      }
      if (conflicts.length && mode === "insert") return Response.json({ error: "导入中包含已存在年度；选择‘明确更新’后才会覆盖", conflicts }, { status: 409 });
      for (const item of prepared) {
        const existing = await db.select({ id: financials.id }).from(financials).where(and(eq(financials.companyId, item.values.companyId), eq(financials.year, item.values.year))).limit(1);
        if (existing[0]) await db.update(financials).set(item.values).where(eq(financials.id, existing[0].id)).run();
        else await db.insert(financials).values(item.values).run();
      }
    } else if (action === "create_transaction") {
      const companyId = integerValue(payload.companyId);
      const shares = numberValue(payload.shares);
      const price = numberValue(payload.price);
      if (!companyId || shares <= 0 || price < 0) return Response.json({ error: "交易信息不完整" }, { status: 400 });
      await db.insert(transactions).values({ companyId, tradeDate: textValue(payload.tradeDate, new Date().toISOString().slice(0, 10)), type: textValue(payload.type, "buy"), shares, price, fees: numberValue(payload.fees), note: textValue(payload.note) }).run();
    } else if (action === "save_valuation") {
      const companyId = integerValue(payload.companyId);
      const scenario = textValue(payload.scenario, "Base");
      const values = { companyId, scenario, revenueGrowth: numberValue(payload.revenueGrowth), operatingMargin: numberValue(payload.operatingMargin), taxRate: numberValue(payload.taxRate), capexPct: numberValue(payload.capexPct), daPct: numberValue(payload.daPct), workingCapitalPct: numberValue(payload.workingCapitalPct), wacc: numberValue(payload.wacc), terminalGrowth: numberValue(payload.terminalGrowth), shares: numberValue(payload.shares, 1), fairValue: numberValue(payload.fairValue), updatedAt: new Date().toISOString() };
      const existing = await db.select({ id: valuations.id }).from(valuations).where(and(eq(valuations.companyId, companyId), eq(valuations.scenario, scenario))).limit(1);
      if (existing[0]) await db.update(valuations).set(values).where(eq(valuations.id, existing[0].id)).run();
      else await db.insert(valuations).values(values).run();
      if (scenario === "Base") await db.update(companies).set({ fairValue: values.fairValue, updatedAt: new Date().toISOString() }).where(eq(companies.id, companyId)).run();
    } else if (action === "create_industry") {
      const name = textValue(payload.name);
      if (!name) return Response.json({ error: "行业名称不能为空" }, { status: 400 });
      await db.insert(industries).values({ name, marketSize: textValue(payload.marketSize), cagr: textValue(payload.cagr), supplyChain: textValue(payload.supplyChain), upstream: textValue(payload.upstream), midstream: textValue(payload.midstream), downstream: textValue(payload.downstream), keyCompanies: textValue(payload.keyCompanies), competition: textValue(payload.competition), techTrends: textValue(payload.techTrends), risks: textValue(payload.risks) }).run();
    } else if (action === "update_industry") {
      await db.update(industries).set({ name: textValue(payload.name), marketSize: textValue(payload.marketSize), cagr: textValue(payload.cagr), supplyChain: textValue(payload.supplyChain), upstream: textValue(payload.upstream), midstream: textValue(payload.midstream), downstream: textValue(payload.downstream), keyCompanies: textValue(payload.keyCompanies), competition: textValue(payload.competition), techTrends: textValue(payload.techTrends), risks: textValue(payload.risks), updatedAt: new Date().toISOString() }).where(eq(industries.id, integerValue(payload.id))).run();
    } else if (action === "save_screener") {
      const name = textValue(payload.name);
      if (!name) return Response.json({ error: "筛选模板名称不能为空" }, { status: 400 });
      await db.insert(screenerTemplates).values({ name, criteria: JSON.stringify(payload.criteria ?? {}) }).run();
    } else {
      return Response.json({ error: `未知操作：${action}` }, { status: 400 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "操作失败";
    return Response.json({ error: message }, { status: 500 });
  }
}

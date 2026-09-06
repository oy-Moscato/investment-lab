"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { FINANCIAL_IMPORT_EXAMPLE, parseFinancialCsv } from "../lib/financial-provenance.js";

type Company = { id: number; name: string; ticker: string; currency?: string; isSample: number };
type SourceDocument = {
  id: number; companyId: number; title: string; sourceType: string; sourceUrl: string; filingDate: string;
  periodStart: string; periodEnd: string; currency: string; unitScale: string; note: string; isSample: number;
};
type Financial = {
  id: number; companyId: number; year: number; revenue: number; grossProfit: number; operatingIncome: number; netIncome: number; eps: number;
  operatingCashFlow: number; capex: number; freeCashFlow: number; cash: number; debt: number; sharesOutstanding: number; stockBasedCompensation: number;
  dividend: number; buyback: number; roe: number; roa: number; roic: number; periodEnd: string; filingDate: string; currency: string;
  unitScale: string; dataStatus: string; sourceDocumentId: number | null; auditNote: string; basisConfirmed?: number;
};
type SourceViewData = { companies: Company[]; sourceDocuments: SourceDocument[]; financials: Financial[] };
type Save = (payload: Record<string, unknown>, message?: string) => Promise<boolean>;
type SourceForm = Omit<SourceDocument, "id" | "companyId" | "isSample">;
type FinancialForm = Omit<Financial, "id" | "companyId">;

const sourceTypes = ["年报", "季报", "10-K", "20-F", "公告", "电话会", "研究笔记", "DEMO DATA", "其他"];
const currencies = ["USD", "EUR", "HKD", "CNY", "JPY", "GBP", "KRW"];
const unitScales = ["units", "thousands", "millions", "billions"];
const dataStatuses = ["reported", "derived", "estimate"];
const financialFields: Array<[keyof FinancialForm, string]> = [
  ["revenue", "Revenue"], ["grossProfit", "Gross Profit"], ["operatingIncome", "Operating Income"], ["netIncome", "Net Income"],
  ["eps", "EPS"], ["operatingCashFlow", "Operating Cash Flow"], ["capex", "CapEx"], ["freeCashFlow", "Free Cash Flow"],
  ["cash", "Cash"], ["debt", "Debt"], ["sharesOutstanding", "Shares Outstanding"], ["stockBasedCompensation", "SBC"],
  ["dividend", "Dividend"], ["buyback", "Buyback"], ["roe", "ROE (%)"], ["roa", "ROA (%)"], ["roic", "ROIC (%)"],
];

const blankSource = (company: Company): SourceForm => ({ title: "", sourceType: company.isSample ? "DEMO DATA" : "年报", sourceUrl: "", filingDate: "", periodStart: "", periodEnd: "", currency: company.currency || "USD", unitScale: "millions", note: "" });
const blankFinancial = (company: Company): FinancialForm => ({ year: new Date().getFullYear(), revenue: 0, grossProfit: 0, operatingIncome: 0, netIncome: 0, eps: 0, operatingCashFlow: 0, capex: 0, freeCashFlow: 0, cash: 0, debt: 0, sharesOutstanding: 0, stockBasedCompensation: 0, dividend: 0, buyback: 0, roe: 0, roa: 0, roic: 0, periodEnd: `${new Date().getFullYear()}-12-31`, filingDate: "", currency: company.currency || "USD", unitScale: "millions", dataStatus: company.isSample ? "estimate" : "reported", sourceDocumentId: null, auditNote: "" });

function sourceLabel(document: SourceDocument | undefined) {
  if (!document) return "未绑定来源";
  return `${document.title}${document.isSample ? " · DEMO DATA" : ""}`;
}

function TextField({ label, value, onChange, type = "text", required = false }: { label: string; value: string | number; onChange: (value: string) => void; type?: string; required?: boolean }) {
  return <label className="field"><span>{label}</span><input className="input" type={type} step={type === "number" ? "any" : undefined} value={String(value ?? "")} required={required} onChange={(event) => onChange(event.target.value)} /></label>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string | number; options: string[]; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><select className="input" value={String(value ?? "")} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option || "未设置"}</option>)}</select></label>;
}

function SectionTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="section-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2>{title}</h2>{description && <p className="muted section-description">{description}</p>}</div>{action}</div>;
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="empty-state"><div className="empty-icon">＋</div><h3>{title}</h3><p>{text}</p></div>;
}

function SourceEditor({ form, setForm, onSubmit, onCancel, editing }: { form: SourceForm; setForm: (form: SourceForm) => void; onSubmit: (event: FormEvent) => void; onCancel: () => void; editing: boolean }) {
  const update = (key: keyof SourceForm, value: string) => setForm({ ...form, [key]: value });
  return <form className="source-editor" onSubmit={onSubmit}><div className="form-grid"><TextField label="来源标题" value={form.title} required onChange={(value) => update("title", value)} /><SelectField label="来源类型" value={form.sourceType} options={sourceTypes} onChange={(value) => update("sourceType", value)} /><TextField label="披露日期" value={form.filingDate} type="date" onChange={(value) => update("filingDate", value)} /><TextField label="期间开始" value={form.periodStart} type="date" onChange={(value) => update("periodStart", value)} /><TextField label="期间结束" value={form.periodEnd} type="date" onChange={(value) => update("periodEnd", value)} /><SelectField label="币种" value={form.currency} options={currencies} onChange={(value) => update("currency", value)} /><SelectField label="单位规模" value={form.unitScale} options={unitScales} onChange={(value) => update("unitScale", value)} /><TextField label="来源 URL" value={form.sourceUrl} onChange={(value) => update("sourceUrl", value)} /><label className="field field-full"><span>来源备注 / 页码 / 使用范围</span><textarea className="textarea" value={form.note} onChange={(event) => update("note", event.target.value)} placeholder="例如：2025 年报，Consolidated Statements，第 72 页" /></label></div><div className="source-form-actions"><button type="button" className="button button-ghost compact" onClick={onCancel}>取消</button><button className="button button-primary compact">{editing ? "保存来源变化" : "创建来源文档"}</button></div></form>;
}

function FinancialEditor({ form, setForm, sources, onSubmit, onCancel, editing }: { form: FinancialForm; setForm: (form: FinancialForm) => void; sources: SourceDocument[]; onSubmit: (event: FormEvent) => void; onCancel: () => void; editing: boolean }) {
  const update = (key: keyof FinancialForm, value: string | number | null) => setForm({ ...form, [key]: value });
  return <form className="source-editor" onSubmit={onSubmit}><div className="form-grid"><TextField label="年度" value={form.year} type="number" required onChange={(value) => update("year", Number(value))} /><TextField label="期间结束" value={form.periodEnd} type="date" onChange={(value) => update("periodEnd", value)} /><TextField label="披露日期" value={form.filingDate} type="date" onChange={(value) => update("filingDate", value)} /><SelectField label="币种" value={form.currency} options={currencies} onChange={(value) => update("currency", value)} /><SelectField label="单位规模" value={form.unitScale} options={unitScales} onChange={(value) => update("unitScale", value)} /><SelectField label="数据状态" value={form.dataStatus} options={dataStatuses} onChange={(value) => update("dataStatus", value)} /><label className="field field-full"><span>绑定来源文档</span><select className="input" value={String(form.sourceDocumentId ?? "")} onChange={(event) => update("sourceDocumentId", event.target.value ? Number(event.target.value) : null)}><option value="">不绑定</option>{sources.map((source) => <option key={source.id} value={source.id}>{sourceLabel(source)}</option>)}</select></label>{financialFields.map(([key, label]) => <TextField key={key} label={label} value={Number(form[key] ?? 0)} type="number" onChange={(value) => update(key, Number(value))} />)}<label className="field field-full"><span>审计备注</span><textarea className="textarea" value={form.auditNote} onChange={(event) => update("auditNote", event.target.value)} placeholder="记录数据是否经过推导、口径转换或人工核对" /></label></div><p className="basis-note">保存表示已核对口径：金额和股数均使用所选规模；每股收益为原币/股；收益率用百分数（15 表示 15%）。</p><div className="source-form-actions"><button type="button" className="button button-ghost compact" onClick={onCancel}>取消</button><button className="button button-primary compact">{editing ? "保存财务变化" : "新增财务年度"}</button></div></form>;
}

export default function SourceDocumentsView({ data, onSave }: { data: SourceViewData; onSave: Save }) {
  const [selectedCompanyId, setSelectedCompanyId] = useState(data.companies[0]?.id ?? 0);
  const [sourceForm, setSourceForm] = useState<SourceForm>(blankSource(data.companies[0] ?? { id: 0, name: "", ticker: "", currency: "USD", isSample: 0 }));
  const [financialForm, setFinancialForm] = useState<FinancialForm>(blankFinancial(data.companies[0] ?? { id: 0, name: "", ticker: "", currency: "USD", isSample: 0 }));
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [editingFinancialId, setEditingFinancialId] = useState<number | null>(null);
  const [showSourceEditor, setShowSourceEditor] = useState(false);
  const [showFinancialEditor, setShowFinancialEditor] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvRows, setCsvRows] = useState<Array<Record<string, unknown>>>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState("insert");

  const company = data.companies.find((item) => item.id === selectedCompanyId) ?? data.companies[0];
  const sources = useMemo(() => data.sourceDocuments.filter((item) => item.companyId === company?.id), [data.sourceDocuments, company?.id]);
  const rows = useMemo(() => data.financials.filter((item) => item.companyId === company?.id).sort((a, b) => b.year - a.year), [data.financials, company?.id]);
  const boundRows = rows.filter((row) => row.sourceDocumentId).length;
  const coverage = rows.length ? Math.round((boundRows / rows.length) * 100) : 0;

  useEffect(() => {
    if (!company) return;
    setCsvRows([]); setCsvText(""); setCsvErrors([]);
    setSourceForm(blankSource(company));
    setFinancialForm(blankFinancial(company));
    setEditingSourceId(null); setEditingFinancialId(null); setShowSourceEditor(false); setShowFinancialEditor(false);
  }, [company?.id]);

  const selectCompany = (value: string) => setSelectedCompanyId(Number(value));
  const submitSource = async (event: FormEvent) => { event.preventDefault(); if (!company) return; if (!await onSave({ action: editingSourceId ? "update_source_document" : "create_source_document", id: editingSourceId ?? undefined, companyId: company.id, ...sourceForm }, editingSourceId ? "来源文档已更新" : "来源文档已创建")) return; setShowSourceEditor(false); setEditingSourceId(null); };
  const submitFinancial = async (event: FormEvent) => { event.preventDefault(); if (!company) return; if (!await onSave({ action: editingFinancialId ? "update_financial" : "create_financial", id: editingFinancialId ?? undefined, companyId: company.id, ...financialForm }, editingFinancialId ? "财务年度已更新" : "财务年度已创建")) return; setShowFinancialEditor(false); setEditingFinancialId(null); };
  const editSource = (source: SourceDocument) => { setSourceForm({ title: source.title, sourceType: source.sourceType, sourceUrl: source.sourceUrl, filingDate: source.filingDate, periodStart: source.periodStart, periodEnd: source.periodEnd, currency: source.currency, unitScale: source.unitScale, note: source.note }); setEditingSourceId(source.id); setShowSourceEditor(true); };
  const editFinancial = (row: Financial) => { const form = Object.fromEntries(Object.entries(row).filter(([key]) => key !== "id" && key !== "companyId")) as FinancialForm; setFinancialForm(form); setEditingFinancialId(row.id); setShowFinancialEditor(true); };
  const deleteSource = async (source: SourceDocument) => { if (window.confirm(`确定删除来源“${source.title}”吗？已绑定年度会阻止删除。`)) await onSave({ action: "delete_source_document", id: source.id }, "来源文档已删除"); };
  const deleteFinancial = async (row: Financial) => { if (window.confirm(`确定删除 ${row.year} 年财务记录吗？`)) await onSave({ action: "delete_financial", id: row.id }, "财务年度已删除"); };
  const parseImport = (value: string) => { setCsvText(value); const parsed = parseFinancialCsv(value); setCsvRows(parsed.rows); setCsvErrors(parsed.errors); };
  const readFile = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; void file.text().then(parseImport); };
  const submitImport = async () => { if (!csvRows.length || csvErrors.length) return; if (!await onSave({ action: "import_financial_csv", companyId: company?.id, rows: csvRows, mode: importMode }, importMode === "upsert" ? "CSV 已按明确更新模式导入" : "CSV 新增记录已导入")) return; setCsvText(""); setCsvRows([]); };

  if (!company) return <EmptyState title="还没有公司档案" text="先建立公司档案，再为每个年度绑定来源和财务口径。" />;
  return <><SectionTitle eyebrow="SOURCE OF TRUTH" title="财务来源与历史回填" description="每一行财务数据都应能回答：来自哪份文件、哪个期间、什么币种和单位、是披露值还是推导值。" action={<select className="company-select" value={company.id} onChange={(event) => selectCompany(event.target.value)}>{data.companies.map((item) => <option key={item.id} value={item.id}>{item.ticker} · {item.name}</option>)}</select>} /><div className="source-summary-grid"><div className="panel source-summary-card"><span>来源文档</span><strong>{sources.length}</strong><small>{company.isSample ? "包含 DEMO DATA 标记" : "可编辑、可绑定、可追踪"}</small></div><div className="panel source-summary-card"><span>年度来源覆盖</span><strong>{coverage}%</strong><small>{boundRows} / {rows.length} 个财务年度已绑定</small></div><div className="panel source-summary-card"><span>未绑定年度</span><strong>{rows.length - boundRows}</strong><small>不会被系统伪造来源</small></div></div><div className="source-layout"><section className="panel source-documents-panel"><SectionTitle eyebrow="DOCUMENTS" title="来源文档" description="先建立来源，再把它绑定到一个或多个财务年度。" action={<button className="button button-soft compact" onClick={() => { setSourceForm(blankSource(company)); setEditingSourceId(null); setShowSourceEditor(true); }}>＋ 新来源</button>} />{showSourceEditor && <SourceEditor form={sourceForm} setForm={setSourceForm} onSubmit={submitSource} onCancel={() => { setShowSourceEditor(false); setEditingSourceId(null); }} editing={Boolean(editingSourceId)} />}{sources.length ? <div className="source-list">{sources.map((source) => <article className="source-card" key={source.id}><div className="source-card-head"><div><strong>{source.title}</strong><span>{source.sourceType} · {source.filingDate || "未设置披露日期"}</span></div>{source.isSample ? <span className="sample-chip">DEMO DATA</span> : <span className="source-chip">SOURCE</span>}</div><div className="source-card-meta"><span>{source.currency} · {source.unitScale}</span><span>{source.periodStart || "—"} → {source.periodEnd || "—"}</span></div>{source.note && <p>{source.note}</p>}<div className="source-card-actions">{source.sourceUrl && <a href={source.sourceUrl} target="_blank" rel="noreferrer">打开来源 ↗</a>}<button className="text-button" onClick={() => editSource(source)}>编辑</button><button className="text-button danger-text" onClick={() => void deleteSource(source)}>删除</button></div></article>)}</div> : <EmptyState title="还没有来源文档" text="添加年报、10-K、20-F、电话会或研究笔记，之后可绑定历史财务年度。" />}</section><section className="panel financial-records-panel"><SectionTitle eyebrow="FINANCIAL RECORDS" title="年度财务数据" description="编辑、解绑来源或补录缺失年度；已有年度不会被 CSV 默认覆盖。" action={<button className="button button-primary compact" onClick={() => { setFinancialForm(blankFinancial(company)); setEditingFinancialId(null); setShowFinancialEditor(true); }}>＋ 新财务年度</button>} />{showFinancialEditor && <FinancialEditor form={financialForm} setForm={setFinancialForm} sources={sources} onSubmit={submitFinancial} onCancel={() => { setShowFinancialEditor(false); setEditingFinancialId(null); }} editing={Boolean(editingFinancialId)} />}{rows.length ? <div className="financial-record-list">{rows.map((row) => <article className="financial-record" key={row.id}><div className="financial-record-head"><strong>FY {row.year}</strong>{!row.basisConfirmed && <span className="unbound-source">旧数据口径待核对</span>}<span className={`status-pill status-${row.dataStatus}`}>{row.dataStatus}</span><span>{row.currency || company.currency || "—"} · {row.unitScale || "—"}</span></div><div className="financial-record-main"><div><span>Revenue</span><strong>{row.revenue ? `${row.revenue.toLocaleString()} ${row.unitScale}` : "—"}</strong></div><div><span>FCF</span><strong>{row.freeCashFlow ? `${row.freeCashFlow.toLocaleString()} ${row.unitScale}` : "—"}</strong></div><div><span>ROIC</span><strong>{row.roic ? `${row.roic}%` : "—"}</strong></div></div><div className="financial-record-source"><span className={row.sourceDocumentId ? "bound-source" : "unbound-source"}>{row.sourceDocumentId ? `来源：${sourceLabel(sources.find((source) => source.id === row.sourceDocumentId))}` : "⚠ 未绑定来源"}</span><span>{row.periodEnd || `${row.year}-12-31`} · 披露 {row.filingDate || "未设置"}</span></div><div className="financial-record-actions"><button className="text-button" onClick={() => editFinancial(row)}>编辑年度</button><button className="text-button danger-text" onClick={() => void deleteFinancial(row)}>删除年度</button></div></article>)}</div> : <EmptyState title="还没有财务年度" text="可以手工新增，也可以在下方导入 CSV。" />}</section></div><section className="panel csv-panel"><SectionTitle eyebrow="SAFE CSV IMPORT" title="批量导入财务数据" description="先解析并预览，再选择仅新增或明确更新已有年度；系统不会静默覆盖。" action={<a className="text-button" href={`data:text/csv;charset=utf-8,${encodeURIComponent(FINANCIAL_IMPORT_EXAMPLE)}`} download="financial-import-example.csv">下载 CSV 模板 ↓</a>} /><div className="csv-controls"><label className="file-button"><input type="file" accept=".csv,text/csv" onChange={readFile} />选择 CSV 文件</label><span>或粘贴 CSV</span><SelectField label="导入策略" value={importMode} options={["insert", "upsert"]} onChange={setImportMode} /></div><textarea className="textarea csv-textarea" value={csvText} onChange={(event) => parseImport(event.target.value)} placeholder="ticker,year,periodEnd,filingDate,currency,unitScale,dataStatus,revenue,..." />{csvErrors.length > 0 && <div className="csv-errors">{csvErrors.map((error) => <span key={error}>⚠ {error}</span>)}</div>}{csvRows.length > 0 && <div className="csv-preview"><div><strong>预览 {csvRows.length} 行</strong><span>{importMode === "upsert" ? "明确更新模式：同公司同年度会被更新" : "仅新增模式：遇到已有年度会整体拒绝"}</span></div><div className="csv-preview-table">{csvRows.slice(0, 5).map((row, index) => <div className="csv-preview-row" key={`${row.ticker}-${row.year}-${index}`}><span>{String(row.ticker || row.companyId || "?")}</span><span>FY {String(row.year)}</span><span>{String(row.currency || "—")} · {String(row.unitScale || "—")}</span><span>{String(row.dataStatus)}</span></div>)}</div><button className="button button-primary compact" disabled={Boolean(csvErrors.length)} onClick={() => void submitImport()}>确认导入 {csvRows.length} 行 →</button></div>}</section></>;
}

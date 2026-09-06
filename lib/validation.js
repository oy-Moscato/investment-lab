export class InputError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function numeric(value, name, fallback) {
  if (value === undefined && fallback !== undefined) return fallback;
  if (value === null || value === '' || typeof value === 'boolean' || !Number.isFinite(Number(value))) {
    throw new InputError(`${name} 必须是有效数字`);
  }
  return Number(value);
}

export function positiveId(value, name = 'ID') {
  const id = numeric(value, name);
  if (!Number.isSafeInteger(id) || id <= 0) throw new InputError(`${name} 无效`);
  return id;
}

export const currencies = ['USD', 'HKD', 'CNY', 'EUR', 'JPY', 'GBP', 'KRW'];
export const unitScales = { units: 1, thousands: 1e3, millions: 1e6, billions: 1e9 };
export const financialNumericFields = ['revenue', 'grossProfit', 'operatingIncome', 'netIncome', 'eps', 'operatingCashFlow', 'capex', 'freeCashFlow', 'cash', 'debt', 'sharesOutstanding', 'stockBasedCompensation', 'dividend', 'buyback', 'roe', 'roa', 'roic'];

export function currency(value) {
  const code = String(value ?? '').trim().toUpperCase();
  if (!currencies.includes(code)) throw new InputError('请明确选择有效币种');
  return code;
}

export function date(value, name, optional = false) {
  const text = String(value ?? '').trim();
  if (optional && !text) return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) throw new InputError(`${name} 无效`);
  return text;
}

export function sourceValues(payload) {
  const title = String(payload.title ?? '').trim();
  if (!title) throw new InputError('来源标题不能为空');
  const sourceUrl = String(payload.sourceUrl ?? '').trim();
  if (sourceUrl) {
    let url;
    try { url = new URL(sourceUrl); } catch { throw new InputError('来源网址无效'); }
    if (!['http:', 'https:'].includes(url.protocol)) throw new InputError('来源网址必须使用 HTTP 或 HTTPS');
  }
  const unitScale = String(payload.unitScale ?? '');
  if (!Object.hasOwn(unitScales, unitScale)) throw new InputError('单位规模无效');
  const periodStart = date(payload.periodStart, '期间开始', true);
  const periodEnd = date(payload.periodEnd, '期间结束', true);
  if (periodStart && periodEnd && periodStart > periodEnd) throw new InputError('期间开始不能晚于结束');
  return { title, sourceType: String(payload.sourceType ?? '研究笔记'), sourceUrl, filingDate: date(payload.filingDate, '披露日期', true), periodStart, periodEnd, currency: currency(payload.currency), unitScale, note: String(payload.note ?? ''), updatedAt: new Date().toISOString() };
}

export function financialValues(payload, companyId) {
  const year = numeric(payload.year, '年度');
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new InputError('年度必须是 1900–2200 的整数');
  const unitScale = String(payload.unitScale ?? '');
  if (!Object.hasOwn(unitScales, unitScale)) throw new InputError('请明确选择单位规模');
  const dataStatus = String(payload.dataStatus ?? '');
  if (!['reported', 'derived', 'estimate'].includes(dataStatus)) throw new InputError('数据状态无效');
  const fields = Object.fromEntries(financialNumericFields.map(key => [key, numeric(payload[key], key, 0)]));
  for (const key of ['revenue', 'cash', 'debt', 'sharesOutstanding']) if (fields[key] < 0) throw new InputError(`${key} 不能为负数`);
  return { ...fields, companyId, year, currency: currency(payload.currency), unitScale, dataStatus,
    sourceDocumentId: payload.sourceDocumentId ? positiveId(payload.sourceDocumentId, '来源 ID') : null,
    periodEnd: date(payload.periodEnd, '期间结束'), filingDate: date(payload.filingDate, '披露日期', true),
    auditNote: String(payload.auditNote ?? ''), basisConfirmed: 1, updatedAt: new Date().toISOString() };
}

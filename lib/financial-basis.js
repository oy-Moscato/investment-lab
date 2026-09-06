import { financialNumericFields, unitScales } from './validation.js';

// Monetary totals and share counts use the declared scale; EPS is currency/share,
// ROE/ROA/ROIC are percentage points. Never compare unconfirmed or mixed-currency years.
export function normalizeFinancialRows(rows) {
  if (!rows.length || rows.some(row => !row.basisConfirmed || !row.currency || !Object.hasOwn(unitScales, row.unitScale))) return [];
  if (new Set(rows.map(row => row.currency)).size !== 1) return [];
  return [...rows].sort((a, b) => a.year - b.year).map(row => {
    const result = { ...row, unitScale: 'units' };
    for (const key of financialNumericFields) {
      if (!['eps', 'roe', 'roa', 'roic'].includes(key)) result[key] = row[key] * unitScales[row.unitScale];
    }
    return result;
  });
}

# Feature status

Status vocabulary: `IMPLEMENTED`, `PARTIAL`, `DEMO ONLY`, `NOT IMPLEMENTED`.
This table describes the code that is actually in the snapshot.

| Feature | Status | Evidence / boundary |
| --- | --- | --- |
| Dashboard / Research Overview | IMPLEMENTED | `Dashboard` in `app/page.tsx`; reads D1-backed `AppData`. |
| Built-in company/financial seed data | DEMO ONLY | `db/index.ts` seeds illustrative rows when a table is empty; not production data. |
| Portfolio overview | PARTIAL | Cost, derived value, unrealized return, and concentration are shown; cash ratio and full realized-return presentation are missing. |
| Watchlist | PARTIAL | Implemented through `companies.status` and dashboard filtering; no separate `watchlist` table or dedicated CRUD. |
| Company list | IMPLEMENTED | `CompanyList` supports query and status filters. |
| Company Research | IMPLEMENTED | `CompanyDetail` with business model, financials, moat/management, and thesis tabs. |
| Business Model | IMPLEMENTED | Stored on `companies.business_model` and edited in CompanyDetail. |
| Moat scoring/evidence | IMPLEMENTED | 15 moat categories, 0–5 scores, and JSON text evidence in `moat_evidence`. |
| Management research | IMPLEMENTED | Name, notes, and 0–5 score on `companies`. |
| Financial trend view | PARTIAL | Five-year demo rows, reporting currency, unit scale, source-document title, and sparklines are present; no financial-input UI or import pipeline. |
| Financial red flags | PARTIAL | Revenue/FCF, net income/OCF, gross margin, debt, dilution, SBC, and ROIC prompts are implemented; not every requested rule exists. |
| DCF valuation | PARTIAL | Five-year + terminal calculation uses ΔNWC, validates g < WACC/WACC/shares, and persists Bear/Base/Bull; no sensitivity matrix or source-data ingestion. |
| Relative valuation | PARTIAL | PE, EV/EBIT (operating income), FCF yield, and PEG are rendered; PB, PS, Forward PE, EV/EBITDA, and data ingestion are not implemented. |
| Investment Thesis | IMPLEMENTED | Bull, Bear, Key Assumptions, and Kill Criteria fields are editable. |
| Why I Own These | IMPLEMENTED | Represented by thesis fields and snapshot `Why I Own It` content; no separate table. |
| Immutable Thesis Snapshot | IMPLEMENTED | `investment_snapshots`; explicit review/thesis-change actions append snapshots, while ordinary company metadata edits do not. |
| Since Last Review / What Changed | IMPLEMENTED | `MemoryView` compares the latest two snapshot/financial baselines. |
| Assumption Tracker | IMPLEMENTED | Current status plus append-only observation history. |
| Evidence Ledger | IMPLEMENTED | Support/counter evidence, source type/title/URL/date, notes, conclusion, and optional assumption link. |
| Decision Journal | IMPLEMENTED | Append-only journal timeline with conviction and structured prompts. |
| Portfolio transactions | IMPLEMENTED | Multiple buy/sell rows persist with historical currency/optional FX; server validation rejects invalid types and oversells; positions are derived from the ledger. |
| Currency / unit / provenance semantics | PARTIAL | Company/financial/transaction currency, unit scale, base currency, source documents, and manual FX safeguards exist; automatic FX and full source editor are absent. |
| Portfolio risk | PARTIAL | Industry concentration and top-five weight are available; country, style, cash, and thesis exposure are not. |
| Industry Research / Map | IMPLEMENTED | Create/update/read industry knowledge fields. Delete is not available. |
| Company comparison | IMPLEMENTED | Select 2–5 companies and compare derived quality/efficiency/thesis metrics. |
| Stock Screener | PARTIAL | Five local calculated filters and saved JSON templates; requested market-cap, PE, PB, PS, EV/EBITDA, dividend, and data-ingestion surfaces are absent. |
| Research Queue / Inbox | PARTIAL | `tasks` queue supports add, status progression, priority, due date, and delete; no separate inbox model or reorder interaction. |
| Tags | NOT IMPLEMENTED | No tags table, UI, or API action. |
| Global Search | PARTIAL | Company-list search works; top-bar search icon has no handler and there is no cross-entity search. |
| Settings | PARTIAL | Base-currency selection persists in `app_settings`; there is no general settings view. |
| Prediction Calibration | NOT IMPLEMENTED | No prediction table, outcome capture, or calibration analytics. |
| Investment Memory / AI history search | PARTIAL | Structured memory exists; natural-language search is not implemented. |
| Portfolio Thesis Exposure / Hidden Correlation | NOT IMPLEMENTED | No thesis-exposure entity or aggregation. |
| Broker/bank integration | NOT IMPLEMENTED | No external account or trade API integration. |

# Data flow

The current app uses one client page and one server API route. The examples
below use actual source paths and action names.

## Add a company

```text
Composer(kind="company") in app/page.tsx
→ submit() maps kind to action="create_company"
→ Home.save() POSTs JSON to /api/data
→ app/api/data/route.ts validates name/ticker
→ db.insert(companies).values(...).run()
→ Home.refresh() GETs /api/data
→ React state is replaced with the D1-backed AppData payload
```

New companies are marked `isSample: 0`. The runtime seed path only runs when
the companies table is empty.

## Add a transaction

```text
Composer(kind="transaction")
→ action="create_transaction"
→ POST /api/data
→ validate company/type/shares/price and available sell balance
→ db.insert(transactions).values(currency, optional FX, reversal reference, ...).run()
→ refresh
→ portfolioPositions(companies, transactions) derives shares, cost, average cost,
  current value, unrealized return, and realized return in app/page.tsx
→ mixed or missing FX remains unaggregated instead of becoming a fake base total
```

The app does not write a `positions` row. Current prices are manually stored on
`companies.price`; there is no market-data provider.

## Modify investment thesis

```text
CompanyDetail edit mode
→ save() in CompanyDetail
→ Home.save({ action: "update_company", ...draft })
→ POST /api/data
→ route UPDATEs the mutable companies row only
→ refresh

The generic company metadata path intentionally does not create a snapshot. An
explicit review/thesis-change form uses:

```text
MemoryView
→ action="create_snapshot"
→ POST /api/data
→ db.insert(investment_snapshots).values(...).run()
→ refresh
```
```

The snapshot insert is append-only in the current API. There is no snapshot
update or delete action.

## Add a decision journal entry

```text
Composer(kind="journal")
→ action="create_journal"
→ POST /api/data
→ validate judgment
→ db.insert(journal).values(...).run()
→ refresh
```

Journal entries are rendered as a timeline. The current API has no edit or
delete action for them.

## Save valuation

```text
ValuationView DCF form
→ validateDcfInputs() blocks g >= WACC, invalid WACC, or invalid shares
→ calculateDcf() calculates 5 explicit years + terminal value using ΔNWC
→ save() sends action="save_valuation" and assumptions
→ POST /api/data
→ route validates and recalculates the DCF server-side
→ SELECT existing row for (company_id, scenario)
→ UPDATE existing row or INSERT a new row
→ if scenario == "Base", update companies.fair_value
→ refresh
```

The DCF calculation is client-side; the server persists the assumptions and the
calculated fair value. There is no sensitivity-matrix endpoint.

## Modify portfolio

Portfolio views are derived rather than stored:

```text
Transactions table
→ portfolioPositions() sorts each company's transactions by date/id
→ buys add shares and cost; sells reduce shares at the running average cost
→ PortfolioView and Dashboard render the derived metrics
```

There is no separate portfolio update action and no cash-account table. The
base currency is persisted through `app_settings` by the portfolio selector;
FX rates remain manual and optional.

## Financial provenance

```text
Financials view
→ reads financial rows plus source_documents from AppData
→ renders reporting currency + unit scale + source-document title per row
→ create_source_document (when used) inserts source_documents
→ optional financialId update links the financial row to that document
```

## Assumptions and evidence

`MemoryView` sends `create_assumption`, `update_assumption`,
`create_assumption_observation`, and `create_evidence` actions. Observation and
evidence rows are inserted; updating an assumption also updates its current
status/date, so the observation history remains available while the current
summary stays convenient.

## Delete behavior

The only real delete action is:

```text
QueueView more button
→ action="delete_task"
→ db.delete(tasks).where(eq(tasks.id, id)).run()
```

There is no generic delete route. Transactions, journal entries, snapshots,
observations, evidence, and companies cannot currently be deleted from the UI.
Events can be marked complete but not deleted; industries can be edited but not
deleted.

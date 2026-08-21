# Work Review Handoff — P0 Financial Correctness

This file is an implementation brief for the ChatGPT Work/Sites session that owns the production Investment Lab.

**Do not deploy directly from this public audit repository.** Treat this as a review handoff. Re-apply the accepted changes to the production Sites source, run migrations/tests there, and only then deploy.

## Goal

Before adding more AI/search features, make the investment numbers trustworthy enough for real research data.

Priority order:

1. Multi-currency and unit correctness
2. Transaction ledger integrity
3. DCF correctness and invalid-input handling
4. Relative-valuation labeling correctness
5. Financial source provenance
6. Snapshot/review semantics
7. Sync-status truthfulness

---

## P0-1 — Add explicit currency and unit semantics

### Problem

The current schema has market/country but no explicit security currency, reporting currency, or financial unit scale. The UI formatter defaults to `$`, and portfolio values are summed directly. A portfolio containing USD, HKD, CNY, EUR, etc. can therefore produce meaningless totals.

### Required changes

Add at minimum:

- `companies.currency` — trading currency, e.g. USD/HKD/CNY/EUR
- `financials.currency` — reporting currency
- `financials.unit_scale` — 1 / 1e3 / 1e6 / 1e9 or equivalent enum
- `transactions.currency` — execution currency, defaulted from company but persisted historically
- `transactions.fx_rate_to_base` — optional/manual for now
- portfolio/user setting for `base_currency`

For the first implementation, it is acceptable to support **manual FX rates**. Do not silently mix currencies.

### UI behavior

- Money formatting must use the row/company currency, not a hard-coded `$`.
- If portfolio assets use different currencies and no FX conversion is available, show per-currency subtotals and a warning instead of a fake grand total.
- Once FX is available, compute:

`base_value = native_value × fx_rate_to_base`

### Acceptance tests

- USD + HKD holdings never get summed as if they were the same unit.
- BYD/HK rows display HKD, not `$`.
- Financial tables clearly state reporting currency and scale.

---

## P0-2 — Enforce transaction ledger validity on the server

### Problem

The API validates only basic numeric fields. A sell can exceed the available position. The client calculation can then drive shares negative and later clamp them to zero, while realized P&L has already been calculated from the invalid trade.

### Required changes

On `create_transaction`:

- validate `type ∈ {buy, sell}`
- validate `shares > 0`
- validate `price >= 0`
- for `sell`, calculate current available shares from the authoritative transaction ledger and reject `sell_shares > available_shares`
- reject invalid company IDs

Do not silently clamp invalid state.

### Historical corrections

Keep the ledger append-only. Add a future-safe correction mechanism such as:

- `reversal_of_transaction_id`, or
- a `reversal` transaction type that references the original row

Do not encourage editing old executed rows in place.

### Acceptance tests

- Buy 10, sell 11 → HTTP 400 with a clear message.
- Buy 10, sell 10 → valid.
- Buy 10, sell 4, sell 6 → valid.
- Invalid transaction type → rejected server-side.

---

## P0-3 — Fix DCF free-cash-flow semantics

### Problem A: working capital

Current DCF subtracts `workingCapitalPct × revenue` every forecast year. Free cash flow should normally subtract **change in net working capital (`ΔNWC`)**, not the full working-capital balance.

### Required change

Use an explicit model such as:

- `NWC_t = Revenue_t × nwcPct`
- `ΔNWC_t = NWC_t - NWC_(t-1)`
- `FCF_t = NOPAT_t + D&A_t - CapEx_t - ΔNWC_t`

Keep assumptions understandable in the UI.

### Problem B: terminal growth guard

Current logic protects `WACC - g` with a tiny denominator. This can silently create absurd terminal values.

### Required change

Block calculation/save when:

- `terminalGrowth >= wacc`
- WACC is outside a reasonable positive range
- shares outstanding is `<= 0`

Show a visible validation error. Do not auto-repair invalid assumptions behind the user's back.

### Problem C: seeded shares

The demo valuation seed uses `shares: 1`, while company financials already contain shares outstanding. A saved scenario can therefore override the correct per-share denominator.

### Required change

- Seed valuation scenarios with the latest financial `sharesOutstanding`, or
- leave scenario `shares` unset/null and derive from latest financials until explicitly overridden.

### Acceptance tests

- `terminalGrowth >= wacc` cannot be saved.
- Base/Bear/Bull fair value per share uses a credible share count.
- Increasing NWC intensity reduces FCF through `ΔNWC`, not by repeatedly subtracting the whole balance.

---

## P0-4 — Correct EV/EBITDA labeling

### Problem

The UI label says `EV / EBITDA`, while the denominator currently uses `operatingIncome`, which is closer to EBIT.

### Required change

Choose one:

1. Rename the metric to `EV / EBIT`, **or**
2. Add EBITDA (or D&A sufficient to derive it) and calculate real `EV / EBITDA`.

Do not show a financial multiple under the wrong name.

### Acceptance test

Displayed label and denominator must match exactly.

---

## P1-1 — Add Source of Truth / provenance for financial facts

### Goal

Every important financial number should answer:

> Where did this come from, for what period, in what currency/unit, and is it reported, derived, or estimated?

### Suggested schema

Create a source document entity, e.g.:

`source_documents`

- `id`
- `company_id`
- `type` (10-K, 10-Q, 20-F, annual report, earnings call, investor presentation, manual note)
- `title`
- `url`
- `filing_date`
- `period_end`
- `currency`
- `unit_scale`
- `verified`
- timestamps

Then either:

- link each `financials` row to `source_document_id`, or
- introduce a more granular `financial_facts` table later.

For V1, linking an annual financial row to a primary source is enough.

### UI

On financial rows show a compact source affordance:

`FY2025 · USD millions · 10-K ↗`

### Acceptance test

A user can inspect a financial year and identify its source, period, currency, and unit.

---

## P1-2 — Separate ordinary company edits from investment snapshots

### Problem

`update_company` currently appends an investment snapshot before a general company update. This can pollute investment memory with snapshots caused by harmless metadata edits.

### Required change

Do **not** create an investment snapshot for every company edit.

Create snapshots only for explicit investment-memory events, such as:

- initial research
- initial buy
- add
- reduce
- review
- thesis change
- exit

Optional fields worth adding:

- `change_reason`
- `previous_snapshot_id`
- `changed_fields` (JSON)
- `version`

### Acceptance test

Changing company name/industry/management metadata alone does not create a thesis snapshot.

---

## P1-3 — Make cloud sync status truthful

### Problem

The top bar currently renders “云端已同步” as a static badge.

### Required change

Represent actual request state:

- `已同步`
- `正在保存`
- `保存失败`
- `离线/无法连接`

The status must be driven by API load/save success, not hard-coded UI text.

### Acceptance test

Force an API failure and verify the top bar does not continue claiming data is synced.

---

## P1-4 — Add database integrity constraints during the next migration

The current schema uses integer IDs without SQL foreign keys.

Add foreign keys where safe, especially for:

- financials → companies
- transactions → companies
- valuations → companies
- snapshots → companies
- assumptions → companies
- observations → assumptions
- evidence → companies / assumptions

Choose explicit cascade/restrict behavior; avoid accidental destructive cascades for append-only investment history.

---

## Engineering guidance

Do **not** make the major frontend refactor the first task. The product can be decomposed after financial correctness is stable.

Recommended implementation sequence in Work:

1. Create migration/schema changes.
2. Update D1 bootstrap/migrations so production data remains intact.
3. Update API validation and calculations.
4. Update UI formatting/forms.
5. Add/extend tests for financial correctness.
6. Verify demo seed data under the new model.
7. Test mobile layout.
8. Preview in Sites.
9. Only deploy after checking existing production rows are preserved.

## Production safety requirements

- Do not delete or reset the production D1 database.
- Do not re-seed over existing production rows.
- Migrations must be additive/backward-safe where possible.
- Backfill currency/unit fields with explicit defaults and then verify them manually.
- Preserve append-only journal/snapshot/evidence history.
- Keep the production Site Owner-only until application-level authorization is implemented.

## Definition of done for this review batch

The batch is complete when:

- mixed currencies cannot produce a fake portfolio total;
- invalid oversells are rejected server-side;
- DCF rejects `g >= WACC` and uses `ΔNWC` semantics;
- EV/EBIT vs EV/EBITDA labeling is correct;
- demo valuation share counts are credible;
- financial rows can be traced to a source document (P1 acceptable in same batch if feasible);
- ordinary company edits no longer pollute thesis history;
- sync indicator reflects real persistence state;
- existing production data survives migration.

## Review philosophy

Investment Lab should optimize for:

**truthfulness > numerical correctness > provenance > historical memory > convenience > visual polish.**

Do not add AI-generated investment recommendations in this batch. First make the data model and calculations trustworthy.
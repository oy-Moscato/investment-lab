# Investment Lab Audit Manifest

## Current version

- Product: Investment Lab / 长期投资研究工作台
- Source snapshot: ChatGPT Sites checkout commit `9904d25`
- Baseline P0 implementation: `583d018`; second-round guards: `7a1e28d`
- Snapshot scope: current private Site implementation plus sanitized audit docs
- Production Site: <https://investment-lab.decent-finch-3957.chatgpt.site>
- Production access: Owner-only/private; this export did not modify it

## Technology stack

- React 19 and TypeScript
- Next-compatible App Router surface compiled by Vinext/Vite
- Cloudflare Worker runtime
- Cloudflare D1 / SQLite-compatible storage
- Drizzle ORM and generated SQL migrations
- Plain CSS responsive layout

## Project entry

- `package.json`: scripts, locked dependencies, and runtime metadata
- `vite.config.ts`: Vite/Vinext/Cloudflare plugin and local D1 binding simulation
- `worker/index.ts`: Worker fetch entry point
- `.openai/hosting.json`: sanitized Sites binding configuration (`project_id` redacted in this public copy)

## Frontend entry files

- `app/layout.tsx`: metadata and document shell
- `app/page.tsx`: all current UI views, types, calculations, forms, and client state
- `app/globals.css`: product styling and responsive breakpoints
- `lib/finance-logic.js`: DCF, transaction, portfolio-currency, and aggregation guards

## Routing

There are no URL routes for the product views. `Home` stores a `View` union in
React state and renders one of:

`overview`, `research`, `memory`, `portfolio`, `valuation`, `industry`,
`compare`, `journal`.

The only application API route is `app/api/data/route.ts` at `/api/data`.

## Database schema and data access

- Drizzle schema: `db/schema.ts`
- D1 bootstrap and demo seed: `db/index.ts`
- Review SQL mirror: `database/schema.sql`
- Migration history: `drizzle/0000_orange_wither.sql`,
  `drizzle/0001_blushing_nebula.sql`,
  `drizzle/0002_premium_baron_zemo.sql`,
  `drizzle/0003_flippant_iron_lad.sql`
- API/data access route: `app/api/data/route.ts`

## Main page/component locations

All are currently in `app/page.tsx`:

- Dashboard: `Dashboard`
- Company research: `ResearchView`, `CompanyList`, `CompanyDetail`
- Research queue: `QueueView`
- Screener: `ScreenerView`
- Investment memory: `MemoryView`, `ChangeItem`
- Portfolio: `PortfolioView`, `portfolioPositions`
- Valuation: `ValuationView`, `dcf`, `Multiple`
- Industry: `IndustryView`
- Comparison: `CompareView`
- Journal: `JournalView`, `Composer(kind="journal")`
- Shared UI helpers: `AppShell`, `Topbar`, `SectionTitle`, `Metric`, `Badge`, `Score`

## Investment thesis code location

- Current mutable thesis: `CompanyDetail` / `ThesisView` in `app/page.tsx`
- Persistence: `update_company` branch in `app/api/data/route.ts`
- Append-only snapshot: `investmentSnapshots` in `db/schema.ts` and the
  explicit `create_snapshot` branch; generic `update_company` does not append.

## Portfolio code location

- Transaction form: `Composer(kind="transaction")`
- Transaction write: `create_transaction` in `app/api/data/route.ts`
- Derived positions: `portfolioPositions()` in `app/page.tsx`
- Validation/currency guards: `validateTransaction()` and
  `portfolioCurrencyStatus()` in `lib/finance-logic.js`
- Portfolio/risk views: `PortfolioView` and `Dashboard`

## Valuation code location

- DCF calculation and scenario UI: `ValuationView` in `app/page.tsx`
- Persistence/upsert: `save_valuation` in `app/api/data/route.ts`
- Schema: `valuations` in `db/schema.ts`
- Pure calculation/validation: `calculateDcf()` and `validateDcfInputs()` in
  `lib/finance-logic.js`

## Journal code location

- Timeline: `JournalView`
- Form: `Composer(kind="journal")`
- Persistence: `create_journal` in `app/api/data/route.ts`

## Demo data location

- Primary seed definitions: `db/index.ts`
  - `sampleCompanies`
  - `sampleFinancials`
  - seeded tasks, events, industries, journals, valuations, snapshots,
    assumptions, evidence, and observation baselines
- Source-doc seed rows are restricted to sample companies (`is_sample=1`).
- Policy note: `database/demo-data/README.md`

## Current known issues

See `docs/LIMITATIONS.md`. Highlights:

- no application-level authorization in `/api/data` (the Site access policy is
  Owner-only)
- no external financial data source or import flow
- partial CRUD and no generic delete
- no cash account, thesis exposure, tags, general settings page, prediction
  calibration, or natural-language Investment Memory search
- Dashboard task-check and top-bar search affordances are not wired

## Current unimplemented features

See `docs/FEATURES.md` for the complete matrix. The clearest `NOT IMPLEMENTED`
items are Tags, Prediction Calibration, Portfolio Thesis Exposure, and
broker/bank integration.

## Local startup and checks

```bash
npm run install:ci
npm run dev
npm run lint
npm run build
npm test
```

## Sites deployment method

ChatGPT Sites builds the source checkout from the bound Sites source repository,
uses `npm run build`, and runs the Worker with the D1 binding `DB`. This GitHub
repository is a public audit snapshot only; it was not used to deploy a new
version and does not change the existing Site.

## Security/audit manifest

- Production rows: not exported
- Demo rows: retained in source and clearly documented as `DEMO DATA`
- Secret scan: performed on the current Sites checkout before this export
- Personal-data scan: performed before repository publication
- Build/lint/test: executed against current Sites commit `9904d25`; the audit
  branch contains the same application files plus sanitized docs
- Screenshots: not included; see `screenshots/README.md`

## Recommended Reading Order

```text
1. README.md
2. docs/AUDIT-MANIFEST.md
3. docs/ARCHITECTURE.md
4. docs/STORAGE.md
5. docs/WORK-IMPLEMENTATION-P0.md
6. database/schema.sql
7. db/schema.ts
8. db/index.ts
9. lib/finance-logic.js
10. app/api/data/route.ts
11. tests/
12. app/page.tsx
13. docs/FEATURES.md
14. docs/LIMITATIONS.md
```

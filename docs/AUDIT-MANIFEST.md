# Investment Lab Audit Manifest

## Current version

- Product: Investment Lab / 长期投资研究工作台
- Source snapshot: ChatGPT Sites checkout commit `68880421802db37bd303ed8e5d1f1e0ff29afc74`
- Snapshot scope: first-phase private Site including the Investment Memory additions
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
- `.openai/hosting.json`: current Sites binding configuration

## Frontend entry files

- `app/layout.tsx`: metadata and document shell
- `app/page.tsx`: all current UI views, types, calculations, forms, and client state
- `app/globals.css`: product styling and responsive breakpoints

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
  `drizzle/0002_premium_baron_zemo.sql`
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
- Append-only snapshot: `investmentSnapshots` in `db/schema.ts` and the same
  `update_company` branch

## Portfolio code location

- Transaction form: `Composer(kind="transaction")`
- Transaction write: `create_transaction` in `app/api/data/route.ts`
- Derived positions: `portfolioPositions()` in `app/page.tsx`
- Portfolio/risk views: `PortfolioView` and `Dashboard`

## Valuation code location

- DCF calculation and scenario UI: `ValuationView` in `app/page.tsx`
- Persistence/upsert: `save_valuation` in `app/api/data/route.ts`
- Schema: `valuations` in `db/schema.ts`

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
- Policy note: `database/demo-data/README.md`

## Current known issues

See `docs/LIMITATIONS.md`. Highlights:

- no application-level authorization in `/api/data`
- no external market-data provider or automatic filing ingestion; structured financial-source and CSV import workflow is implemented
- partial CRUD outside the source/financial workflow; there is no generic delete dispatcher
- no cash account, thesis exposure, tags, settings, prediction calibration, or
  natural-language Investment Memory search
- Dashboard task-check and top-bar search affordances are not wired

## Current unimplemented features

See `docs/FEATURES.md` for the complete matrix. The clearest `NOT IMPLEMENTED`
items are Tags, Settings, Prediction Calibration, Portfolio Thesis Exposure,
and broker/bank integration.

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
- Secret scan: performed before repository publication
- Personal-data scan: performed before repository publication
- Build/lint/test: executed against this snapshot before publication
- Screenshots: not included; see `screenshots/README.md`

## Recommended Reading Order

```text
1. README.md
2. docs/AUDIT-MANIFEST.md
3. docs/ARCHITECTURE.md
4. docs/STORAGE.md
5. database/schema.sql
6. db/schema.ts
7. db/index.ts
8. app/api/data/route.ts
9. app/page.tsx
10. docs/FEATURES.md
11. docs/LIMITATIONS.md
```


## P1 source-workflow overlay

- Implementation commit: `db197e0 feat: add financial source workflow`
- New UI: `app/source-documents-view.tsx`
- New parser: `lib/financial-provenance.js`
- New migration: `drizzle/0003_secret_mister_fear.sql`
- New contract test: `tests/source-workflow.test.mjs`
- Working Sites branch: `work/p1-source-workflow`
- Public audit branch: `work/p1-source-workflow-audit`
- Production checkpoint/deployment: not performed

Recommended P1 reading order:

```text
1. docs/WORK-IMPLEMENTATION-P1-3.md
2. app/source-documents-view.tsx
3. lib/financial-provenance.js
4. app/api/data/route.ts (source/financial action branches)
5. db/schema.ts and drizzle/0003_secret_mister_fear.sql
6. tests/source-workflow.test.mjs
```

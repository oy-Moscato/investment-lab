# Audit manifest

Read in order:

1. `README.md`
2. `docs/RESTART-REVIEW.md` — baselines, findings, validation and rollout hold
3. `db/schema.ts`, migrations 0003–0005 — additive schema and guards
4. `server/data-service.ts` — actual handler factory
5. `lib/validation.js`, `lib/finance-logic.js`, `lib/financial-basis.js`
6. `lib/financial-provenance.js`, `lib/persistence.js`
7. `tests/data-behavior.test.mjs`, `tests/persistence.test.mjs`
8. `app/source-documents-view.tsx`, `app/page.tsx`

Routes: `/` and GET/POST `/api/data`. Worker entry: `worker/index.ts`. Metadata: `app/layout.tsx`. Responsive styling: `app/globals.css`. Company/thesis/portfolio/valuation/journal/memory UI remains in `app/page.tsx`; its server operations are in `server/data-service.ts`. Local synthetic data is exclusively in `scripts/prepare-preview.mjs`.

Commands: `npm run build`, `npm run typecheck`, `npm run lint`, `npm test`. Browser QA remains partial.

Sites branch: `work/restart-integrated-correctness`. Public branch: `work/restart-integrated-audit`. Exact Sites commit is recorded in the public PR. Public source differs only by redacting the hosting manifest's project ID.

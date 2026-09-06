# Architecture

React sends GET/POST to `/api/data`. The route obtains the Worker D1 binding and invokes `createDataHandlers` in `server/data-service.ts`. The same factory is tested against Miniflare D1.

Drizzle migrations own schema. Custom triggers in 0004 protect ledger chronology and touched source/financial references. GET reads only. Demo setup is explicit and local-only; it has no remote database mode.

The browser parses CSV for preview. Server validation independently checks identity, basis and numeric fields. Accepted imports form one D1 batch transaction. Unique company/year and reference guards cover concurrent writes. Server DCF saves calculated results, ignoring client fairValue.

Executed trades append; database validation checks chronological running balance including backdated entries. Old trades reject in-place edits/deletion. A full audited correction workflow is still pending.

Finance, unit normalization and persistence-state modules are shared pure functions. Missing quotes or current FX are not invented. Existing private Sites access is the authorization boundary; no multi-user row isolation exists.

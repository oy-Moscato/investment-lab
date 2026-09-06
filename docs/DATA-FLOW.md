# Data flow

| Operation | Actual path | Persistence |
| --- | --- | --- |
| Workspace load | page refresh → GET route → handler GET | D1 reads only; failures are unavailable |
| Company | editor/Composer → persistAndRefresh → create/update_company | Company row; metadata edits create no snapshot |
| Transaction | Composer → create_transaction | Strict input, INSERT, atomic chronological guard |
| Thesis | company editor → update_company | Current thesis; create_snapshot is explicit and separate |
| Journal | Composer → create_journal | Appended row |
| Valuation | view → save_valuation | Basis/input validation, server DCF, atomic scenario + Base company value |
| Portfolio | ledger GET → derivePositions → summary | Derived only; no hidden portfolio overwrite |
| Source | source editor → create/update_source_document | Company/URL/unit checks, demo identity retained |
| Financial | source editor → create/update_financial | Basis/source/ownership checks; company cannot be reassigned |
| CSV | parser → preview → import_financial_csv | Server validation, one transaction; insert rejects conflicts; partial upsert explicit |
| Source deletion | confirm → delete_source_document | Referenced source rejected, including database guard |
| Financial deletion | confirm → delete_financial | Real deletion; full correction history not implemented |
| Save feedback | lib/persistence.js → boolean caller | Failed draft retained; acknowledged write/read failure shown as saved-but-stale; lost response requires readback |

Main UI: `app/page.tsx`. Source UI: `app/source-documents-view.tsx`. Binding adapter: `app/api/data/route.ts`. Actual handlers: `server/data-service.ts`. Legacy task/event/industry endpoints remain there. General lifecycle and authentication redesign is outside this pass. No market feed, broker sync or LLM is called.

# Features — integrated review candidate

Implementation, acceptance and deployment are distinct.

| Feature | Code status | Evidence |
| --- | --- | --- |
| Company/tasks/journal/industry | Existing, retained | Build/types; not all legacy paths retested |
| Explicit snapshots | Implemented | D1 proves ordinary edit adds no snapshot |
| Source and financial CRUD | Implemented | D1 persistence/reference/ownership tests; source display preview |
| CSV preview/import/upsert | Implemented | Parser and D1 tests, forced mid-batch rollback |
| Trade oversell/date/race protection | Implemented | D1 chronology/concurrency tests |
| Reversal/correction UI | Not implemented | Forged reversal references rejected |
| DCF correctness/basis guards | Same-currency implementation | Pure and real save tests |
| Unit normalization | Implemented | Trend/scale tests; unconfirmed/mixed years suppressed |
| Native-currency portfolio | Partial accounting | No invented quote/FX; cash/actions/closed performance pending |
| Truthful save state | Implemented | Failure/stale/lost-response tests; final visual failure test pending |
| Read-only GET and separate local seed | Implemented | Empty GET and migration preservation tests |
| Search/sensitivity/exposure/calibration/AI memory | Not implemented this pass | Existing Roadmap tasks remain open |
| Production release | Not performed | No saved version or deployment |

Final form/error/mobile browser acceptance is pending. See `RESTART-REVIEW.md`.

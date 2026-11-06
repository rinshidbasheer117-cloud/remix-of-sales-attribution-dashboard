# Architecture rules
- Use TanStack file routes for each operations view and a shared bicycle shell; keep reusable workflow UI outside route files to preserve route discovery.
- Persist inventory and ledger records in Lovable Cloud; advance stages and calculate immutable sale allocations in transactional database functions to prevent concurrent edits and client-side tampering.
- Link authenticated profiles to staff through administrator-only assignment; never grant staff permissions from signup metadata or self-selected employee names.
- Store bike photos in a private bucket and render short-lived signed URLs; do not expose financial or employee records anonymously.
- Keep pure commission calculations independently tested against the database calculation for boundary and attribution consistency.
- Import spreadsheets through one transactional database function after client-side preview; reject the entire import on a bad row to avoid partial history.
- Personal earnings require the authenticated employee identity plus a hashed passcode and a short-lived server-validated unlock token; never store unlock tokens in browser storage.
# APO STEP

Skills. Training. Empowerment. Progress. District Year 2026–2027.

An accessible, mobile-friendly course catalog and application flow for Alpha Phi Omega Philippines, Inc., jointly administered by CTSD and CMWD. Source lives in GitHub; Google Apps Script serves the website and writes to a private Google Sheet. No participant sign-in, analytics, or emails.

## Local development

Node.js 20+ is sufficient; no npm dependencies are required.

```sh
npm test
npm run build
npm run preview
```

Open http://127.0.0.1:4173. The local preview is explicitly a synthetic-data demo. It never sends personal information to Google or persists answers. Reloading clears the in-memory form. Production HTML has no mock adapter.

## Project layout

- `src/`: frontend, shared field schema, Apps Script backend and safe setup.
- `data/catalog.json`: 139 authorized offerings, 53 course titles, stable IDs and source-row references. No participant data.
- `scripts/`: deterministic build, XLSX catalog import and local preview.
- `tests/`: validation, catalog integrity and mocked Apps Script integration checks.
- `docs/field-mapping.md`: exact form and Applications schema.
- `docs/deployment.md`: owner setup, testing and release procedure.

## Catalog maintenance

Run `python scripts/import-catalog.py path/to/catalog.xlsx` with Python and openpyxl available, then test and build. The importer reads only `2 Unique Offerings`. IDs hash the exact source course title and offering fields; reordering does not change IDs. A changed offering gets a new ID. Keep older offerings in the live sheet and mark Selectable false instead of deleting historical references. `setup_` seeds only empty tabs and never overwrites populated catalogs.

## Privacy and operations

Production starts closed. Replace `[APO PRIVACY CONTACT EMAIL]` and `[APPLICATION RETENTION PERIOD]`, approve the privacy notice, then explicitly open registration after test deployment. Placeholder checks also run on the server. Only authorized staff should access Applications. No secrets or participant records belong in this public repository.

Applications are independent records. Learner ID is reserved and blank until staff establishes identity. One qualifying membership number may identify multiple family applicants. Duplicate hints never delete, merge, or expose records to applicants. Staff review does not automatically confirm enrollment.

Known v1 boundaries: Apps Script quotas and account deployment policy apply; honeypots/tokens are basic abuse controls, not comprehensive bot protection. Geographic text fields avoid an external lookup dependency. No provider schedules, street addresses, live capacity, verification API, or certification claims are invented. Privacy contact/retention and the approved APO logo remain owner-supplied configuration.

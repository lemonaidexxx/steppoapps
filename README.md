# APO STEP

Skills. Training. Empowerment. Progress. District Year 2026–2027.

An accessible, responsive course catalog and continuous application form for Alpha Phi Omega Philippines, Inc., jointly administered by the Committee on Training and Skills Development and the Committee on Members’ Welfare and Development. Google Apps Script serves the website, writes to a private Google Sheet, and queues confirmation emails through the deployment owner’s Gmail. No participant sign-in or analytics.

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

Production starts closed, with email sending disabled. The supplied logo, privacy contact and December 31, 2026 retention cutoff are configured. The owner must authorize GmailApp, install private worker triggers, deploy and run an isolated live test before explicitly opening registration. See [deployment instructions](docs/deployment.md). Only authorized staff should access Applications. No secrets or participant records belong in this public repository.

Applications are independent records. Learner ID is reserved and blank until staff establishes identity. One qualifying membership number may identify multiple family applicants. Duplicate hints never delete, merge, or expose records to applicants. Staff review does not automatically confirm enrollment.

The form includes passport-name instructions, numeric APO IDs, separate required/optional consent, sticky section navigation, a native review dialog, and a modal editing drawer. Classes require 25 learners; this is program information, not a live capacity counter. Apps Script quotas and account deployment policy apply. Geographic fields use text inputs. Uncertain email outcomes go to staff review rather than automatic resend. Retention flags never delete records automatically.

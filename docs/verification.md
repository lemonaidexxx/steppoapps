# Verification record

## Completed locally

- 12 automated tests passed on the bundled Node runtime: catalog integrity, applicant categories, family relationships, dates, membership, consent, hidden-field cleanup, search, duplicate signals, idempotency, unavailable courses, placeholder guards, tampered/expired tokens, failed and uncertain writes, lock contention, oversized requests, honeypot, stale consent and formula-like text.
- CUA browser inspection completed the synthetic family-member application: search Housekeeping, filter Manila, select institution, validate required fields, enter former-OFW details, reveal Other training goal, accept demo consent, review, and receive a DEMO receipt.
- Returning to the catalog preserved search and city filters.
- Desktop home and mobile home/catalog were visually inspected. At the mobile 390px viewport, document content did not overflow horizontally.
- A catalog-filter/address-field collision was found and fixed by restricting form capture to the application form. The runnable browser regression test asserts that the address city starts empty.
- Apps Script build completed. Repository whitespace checks passed.

## Google Sheet completed

- Created Courses, Offerings, Applications and Settings without changing Sheet1.
- Read back all 139 offerings and the 46 Applications headers.
- Confirmed RegistrationEnabled=false and both privacy placeholders.
- Sharing metadata reports owner-only access. Header formatting and wrapping were checked through Sheets cell metadata; authenticated Google-rendered visual inspection was unavailable.

## Still requires the owner session

The available browser reached the signed-out Apps Script landing page. No live Apps Script project or deployment was created, and no anonymous live submission test was run. Follow deployment.md to authorize the owner project, verify using a separate synthetic-data spreadsheet, then deploy. The local browser adapter does not prove live Google transport behavior or actual parallel Apps Script execution. Production remains closed.

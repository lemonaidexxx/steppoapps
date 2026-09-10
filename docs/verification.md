# Verification record — v2, September 10, 2026

## Completed locally

- 20 automated tests pass: all 139 offerings / 53 titles; category and conditional validation; four-digit batch and digits-only IDs preserving zeros; passport spelling; removed voucher and restricted new Sex values; optional consent; idempotent receipts; duplicate safeguards; tampered/expired tokens; unavailable offerings; failed/uncertain writes; size/honeypot/formula guards; private helper isolation.
- Mock Sheets/Gmail checks cover reordered and extra columns, historical voucher/Sex preservation, idempotent migration, disabled switches, one queued confirmation, bounded quota retries, uncertain sends/post-send writes routed to review, retention cutoff and idempotent trigger setup.
- CUA browser testing completed synthetic family and member applications, including optional consent declined and accepted. Both produced DEMO receipts; no Google writes or emails occurred.
- Browser checks verified required-field focus, leading zeros and exact names in review, preserved answers across section fragment navigation, conditional family/other-goal fields, drawer cancel/save, Escape and focus restoration. A category edit introducing missing family fields is revalidated before submission.
- Desktop (1440), tablet (768), and mobile (390) layouts were inspected with the supplied logo. No horizontal document overflow appeared. Mobile header height and section offset were measured; the first/last-section indicators remain unique and the current mobile link scrolls into view.
- Native modal focus wrapping was added after keyboard testing exposed Tab leaving the last drawer button. The rebuilt preview passed forward/reverse drawer wrapping and forward review wrapping; focus stayed inside the open modal.
- The reproducible tests/browser.cjs was updated for the continuous form. Browser actions in this session were run through CUA, not that standalone script.
- Apps Script build succeeds. Source and catalog stay separate from credentials and application records.

## Live Google Sheet

- Read existing headers/settings before writing. Appended 13 columns to Applications (46 → 59), preserving original columns and all application rows. No historical values were rewritten and no historical emails were queued.
- Read back AU1:BG1 and updated Settings: approved contact, December 31, 2026 retention, both consent versions, RegistrationEnabled=false and EmailEnabled=false.
- Catalog tabs and offering IDs were untouched. Sheet1 was absent in current metadata and was not recreated. Existing sharing permissions were not changed.
- New headers copied the prior header formatting. Authenticated Google-rendered visual inspection was unavailable; migration used bounded Sheets API reads/writes.

## Owner rollout remains pending

No live Apps Script project/deployment, Gmail authorization, owner worker trigger, anonymous submission, or real confirmation-delivery test was completed. Follow deployment.md using a separate test spreadsheet and an owner-controlled inbox before opening production. Mocks do not prove live Google authorization, quotas or concurrent execution. Registration and email sending remain disabled.

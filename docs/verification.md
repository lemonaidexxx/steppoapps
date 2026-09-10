# Verification record — v3, September 10, 2026

## Completed

- 30 automated tests cover 139 offerings, checkpoint and conditional validation, leading-zero IDs, exact names, current option keys, parent relationships, disabled selections, edited-label snapshots and historical-row preservation.
- Geographic tests verify 18 regions, 82 source provinces, 149 cities and 1,493 municipalities; all 17 NCR localities; NIR's three provinces and Bacolod; updated municipality names; and all 250 supplied country labels in exact order.
- Mock Apps Script tests cover idempotent migration of populated and missing option tabs, public enabled choices, duplicate/tampered/expired tokens, durable legacy receipts, formula guards, failed/uncertain writes, restricted public RPC, retention and unchanged email-queue safeguards. Repeated applications remain recorded with advisory duplicate flags.
- CUA browser checks exercised member/family checkpoints, invalid-field focus, direct-fragment bypass protection, classification changes preserving answers, applicant-relative deployment labels, conditional navigation/review, leading-zero IDs, NCR/NIR cascades and clearing descendants.
- Privacy opens as the only modal, including from the editor; Escape returns focus and preserves edits. Address editor cancellation preserves the original address. Review and editor remain native dialogs. No optional-program checkbox or separate OFW status intake remains.
- Inspected desktop 1440px, tablet 768px and mobile 390px layouts with the supplied logo. No document overflow; mobile address editor fits as a bottom sheet. The last-section current indicator is unique and family navigation is hidden for members. A synthetic member submission produced a DEMO receipt and a repeat application returned to the checkpoint. No browser console errors were reported.
- tests/browser.cjs is the updated reproducible browser specification. Session browser verification used CUA rather than executing that standalone script. Apps Script build and whitespace checks pass.

## Live spreadsheet

- Inspected existing metadata, headers and settings before bounded writes. Applications now has 61 columns: appended Selection Keys and Configuration Version to the previous 59. No historical application rows were modified.
- Added FormOptions (269 rows) and AddressOptions (1,744 rows). Read back every seeded row and compared it with the generated source. Applied header formatting, frozen headers, filters, row bands, column sizing and input validation.
- Settings records STEP-2026-03 and source release/URL/pinned mirror. RegistrationEnabled=false and EmailEnabled=false. Retired optional-consent settings remain for historical context.
- Catalogs, offering IDs and sharing permissions were untouched. Sheet1 was absent and was not recreated. Authenticated Google-rendered visual inspection was unavailable; API readback verified values and formatting properties.

## Owner rollout remains pending

Upload all generated Apps Script files, authorize Gmail, install owner triggers and deploy against an isolated test Sheet. Anonymous submission and real confirmation delivery must pass before opening production. No live deployment or email was performed here; local previews use synthetic data and mocks do not prove Google authorization, quotas or actual concurrent execution. See deployment.md.

## V4 membership and WhatsApp update

33 automated tests now pass, including applicant membership versus OFW-relative storage, historical blanks in the new column, repeatable migration, staff contact-setting preservation, and stale v3 consent rejection. Browser checks at 1440/768/390 pixels verified the relationship row spans the form/editor grid, relative labels, preserved answers after classification changes, no horizontal overflow, and hidden relative fields for OFW applicants. WhatsApp links resolve to https://wa.me/639927110929 with no personal data; the floating button hides during review/editor/privacy dialogs and does not overlap the review action. Keyboard privacy opening and Escape restore focus. No automatic WhatsApp message was sent.

The live Sheet now has Applications!BJ1 = Membership Details Belong To (62 headers). Settings!A14:B16 contains the developmental year and WhatsApp configuration; B6 contains STEP-2026-04. All written cells and formatting were read back. RegistrationEnabled and EmailEnabled remain false. Historical records were untouched; native rendered Sheet inspection remains unavailable. Owner deployment and isolated live testing are still pending.

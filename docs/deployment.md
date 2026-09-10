# Deploy and operate APO STEP

## Current state

Source is in GitHub. The private stepoapps sheet has the v4 schema and settings. RegistrationEnabled and EmailEnabled are false. No live deployment or confirmation email test has been completed.

Keep the spreadsheet restricted to authorized APO staff. Participants do not need Sheet access. Never publish Applications. Preserve existing tabs and records; setup/migration do not clear or recreate Sheet1. Sheet1 was absent at the September 10, 2026 v2 metadata check.

## Owner project and authorization

1. Sign in at https://script.google.com as the responsible deployment owner. Create a standalone Apps Script project, or use the existing owner project.
2. Run `npm run build`. Copy all generated files from dist: Server.gs, Core.gs, Options.gs, Config.gs, OptionSeed.gs, Setup.gs, Migrate.gs, Mail.gs, Catalog.gs, Index.html and appsscript.json. Enable manifest display in Project Settings. Alternatively authenticate Google's clasp locally and use an ignored `.clasp.json` with `{"scriptId":"YOUR_SCRIPT_ID","rootDir":"dist"}`, then `clasp push`.
3. Add Script property `SPREADSHEET_ID`. Production: `1_MmXK52Mgd3W_-tqCFFo-zozrLEhJ1dRbGOe2pJ90NI`. For testing use a separate blank spreadsheet. Run `setup_` for initialization or `migrateV4_` for an existing installation. Setup creates TOKEN_SECRET if absent. Never disclose this secret or rotate it during outstanding retries.
4. Authorize the manifest scopes for Sheets, Gmail, mail quota checks, and trigger management. GmailApp uses Google's built-in Apps Script service; no API key or separate email provider is required. Gmail access is a broad OAuth scope. Review the scope screen while signed in as the intended owner.
5. Run `installWorkers_` as the deployment owner. It idempotently installs a five-minute email worker and daily retention review trigger for that account. Installable triggers run as their creator, so do not let a different staff account install duplicate workers. Functions ending `_` are private to browser RPC.

The sender is the trigger/deployment owner's Gmail account, display name APO STEP, reply-to apocmwd2026.2027@gmail.com. That reply-to address does not become the sender. Google sending quotas apply; the built-in service is not unlimited. See [GmailApp.sendEmail](<https://developers.google.com/apps-script/reference/gmail/gmail-app#sendEmail(String,String,String,Object)>), [quotas](https://developers.google.com/apps-script/guides/services/quotas), and [installable triggers](https://developers.google.com/apps-script/guides/triggers/installable).

## Settings and migration

| Key                         | Production value                       |
| --------------------------- | -------------------------------------- |
| PrivacyContact              | apocmwd2026.2027@gmail.com             |
| RetentionPeriod             | Through December 31, 2026              |
| ConsentVersion              | STEP-2026-04                           |
| OtherProgramsConsentVersion | APO-OTHER-2026-01                      |
| RegistrationEnabled         | false until rollout passes             |
| EmailEnabled                | false until isolated email test passes |
| Environment                 | production                             |

`migrateV4_` validates legacy header names, rejects missing/duplicate/blank headers, and appends only missing columns (62 total). Existing order and extra columns are supported. Historical voucher, Sex, applications, and catalog IDs are preserved. Historical blank email states are not queued. Migration explicitly closes registration and email sending; replacing privacy values never opens either switch.

## Isolated live test, then rollout

Use a separate test Sheet and Apps Script project with synthetic personal details. Use an email inbox the owner controls for the confirmation recipient. Run setup and install triggers there; enable RegistrationEnabled and EmailEnabled only in the test sheet. Keep Environment=production to exercise the real transport and guards.

Deploy → New deployment → Web app, execute as the owner, access Anyone (anonymous). If anonymous access is unavailable, the Google account administrator or an eligible owner account is needed. Open the /exec URL signed out and test member/family branches, conditional fields, numeric ID 001234, review edits, and a saved receipt. Verify the row remains saved if sending fails. Run `processEmailQueue_` manually or wait for its trigger; verify exactly one message arrives with the expected sender, reply-to, committees and course facts, and Email Status becomes Sent. Retry the original submission: same receipt, no second row or message. A separate duplicate stays recorded and flagged. Check that browser RPC cannot invoke private helpers or read Applications.

Only after those checks deploy the production project, install owner triggers, and explicitly set EmailEnabled=true and RegistrationEnabled=true. Verify the public URL signed out. The local preview uses synthetic data and never sends mail or writes Sheets; mocks do not prove live Google authorization, delivery, quotas, or parallel execution.

## Email queue and recovery

New applications save Pending before any send. The worker holds the script lock through a batch of at most five messages. It saves Sending before Gmail and Sent after success. Submission retries return the existing receipt, leaving its one queue entry unchanged.

Known quota failures use Retry with a 24-hour delay and at most three automatic attempts. Invalid recipients and exhausted attempts become Needs review. Interrupted Sending or uncertain send exceptions become Needs review; they are never blindly resent. Email failure does not change a saved registration into a failure. Inspect Email Attempts, Last Attempt At, Sent At, Next Attempt At, and Error privately. For Needs review, reconcile the registration reference with the owner's Sent mailbox first. If found, mark Sent; only after confirming no message was sent may staff reset to Pending and clear retry timing/attempts. Manual reconciliation is necessary because Gmail and Sheets do not offer one shared atomic transaction.

## Retention and updates

Retention ends December 31, 2026, Philippine time. The daily worker flags records Due for staff review from January 1, 2027. It never deletes records or extends consent. Historical optional-program consent evidence is preserved; its columns are blank for new applications. Staff must resolve retention and privacy requests; a flag is not permission to retain indefinitely.

For updates build and upload all files, run migration if needed, and edit the existing deployment to a new version. Migration closes both switches, so reopen only after verification. On release failure, close both switches and select a previously validated schema-compatible version. Earlier versions are not compatible with v4 membership interpretation and consent. Never roll back application data. Preserve tokens for uncertain-response retries. All stored timestamps are ISO UTC. Update consent versions when purposes change and require applicants to reload the notice; answers are not persisted in browser storage.

## V3 configuration migration

`migrateV4_` seeds FormOptions and AddressOptions only when empty, validates populated tables and preserves staff edits. It appends Selection Keys and Configuration Version to Applications and sets STEP-2026-04 consent. It leaves retired status and optional-consent evidence unchanged. Both operating switches close during migration. Do not run the fresh-sheet API initializer on an existing spreadsheet.

The September 10 live migration is already applied. Upload **all** generated files, including Options.gs, Config.gs and OptionSeed.gs, to the owner project before testing. The old deployed frontend must remain closed. Check checkpoint bypass protection, disabled-option correction, NCR/NIR dropdowns and privacy dialog focus during isolated testing. See options.md for safe staff edits.

## Membership and WhatsApp update

Run migrateV4\_ after uploading all rebuilt files. It appends Membership Details Belong To (62 columns total), seeds DevelopmentalYear=2026 - 2027, WhatsAppNumber=639927110929, WhatsAppEnabled=true, and requires consent STEP-2026-04. Existing contact settings are preserved on repeated runs. DistrictYear remains a compatibility key. WhatsApp appears in the Eligibility page assistance section as a direct public contact link with no automated sending or OpenWA server. Both registration/email switches remain closed until owner verification.

# Deploy and operate APO STEP

## 1. Google Sheet

Destination: https://docs.google.com/spreadsheets/d/1_MmXK52Mgd3W_-tqCFFo-zozrLEhJ1dRbGOe2pJ90NI/edit

Keep Sheet1 intact. The application uses dedicated Courses, Offerings, Applications and Settings tabs. If these are already initialized by the repository setup, do not recreate or clear them. Otherwise `setup_` initializes them safely, checks headers, and seeds empty tabs. Preserve all Applications rows.

Set spreadsheet General access to Restricted and grant only the authorized APO staff editor access. The Apps Script owner must retain access. Never publish Applications to the web. The website does not require participants to have spreadsheet access.

## 2. Apps Script project

Create a standalone project at https://script.google.com while signed in as the responsible APO owner. Run `npm run build`. Copy `dist/Server.gs`, `Core.gs`, `Setup.gs`, `Catalog.gs`, `Index.html`, and `appsscript.json` into matching editor files. Enable display of the manifest in Project Settings before replacing it.

For command-line deployment, install Google's clasp CLI and authenticate locally. Create a local `.clasp.json` with `{"scriptId":"YOUR_SCRIPT_ID","rootDir":"dist"}` and run `clasp push`. `.clasp.json`, OAuth credentials, and generated files are ignored by git. Do not add a credential to a workflow or repository. Manual editor upload works without clasp.

In Project Settings → Script properties, add `SPREADSHEET_ID` with the destination ID. Run `setup_` from the editor and authorize Sheets access. It creates a random TOKEN_SECRET if missing; never copy that value into frontend files. Functions ending in an underscore cannot be called with google.script.run.

## 3. Test in isolation

Create a separate blank test spreadsheet and a separate Apps Script project. Point its SPREADSHEET_ID to the test sheet, run setup_, and use only synthetic participants. In its Settings, use `privacy@example.invalid`, `Synthetic test data; delete after testing`, and set RegistrationEnabled to true. Keep Environment as production so the real guard path is exercised. These test values must never be used in the real destination.

Deploy → New deployment → Web app. Execute as the owner. Choose Anyone (anonymous), not only signed-in Google users. Open the `/exec` URL in a signed-out browser. If Anyone is unavailable, the account's administrator must permit anonymous web apps or an eligible APO owner account is needed; do not substitute a login-required deployment.

Check course browsing, all applicant/relationship branches, review/back edits, confirmation, and the resulting Applications row. Double-click and retry the same request: it must produce one row. Submit another application with matching synthetic email: both records remain and the later row is flagged. Test closed registration and disabled offerings. Verify that a browser cannot retrieve Applications or invoke setup_. Local mocks do not replace this live check.

## 4. Production activation

Replace the approved privacy contact and retention period in Settings. Review the consent prose in src/app.js with the responsible APO program owner and update ConsentVersion when changing its meaning. Supply the approved APO logo; the current wordmark is a placeholder, not an official seal. Confirm the intended treatment of any family applicants who are minors before opening to that audience; there is no automated age gate.

Keep Environment=production. After isolated testing and privacy approval, set RegistrationEnabled=true. The server still rejects unresolved privacy placeholders. Deploy an owner-executed anonymous web app and verify the public URL while signed out. Do not link the private spreadsheet publicly.

## 5. Updates and rollback

Keep published versions: edit the existing deployment to use a new version, retaining its URL. If a release fails, set RegistrationEnabled=false and switch the deployment to the prior version. Do not delete Applications or rotate TOKEN_SECRET during retries: rotation invalidates outstanding signed tokens. Never use deployment rollback to roll back application records.

Review Apps Script execution failures and quotas through the owner's console; logs intentionally omit request payloads. Review duplicate flags privately. Close registrations during sustained failures or abusive traffic. A lost response can be retried using the same token and payload for the original receipt, even if the token expires after the write. An expired token with no saved application can be refreshed. For a changed privacy notice, copy your answers before reloading; the app never persists personal data to browser storage.

Stored timestamps are ISO UTC. Staff may use a separate view for local-time reporting. Review Status starts Pending review; staff may use Approved, Declined, Needs follow-up, or Withdrawn as their process requires. Set Updated At when manually changing a record. No automatic learner merging or retention deletion is enabled.

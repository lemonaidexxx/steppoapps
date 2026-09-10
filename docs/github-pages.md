# GitHub Pages public website

Public address: https://lemonaidexxx.github.io/steppoapps/

The visible frontend is served by GitHub Pages. A hidden Apps Script HTML-service bridge relays only getPublicData, issueSubmissionToken and submitApplication through google.script.run. Sheets and Gmail remain under the existing owner. The Google URL is a public technical endpoint, not a secret and not the visitor-facing address.

## One-time backend update

1. Run npm run build and replace Apps Script Code.gs with dist/single-file/Code.gs. Keep only this server bundle, not duplicate modular .gs files.
2. Add an HTML file named Bridge and copy dist/single-file/Bridge.html into it. Keep Index.html and the existing manifest. No new OAuth scopes or setup/migration run is needed.
3. Save. Deploy → Manage deployments → Edit → New version → Deploy, retaining the existing /exec URL. TemporarySetup.gs must not be included in a public deployment.
4. PUBLIC_SITE_ORIGIN defaults to https://lemonaidexxx.github.io. For a future custom domain set that Script Property to its exact HTTPS origin and update site-config.json together; paths and trailing slashes do not belong in the origin.

## Publishing

site-config.json contains the public /exec URL and approved frontend origin. The Pages workflow tests, builds and publishes only dist/pages; no .gs backend code, records, credentials or synthetic adapter is included in the deployed artifact. GitHub source remains public as before. Repository Settings → Pages → Source must be GitHub Actions. Pushes to main update the website after the Publish GitHub Pages workflow succeeds.

Keep registration/email disabled until the owner finishes the backend update and isolated signed-out testing. A website deployment alone does not enable either switch. Existing Sheets configuration remains authoritative.

## Connection and testing

Each page load creates a random channel nonce. The bridge accepts requests only from the approved top-level origin and window; the frontend validates the Google content origin, nonce and then pins the responding window. Replies use exact target origins, never wildcard destinations. The bridge has no user interface or administrative RPC. A 30-second connection timeout and 60-second request timeout preserve answers and require explicit retry. Submission retries reuse their original token, retaining durable deduplication and email safeguards.

Test catalog/configuration loading from the GitHub URL in a signed-out browser, both applicant categories, modal editing and the confirmation receipt against an isolated test Sheet. Confirm a saved row and one queued email, then test repeated clicks and uncertain-response retry. Do not infer a live submission success from a network response alone. Browsers or account policies that block Google frames may prevent the connection; the UI reports failure rather than claiming a successful save.

The local npm run preview remains synthetic and sends no emails. The native Apps Script /exec UI remains available for owner diagnostics. Updating backend validation still requires a new Apps Script deployment version; normal frontend wording/layout changes only need a GitHub push.

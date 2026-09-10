# Form and storage contract

These are named headers for the dedicated Applications tab, not columns inferred from Sheet1. V2 preserves all 46 historical columns and appends 13 additions (59 total). Validated header-name mapping supports reordering and extra columns. All fields are text unless noted. Hidden conditional answers are discarded on the server. Dates use YYYY-MM-DD. All applicant and member names carry “Enter exactly as shown on your passport.” Spelling, punctuation and capitalization are preserved; surrounding whitespace is trimmed.

| Form field                        | Applications column    | Type      | Required / condition                                                      |
| --------------------------------- | ---------------------- | --------- | ------------------------------------------------------------------------- |
| Qualifying member chapter         | Chapter                | text      | Required; first field                                                     |
| Batch (year)                      | Batch Year             | text      | Required; exactly four digits                                             |
| Numeric APO ID                    | APO Membership Number  | text      | Required; digits only, leading zeros preserved                            |
| First name                        | First Name             | text      | Yes                                                                       |
| Middle name                       | Middle Name            | text      | No                                                                        |
| Last name                         | Last Name              | text      | Yes                                                                       |
| Date of birth                     | Date of Birth          | date      | Yes; real date, not future; no age gate                                   |
| Sex                               | Sex                    | choice    | Male or Female; required for new submissions; historical values unchanged |
| Civil status                      | Civil Status           | choice    | Optional; sample choices                                                  |
| Contact number                    | Contact Number         | telephone | Required; 7–15 digits, international formatting allowed                   |
| Email                             | Email Address          | email     | Required                                                                  |
| Retired voucher intake            | TESDA Voucher Code     | text      | No form field; blank on new submissions, historical data preserved        |
| Applicant category                | Applicant Category     | choice    | OFW / OFW family member; required after APO details                       |
| Qualifying member's OFW status    | Member OFW Status      | choice    | Current OFW / Former OFW; required                                        |
| Relationship to qualifying member | Relationship to OFW    | choice    | Parent, Child, Sibling, Spouse; family only, required                     |
| Member first name                 | OFW First Name         | text      | Family only, required; derived from applicant for members                 |
| Member middle name                | OFW Middle Name        | text      | Family only, optional; derived for members                                |
| Member last name                  | OFW Last Name          | text      | Family only, required; derived for members                                |
| Member date of birth              | OFW Date of Birth      | date      | Family only, required; derived for members                                |
| Latest country of deployment      | Country of Deployment  | text      | Required; explicit Seabased OFW option via datalist                       |
| Overseas occupation               | Occupation             | text      | Required; most recent for former OFWs                                     |
| Philippine region                 | Region                 | choice    | Required; 18 sample regions                                               |
| Province                          | Province               | text      | Required; enter Metro Manila for NCR                                      |
| City / municipality               | City / Municipality    | text      | Required                                                                  |
| Address line                      | Address Line           | text      | Required                                                                  |
| Future course interest            | Other Course Interest  | text      | Optional                                                                  |
| Training goal                     | Training Goal          | choice    | Required; sample choices                                                  |
| Other goal                        | Other Training Goal    | text      | Required only for Others (Please specify)                                 |
| Consent                           | Consent                | boolean   | Must be true; no preselection                                             |
| Other APO program updates         | Other Programs Consent | boolean   | Optional, initially unchecked; false never blocks STEP                    |
| Selected offering                 | Offering ID            | ID        | Required; validated against current Offerings                             |

Region is a fixed sample list. Province/city use labeled text inputs in v1 to avoid dependence on an unverified live geographic API; they do not restrict course browsing or eligibility. Deployment country accepts text to preserve worldwide and seabased answers without an external service.

## System columns

Registration ID, Submission Token (random nonce, not bearer token), Submitted At, Updated At, Learner ID (blank until staff establishes identity), Course ID, Course Name, Training Center, Modality, Hours, City, Consent Version, Consent Accepted At, Review Status, Possible Duplicate, Duplicate Registration IDs, Source.

Payload Hash preserves retry integrity. STEP Consent Version and Consent Accepted At record required acceptance. Other Programs Consent Version and Other Programs Consent Recorded At record the separate decision and its timestamp for both true and false. Retention Cutoff is 2026-12-31; Retention Review starts Not due and becomes Due for staff review after Philippine year-end. No automatic deletion occurs.

Email Status starts Pending. Email Attempts starts 0. Email Last Attempt At, Email Sent At, Email Next Attempt At, and Email Error support the private worker. Statuses are Pending, Sending, Sent, Retry, and Needs review. These fields remain blank on historical rows during migration to prevent unsolicited requeueing.

New columns appended in order: Chapter, Batch Year, Other Programs Consent, Other Programs Consent Version, Other Programs Consent Recorded At, Retention Cutoff, Retention Review, Email Status, Email Attempts, Email Last Attempt At, Email Sent At, Email Next Attempt At, Email Error. Numeric-looking and formula-like user strings are written as literal text, including membership IDs; Hours and Email Attempts are numbers.

The offering snapshot is server-derived. Default status is Pending review. Duplicate signals: normalized email, phone, or applicant full name + birthdate. Matching member numbers alone never flag or merge family applicants. Receipt retries use the same signed token; changed payload with a used token is rejected. New applications remain separate records.

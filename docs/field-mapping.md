# Form and storage contract

These are named headers for the dedicated Applications tab, not columns inferred from Sheet1. V4 preserves all 61 v3 columns and appends Membership Details Belong To (62 total). Validated header-name mapping supports reordering and extra columns. All fields are text unless noted. Hidden conditional answers are discarded on the server. Dates use YYYY-MM-DD. All applicant and OFW-relative names carry “Enter exactly as shown on your passport.” Spelling, punctuation and capitalization are preserved; surrounding whitespace is trimmed.

| Form field                        | Applications column    | Type      | Required / condition                                                              |
| --------------------------------- | ---------------------- | --------- | --------------------------------------------------------------------------------- |
| Applicant chapter                 | Chapter                | text      | Required; first field                                                             |
| Batch (year)                      | Batch Year             | text      | Required; exactly four digits                                                     |
| Numeric APO ID                    | APO Membership Number  | text      | Required; digits only, leading zeros preserved                                    |
| First name                        | First Name             | text      | Yes                                                                               |
| Middle name                       | Middle Name            | text      | No                                                                                |
| Last name                         | Last Name              | text      | Yes                                                                               |
| Date of birth                     | Date of Birth          | date      | Yes; real date, not future; no age gate                                           |
| Sex                               | Sex                    | choice    | Male or Female; required for new submissions; historical values unchanged         |
| Civil status                      | Civil Status           | choice    | Optional; sample choices                                                          |
| Contact number                    | Contact Number         | telephone | Required; 7–15 digits, international formatting allowed                           |
| Email                             | Email Address          | email     | Required                                                                          |
| Retired voucher intake            | TESDA Voucher Code     | text      | No form field; blank on new submissions, historical data preserved                |
| Applicant category                | Applicant Category     | choice    | OFW or Former OFW / Family member of an OFW or Former OFW; required at checkpoint |
| Qualifying member's OFW status    | Member OFW Status      | choice    | Retired; blank on new rows                                                        |
| Applicant relationship to OFW | Relationship to OFW    | choice    | Parent, Child, Sibling, Spouse; family only, required                             |
| Member first name                 | OFW First Name         | text      | Family only, required; derived from applicant for members                         |
| Member middle name                | OFW Middle Name        | text      | Family only, optional; derived for members                                        |
| Member last name                  | OFW Last Name          | text      | Family only, required; derived for members                                        |
| Member date of birth              | OFW Date of Birth      | date      | Family only, required; derived for members                                        |
| Latest country of deployment      | Country of Deployment  | text      | Required; dropdown with Seabased OFW first                                        |
| Overseas occupation               | Occupation             | text      | Required; most recent for former OFWs                                             |
| Philippine region                 | Region                 | choice    | Required; 18 sample regions                                                       |
| Province                          | Province               | text      | Required; cascading choice; Metro Manila only for NCR                             |
| City / municipality               | City / Municipality    | text      | Required                                                                          |
| Address line                      | Address Line           | text      | Required                                                                          |
| Future course interest            | Other Course Interest  | text      | Optional                                                                          |
| Training goal                     | Training Goal          | choice    | Required; sample choices                                                          |
| Other goal                        | Other Training Goal    | text      | Required only for Others (Please specify)                                         |
| Consent                           | Consent                | boolean   | Must be true; no preselection                                                     |
| Other APO program updates         | Other Programs Consent | boolean   | Retired; blank on new rows, historical evidence preserved                         |
| Selected offering                 | Offering ID            | ID        | Required; validated against current Offerings                                     |

All dropdowns use stable keys from FormOptions or AddressOptions. Region → Province/area → City/Municipality validates parent relationships on the server. Country is required for the applicant or OFW relative. Existing answer columns store current readable labels; Selection Keys stores the submitted keys as JSON, and Configuration Version stores the accepted configuration hash. Label edits never change historical snapshots.

Checkpoint fields are Chapter, Batch Year, APO Membership Number and Applicant Category. Country/occupation appear under Personal information for members and under the family-only OFW-relative section for family applicants. Hidden family identity fields are omitted from navigation/review and derived from the applicant for member records.

## System columns

Registration ID, Submission Token (random nonce, not bearer token), Submitted At, Updated At, Learner ID (blank until staff establishes identity), Course ID, Course Name, Training Center, Modality, Hours, City, Consent Version, Consent Accepted At, Review Status, Possible Duplicate, Duplicate Registration IDs, Source.

Payload Hash preserves retry integrity. STEP Consent Version and Consent Accepted At record required acceptance. Other Programs Consent, Other Programs Consent Version and Other Programs Consent Recorded At are retired: preserve historical values and leave blank for new rows. STEP-2026-04 is one required consent and does not broaden earlier consent. Retention Cutoff is 2026-12-31; Retention Review starts Not due and becomes Due for staff review after Philippine year-end. No automatic deletion occurs.

Email Status starts Pending. Email Attempts starts 0. Email Last Attempt At, Email Sent At, Email Next Attempt At, and Email Error support the private worker. Statuses are Pending, Sending, Sent, Retry, and Needs review. These fields remain blank on historical rows during migration to prevent unsolicited requeueing.

Historical v2 columns appended in order: Chapter, Batch Year, Other Programs Consent, Other Programs Consent Version, Other Programs Consent Recorded At, Retention Cutoff, Retention Review, Email Status, Email Attempts, Email Last Attempt At, Email Sent At, Email Next Attempt At, Email Error. Numeric-looking and formula-like user strings are written as literal text, including membership IDs; Hours and Email Attempts are numbers.

The offering snapshot is server-derived. Default status is Pending review. Duplicate signals: normalized email, phone, or applicant full name + birthdate. Matching member numbers alone never flag or merge family applicants. Receipt retries use the same signed token; changed payload with a used token is rejected. New applications remain separate records.

V3 appends Selection Keys (JSON text) and Configuration Version (hash text). Missing, disabled or mismatched selections return field errors and refreshed enabled choices without losing other answers. Durable same-token receipts are checked before changed configuration; a successful retry does not create a second row or email.

V4 appends Membership Details Belong To, set by the server to Applicant for new rows. Historical blanks retain their prior interpretation. The checkpoint always describes the applicant; family-only OFW columns describe a relative who need not be an APO member.

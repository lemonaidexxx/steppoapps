# Form and storage contract

These are new headers for the dedicated Applications tab, not columns inferred from Sheet1. Setup preserves Sheet1. All fields are text unless noted. Hidden conditional answers are discarded on the server. Dates use YYYY-MM-DD. Required flags follow the sample except explicit APO additions and international phone support.

| Form field | Applications column | Type | Required / condition |
|---|---|---|---|
| First name | First Name | text | Yes |
| Middle name | Middle Name | text | No |
| Last name | Last Name | text | Yes |
| Date of birth | Date of Birth | date | Yes; real date, not future; no age gate |
| Sex | Sex | choice | Male, Female, Prefer not to say; required |
| Civil status | Civil Status | choice | Optional; sample choices |
| Contact number | Contact Number | telephone | Required; 7–15 digits, international formatting allowed |
| Email | Email Address | email | Required |
| TESDA voucher | TESDA Voucher Code | text | Optional |
| Applicant category | Applicant Category | choice | APO Member / Family Member; required |
| Qualifying member's OFW status | Member OFW Status | choice | Current OFW / Former OFW; required |
| Qualifying member's APO membership number | APO Membership Number | text | Required for both categories; not a learner ID |
| Relationship to qualifying member | Relationship to OFW | choice | Parent, Child, Sibling, Spouse; family only, required |
| Member first name | OFW First Name | text | Family only, required; derived from applicant for members |
| Member middle name | OFW Middle Name | text | Family only, optional; derived for members |
| Member last name | OFW Last Name | text | Family only, required; derived for members |
| Member date of birth | OFW Date of Birth | date | Family only, required; derived for members |
| Latest country of deployment | Country of Deployment | text | Required; explicit Seabased OFW option via datalist |
| Overseas occupation | Occupation | text | Required; most recent for former OFWs |
| Philippine region | Region | choice | Required; 18 sample regions |
| Province | Province | text | Required; enter Metro Manila for NCR |
| City / municipality | City / Municipality | text | Required |
| Address line | Address Line | text | Required |
| Future course interest | Other Course Interest | text | Optional |
| Training goal | Training Goal | choice | Required; sample choices |
| Other goal | Other Training Goal | text | Required only for Others (Please specify) |
| Consent | Consent | boolean | Must be true; no preselection |
| Selected offering | Offering ID | ID | Required; validated against current Offerings |

Region is a fixed sample list. Province/city use labeled text inputs in v1 to avoid dependence on an unverified live geographic API; they do not restrict course browsing or eligibility. Deployment country accepts text to preserve worldwide and seabased answers without an external service.

## System columns

Registration ID, Submission Token (random nonce, not bearer token), Submitted At, Updated At, Learner ID (blank until staff establishes identity), Course ID, Course Name, Training Center, Modality, Hours, City, Consent Version, Consent Accepted At, Review Status, Possible Duplicate, Duplicate Registration IDs, Source.

The offering snapshot is server-derived. Default status is Pending review. Duplicate signals: normalized email, phone, or applicant full name + birthdate. Matching member numbers alone never flag or merge family applicants. Receipt retries use the same signed token; changed payload with a used token is rejected. New applications remain separate records.

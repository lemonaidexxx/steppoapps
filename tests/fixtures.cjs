const catalog = require("../data/catalog.json");
function valid() {
  return {
    chapter: "Alpha",
    batchYear: "2000",
    otherProgramsConsentVersion: "APO-OTHER-2026-01",
    firstName: "Test",
    lastName: "Applicant",
    birthDate: "1990-01-01",
    sex: "Male",
    phone: "+63 917 000 0000",
    email: "test@example.invalid",
    category: "OFW",
    ofwStatus: "Former OFW",
    membershipNumber: "00123",
    country: "Seabased OFW",
    occupation: "Test occupation",
    region: "National Capital Region",
    province: "Metro Manila",
    city: "Manila",
    address: "Synthetic test address",
    goal: "Find jobs in the Philippines.",
    offeringId: catalog[0].id,
    consent: true,
    consentVersion: "STEP-2026-02",
  };
}
module.exports = { valid };

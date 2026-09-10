require("../src/options.js").configure(require("../data/options.json"));
const catalog = require("../data/catalog.json");
function valid() {
  return {
    chapter: "Alpha",
    batchYear: "2000",
    otherProgramsConsentVersion: "APO-OTHER-2026-01",
    firstName: "Test",
    lastName: "Applicant",
    birthDate: "1990-01-01",
    sex: "male",
    phone: "+63 917 000 0000",
    email: "test@example.invalid",
    category: "member",
    ofwStatus: "Former OFW",
    membershipNumber: "00123",
    country: "country-seabased",
    occupation: "Test occupation",
    region: "r13",
    province: "p-ncr",
    city: "c1380600000",
    address: "Synthetic test address",
    goal: "goal-0",
    offeringId: catalog[0].id,
    consent: true,
    consentVersion: "STEP-2026-04",
  };
}
module.exports = { valid };

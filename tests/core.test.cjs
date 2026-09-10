const { test } = require("node:test");
const assert = require("node:assert/strict");
const Core = require("../src/core.js");
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
test("139 distinct offerings, 53 courses, superseded selectable and missing modalities labeled", () => {
  assert.equal(catalog.length, 139);
  assert.equal(new Set(catalog.map((o) => o.id)).size, 139);
  assert.equal(new Set(catalog.map((o) => o.courseId)).size, 53);
  assert.equal(
    catalog.filter((o) => o.sourceStatus === "Superseded" && o.selectable)
      .length,
    3,
  );
  assert.equal(catalog.filter((o) => o.modality === "Not specified").length, 2);
  assert.ok(catalog.every((o) => o.hours > 0 && o.institution && o.city));
});
test("member categories, family conditions and hidden values", () => {
  assert.deepEqual(Core.validate(valid()).errors, {});
  for (const status of ["Former OFW", "Current OFW"])
    assert.deepEqual(
      Core.validate({ ...valid(), ofwStatus: status }).errors,
      {},
    );
  let d = { ...valid(), category: "OFW family member" };
  assert.ok(Core.validate(d).errors.relationship);
  for (const relationship of ["Parent", "Child", "Sibling", "Spouse"])
    assert.deepEqual(
      Core.validate({
        ...d,
        relationship,
        ofwFirstName: "Test",
        ofwLastName: "Member",
        ofwBirthDate: "1960-02-20",
      }).errors,
      {},
    );
  assert.equal(
    Core.clean({ ...valid(), ofwFirstName: "stale" }).ofwFirstName,
    "",
  );
});
test("dates, membership, consent, other goal and malformed choices", () => {
  for (const patch of [
    { birthDate: "2023-02-29" },
    { birthDate: "2099-01-01" },
    { membershipNumber: "" },
    { consent: false },
    { sex: "invalid" },
    { phone: "x" },
    { email: "bad" },
    { goal: "Others (Please specify)" },
  ])
    assert.ok(
      Object.keys(Core.validate({ ...valid(), ...patch }).errors).length,
    );
  assert.deepEqual(
    Core.validate({ ...valid(), birthDate: "2015-01-01" }).errors,
    {},
  );
});
test("filtering never combines different provider facts", () => {
  const o = catalog[0];
  assert.ok(
    Core.filterOfferings(catalog, o.institution, o.modality, o.city).some(
      (r) => r.id === o.id,
    ),
  );
  assert.equal(Core.filterOfferings(catalog, "zzzzzz").length, 0);
  assert.equal(
    Core.filterOfferings([{ ...o, selectable: false }], "").length,
    0,
  );
});
test("shared membership number is not a duplicate signal", () => {
  const a = valid(),
    b = {
      ...a,
      firstName: "Other",
      email: "other@example.invalid",
      phone: "+14155550199",
      birthDate: "1992-02-02",
    };
  assert.equal(Core.duplicate(a, b), false);
  assert.equal(Core.duplicate(a, { ...b, email: a.email.toUpperCase() }), true);
});

const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const seed = require("../data/options.json"),
  Options = require("../src/options.js"),
  Core = require("../src/core.js"),
  { server } = require("./mock-gas.cjs"),
  { valid } = require("./fixtures.cjs");
test("PSA release counts, NCR, NIR and current municipality names are complete", () => {
  assert.equal(seed.addresses.filter((o) => o.level === "region").length, 18);
  assert.equal(
    seed.addresses.filter((o) => o.level === "province" && o.sourceCode).length,
    82,
  );
  assert.equal(seed.addresses.filter((o) => o.level === "city").length, 1642);
  const ncr = seed.addresses.filter((o) => o.parent === "r13");
  assert.deepEqual(
    ncr.map((o) => o.label),
    ["Metro Manila"],
  );
  const cities = seed.addresses.filter((o) => o.parent === "p-ncr");
  assert.equal(cities.length, 17);
  assert.ok(cities.some((o) => o.label === "Pateros"));
  assert.ok(cities.some((o) => o.label === "City of Las Piñas"));
  for (const [name, code] of [
    ["Negros Occidental", "1804500000"],
    ["Negros Oriental", "1804600000"],
    ["Siquijor", "1806100000"],
  ])
    assert.ok(
      seed.addresses.some(
        (o) => o.label === name && o.parent === "r18" && o.sourceCode === code,
      ),
    );
  assert.equal(
    seed.addresses.find((o) => o.label === "City of Bacolod").parent,
    "p1804500000",
  );
  assert.ok(seed.addresses.some((o) => o.label === "Sawata"));
  assert.ok(seed.addresses.some((o) => o.label === "Don Victoriano"));
  assert.ok(
    !seed.addresses.some(
      (o) =>
        ["r06", "r07"].includes(o.parent) &&
        ["Negros Occidental", "Negros Oriental", "Siquijor"].includes(o.label),
    ),
  );
});
test("all supplied countries retain exact spelling and order", () => {
  const supplied = fs
    .readFileSync("data/countries.txt", "utf8")
    .trim()
    .split(/\r?\n/);
  assert.equal(supplied.length, 250);
  assert.deepEqual(
    seed.form.filter((o) => o.list === "country").map((o) => o.label),
    supplied,
  );
  Options.configure(seed);
  assert.equal(Options.choices("country", {})[0].key, "country-seabased");
});
test("checkpoint and applicant perspective use stable behavior keys", () => {
  Options.configure(seed);
  assert.deepEqual(
    Core.validate(
      {
        chapter: "A",
        batchYear: "2000",
        membershipNumber: "0001",
        category: "member",
      },
      "checkpoint",
    ).errors,
    {},
  );
  assert.ok(
    Core.validate(
      { chapter: "A", batchYear: "2000", membershipNumber: "0001" },
      "checkpoint",
    ).errors.category,
  );
  assert.ok(!Core.fields.some((f) => f.id === "ofwStatus"));
  const country = Core.fields.find((f) => f.id === "country");
  assert.equal(
    Core.sectionFor(country, { category: "member" }),
    "personal-information",
  );
  assert.equal(Core.sectionFor(country, { category: "family" }), "ofw-details");
  assert.equal(
    Core.labelFor(country, { category: "member" }),
    "Your country of deployment",
  );
});
test("address parents and tampered dropdown keys are server validated", () => {
  for (const patch of [
    { region: "r06" },
    { province: "p1804500000" },
    { country: "not-a-country" },
    { category: "a-label" },
    { sex: "unknown" },
  ]) {
    const s = server();
    const result = s.ctx.submitApplication(s.request({ ...valid(), ...patch }));
    assert.equal(result.ok, false);
    assert.ok(result.errors);
    assert.equal(s.sheets.Applications.length, 1);
  }
});
test("label edits resolve to snapshots; old applications and retry receipts remain unchanged", () => {
  const s = server(),
    req = s.request(),
    receipt = s.ctx.submitApplication(req);
  assert.ok(receipt.ok);
  const before = s.record();
  s.sheets.FormOptions.find((r) => r[1] === "member")[2] =
    "Updated member label";
  const again = s.ctx.submitApplication(req);
  assert.equal(again.registrationId, receipt.registrationId);
  assert.equal(s.record()["Applicant Category"], before["Applicant Category"]);
  assert.ok(s.ctx.submitApplication(s.request()).ok);
  assert.equal(s.record(2)["Applicant Category"], "Updated member label");
  assert.equal(s.record(2)["Possible Duplicate"], true);
  assert.equal(JSON.parse(s.record(2)["Selection Keys"]).category, "member");
  assert.notEqual(
    s.record(2)["Configuration Version"],
    before["Configuration Version"],
  );
});
test("disabled options return refreshed configuration without a saved row", () => {
  const s = server();
  s.sheets.FormOptions.find((r) => r[1] === "country-seabased")[3] = false;
  const r = s.ctx.submitApplication(s.request());
  assert.equal(r.ok, false);
  assert.ok(r.errors.country);
  assert.ok(r.configuration.version);
  assert.equal(s.sheets.Applications.length, 1);
});
test("migration preserves staff option edits and historical consent; retired columns blank on new rows", () => {
  const s = server();
  s.sheets.FormOptions.find((r) => r[1] === "member")[2] = "Staff label";
  const count = s.sheets.FormOptions.length;
  s.ctx.migrateV3_();
  s.ctx.migrateV3_();
  assert.equal(s.sheets.FormOptions.length, count);
  assert.equal(
    s.sheets.FormOptions.find((r) => r[1] === "member")[2],
    "Staff label",
  );
  s.sheets.Settings.find((r) => r[0] === "RegistrationEnabled")[1] = "true";
  assert.ok(s.ctx.submitApplication(s.request()).ok);
  const row = s.record();
  for (const key of [
    "TESDA Voucher Code",
    "Member OFW Status",
    "Other Programs Consent",
    "Other Programs Consent Version",
    "Other Programs Consent Recorded At",
  ])
    assert.equal(row[key], "");
  assert.equal(row["Consent Version"], "STEP-2026-03");
  assert.ok(row["Consent Accepted At"]);
});
test("missing, duplicate and unsupported configuration fails closed", () => {
  const s = server();
  s.sheets.FormOptions.push(s.sheets.FormOptions[1].slice());
  assert.equal(s.ctx.getPublicData().ok, false);
  assert.equal(s.ctx.submitApplication(s.request()).ok, false);
  const bad = JSON.parse(JSON.stringify(seed));
  bad.form.push({
    list: "category",
    key: "unrecognized",
    label: "Wrong",
    enabled: true,
    order: 10,
  });
  assert.throws(() => Options.configure(bad));
  Options.configure(seed);
});

test("fresh option tabs are seeded once and public choices omit disabled branches", () => {
  const s = server();
  delete s.sheets.FormOptions;
  delete s.sheets.AddressOptions;
  s.ctx.migrateV3_();
  s.ctx.migrateV3_();
  assert.equal(s.sheets.FormOptions.length, 270);
  assert.equal(s.sheets.AddressOptions.length, 1745);
  s.sheets.AddressOptions.find((r) => r[0] === "r18")[4] = false;
  const result = s.ctx.getPublicData();
  assert.ok(result.ok);
  assert.ok(
    !result.configuration.addresses.some(
      (o) => o.key === "r18" || o.parent === "r18" || o.key === "c1830200000",
    ),
  );
  Options.configure(JSON.parse(JSON.stringify(result.configuration)));
  Options.configure(seed);
});

test("legacy receipt survives migration and changed configuration without a second email", () => {
 const s=server(), request=s.request(), receipt=s.ctx.submitApplication(request);
 const old={...request.data,category:"OFW",sex:"Male",country:"Seabased OFW",region:"National Capital Region",province:"Metro Manila",city:"Manila",goal:"Find jobs in the Philippines",consentVersion:"STEP-2026-02",otherProgramsConsent:false};
 s.sheets.Applications[1][s.sheets.Applications[0].indexOf("Payload Hash")]=s.ctx.hash_(s.ctx.StepCore.legacyClean(old));
 s.ctx.migrateV3_();
 const retry=s.ctx.submitApplication({...request,data:old});
 assert.equal(retry.registrationId,receipt.registrationId);assert.equal(s.sheets.Applications.length,2);assert.equal(s.record()["Email Status"],"Pending");
});

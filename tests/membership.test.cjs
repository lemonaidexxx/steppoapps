const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs");
const { server } = require("./mock-gas.cjs"),
  { valid } = require("./fixtures.cjs"),
  Core = require("../src/core.js");
test("applicant membership and separate non-member OFW relative are stored", () => {
  const s = server();
  const d = {
    ...valid(),
    category: "family",
    relationship: "child",
    ofwFirstName: "Relative",
    ofwLastName: "Different",
    ofwBirthDate: "1970-01-01",
  };
  assert.ok(s.ctx.submitApplication(s.request(d)).ok);
  const row = s.record();
  assert.equal(row["Membership Details Belong To"], "Applicant");
  assert.equal(row["APO Membership Number"], "00123");
  assert.equal(row["OFW First Name"], "Relative");
  assert.equal(
    Core.sections.find((x) => x.id === "ofw-details").label,
    "Your OFW relative’s information",
  );
  assert.equal(
    Core.labelFor(
      Core.fields.find((x) => x.id === "relationship"),
      d,
    ),
    "Your relationship to the OFW",
  );
});
test("v4 migration preserves history and staff contact settings and closes switches", () => {
  const s = server();
  const r = s.ctx.submitApplication(s.request());
  assert.ok(r.ok);
  const i = s.sheets.Applications[0].indexOf("Membership Details Belong To");
  s.sheets.Applications[0].splice(i, 1);
  s.sheets.Applications[1].splice(i, 1);
  const before = JSON.stringify(s.sheets.Applications[1]);
  s.ctx.migrateV4_();
  s.sheets.Settings.find((r) => r[0] === "WhatsAppNumber")[1] = "639000000000";
  s.ctx.migrateV4_();
  assert.equal(JSON.stringify(s.sheets.Applications[1]), before);
  assert.equal(s.record()["Membership Details Belong To"], "");
  const settings = s.ctx.getPublicData().settings;
  assert.equal(settings.developmentalYear, "2026 - 2027");
  assert.equal(settings.whatsAppNumber, "639000000000");
  assert.equal(settings.whatsAppEnabled, true);
  assert.equal(settings.consentVersion, "STEP-2026-04");
  assert.equal(settings.registrationEnabled, false);
  assert.match(
    s.ctx.confirmationMessage_(s.record()).body,
    /Developmental Year 2026 - 2027/,
  );
});
test("v3 consent is rejected; family-only wording and direct chat controls are present", () => {
  const s = server();
  assert.equal(
    s.ctx.submitApplication(
      s.request({ ...valid(), consentVersion: "STEP-2026-03" }),
    ).ok,
    false,
  );
  const app = fs.readFileSync("src/app.js", "utf8"),
    html = fs.readFileSync("src/index.html", "utf8"),
    css = fs.readFileSync("src/styles.css", "utf8"),
    form = fs.readFileSync("src/registration.js", "utf8");
  assert.ok(!app.includes("Compare training options by institution"));
  assert.ok(!app.includes("DISTRICT YEAR"));
  assert.match(app, /https:\/\/wa.me\//);
  assert.match(app, /target="_blank"\s+rel="noopener noreferrer"/);
  assert.ok(!html.includes("whatsapp-contact"));
  assert.ok(!css.includes(".whatsapp-contact"));
  assert.match(form, /Enter your own APO chapter/);
  assert.ok(!form.includes("qualifying APO member"));
});

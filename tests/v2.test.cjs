const { test } = require("node:test"),
  assert = require("node:assert/strict");
const Core = require("../src/core.js"),
  { valid } = require("./fixtures.cjs"),
  { server } = require("./mock-gas.cjs");
test("new required APO fields and numeric ID preserve passport names and zeros", () => {
  const v = {
    ...valid(),
    firstName: "María-José",
    lastName: "Dela Cruz",
    membershipNumber: "000123",
  };
  assert.deepEqual(Core.validate(v).errors, {});
  assert.equal(Core.clean(v).membershipNumber, "000123");
  assert.equal(Core.clean(v).firstName, "María-José");
  for (const patch of [
    { chapter: "" },
    { batchYear: "20" },
    { batchYear: "20A0" },
    { membershipNumber: "AB-123" },
    { sex: "Prefer not to say" },
  ])
    assert.ok(Object.keys(Core.validate({ ...v, ...patch }).errors).length);
  assert.ok(!Core.fields.some((f) => f.id === "voucher"));
  assert.equal(Core.clean({ ...v, voucher: "old" }).voucher, undefined);
  assert.ok(
    Core.fields
      .filter((f) => f.id.endsWith("Name"))
      .every((f) => /exactly as shown on .*passport\./.test(f.hint)),
  );
});
test("new records queue once and retired consent fields stay blank", () => {
  const s = server(),
    r = s.request({ ...valid(), otherProgramsConsent: false });
  const a = s.ctx.submitApplication(r);
  assert.ok(a.ok);
  s.ctx.submitApplication(r);
  assert.equal(s.sheets.Applications.length, 2);
  const row = s.record();
  assert.equal(row["APO Membership Number"], "00123");
  assert.equal(row["Other Programs Consent"], "");
  assert.equal(row["Member OFW Status"], "");
  assert.equal(row["Email Status"], "Pending");
  assert.equal(row["TESDA Voucher Code"], "");
  assert.equal(s.sent.length, 0);
});
test("migration preserves historical fields and extra/reordered columns; repeated run appends nothing", () => {
  const s = server();
  s.sheets.Applications = [
    ["Custom notes", ...Core.legacyHeaders.slice().reverse()],
  ];
  const old = s.sheets.Applications[0].map((h) =>
    h === "TESDA Voucher Code"
      ? "KEEP"
      : h === "Sex"
        ? "Prefer not to say"
        : h === "Registration ID"
          ? "OLD-1"
          : "",
  );
  s.sheets.Applications.push(old.slice());
  s.ctx.migrateV4_();
  s.ctx.migrateV4_();
  assert.equal(
    s.sheets.Settings.find((r) => r[0] === "EmailEnabled")[1],
    "false",
  );
  assert.equal(
    s.sheets.Settings.find((r) => r[0] === "RegistrationEnabled")[1],
    "false",
  );
  assert.deepEqual(s.sheets.Applications[1].slice(0, old.length), old);
  assert.equal(s.sheets.Applications[0].length, Core.headers.length + 1);
  assert.equal(s.record()["Email Status"], "");
  s.sheets.Settings.find((r) => r[0] === "RegistrationEnabled")[1] = "true";
  assert.ok(s.ctx.submitApplication(s.request()).ok);
  assert.equal(s.record(2)["Chapter"], "Alpha");
});
test("duplicate headers fail closed", () => {
  const s = server();
  s.sheets.Applications[0].push("Sex");
  assert.throws(() => s.ctx.migrateV4_());
  assert.equal(s.ctx.submitApplication(s.request()).ok, false);
});
test("confirmation sends once with limited data and committee reply-to", () => {
  const s = server();
  s.ctx.submitApplication(s.request());
  s.ctx.processEmailQueue_();
  s.ctx.processEmailQueue_();
  assert.equal(s.sent.length, 1);
  assert.equal(s.record()["Email Status"], "Sent");
  assert.equal(s.sent[0][3].replyTo, "apocmwd2026.2027@gmail.com");
  assert.match(s.sent[0][2], /25 learners/);
  assert.match(s.sent[0][2], /Committee on Training and Skills Development/);
  assert.ok(!s.sent[0][2].includes("00123"));
  assert.ok(!s.sent[0][2].includes("1990-01-01"));
  assert.ok(!s.sent[0][2].includes("Synthetic test address"));
});
test("quota failures retry within bounds, disabled and overlapping workers send nothing", () => {
  const s = server();
  s.ctx.submitApplication(s.request());
  s.control.quota = 0;
  s.ctx.processEmailQueue_();
  assert.equal(s.record()["Email Status"], "Retry");
  assert.equal(s.sent.length, 0);
  s.ctx.processEmailQueue_();
  assert.equal(s.record()["Email Attempts"], 1);
  s.control.now = Date.now() + 25 * 60 * 60 * 1000;
  s.ctx.processEmailQueue_();
  s.control.now += 25 * 60 * 60 * 1000;
  s.ctx.processEmailQueue_();
  assert.equal(s.record()["Email Status"], "Needs review");
  const t = server();
  t.ctx.submitApplication(t.request());
  t.control.busy = true;
  t.ctx.processEmailQueue_();
  assert.equal(t.sent.length, 0);
  t.control.busy = false;
  t.sheets.Settings.find((r) => r[0] === "EmailEnabled")[1] = "false";
  t.ctx.processEmailQueue_();
  assert.equal(t.sent.length, 0);
});
test("uncertain Gmail and post-send write outcomes require review without resend", () => {
  for (const mode of ["mailThrows", "failSentStatus"]) {
    const s = server();
    s.ctx.submitApplication(s.request());
    if (mode === "mailThrows") s.control.mailThrows = "Network interruption";
    else s.control.failSentStatus = true;
    try {
      s.ctx.processEmailQueue_();
    } catch (e) {}
    s.control.mailThrows = "";
    s.control.failSentStatus = false;
    s.ctx.processEmailQueue_();
    assert.equal(s.record()["Email Status"], "Needs review");
    assert.equal(s.sent.length, mode === "mailThrows" ? 0 : 1);
  }
});
test("retention review after Philippine end of year flags without deleting; trigger installation idempotent", () => {
  const s = server();
  s.control.now = Date.parse("2026-12-30T00:00:00Z");
  s.ctx.submitApplication(s.request());
  s.ctx.reviewRetention_();
  assert.equal(s.record()["Retention Review"], "Not due");
  s.control.now = Date.parse("2026-12-31T16:00:00Z");
  s.ctx.reviewRetention_();
  assert.equal(s.record()["Retention Review"], "Due for staff review");
  assert.equal(s.sheets.Applications.length, 2);
  s.ctx.installWorkers_();
  s.ctx.installWorkers_();
  assert.equal(s.triggers.length, 2);
});

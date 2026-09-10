const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const crypto = require("node:crypto");
const Core = require("../src/core.js");
const catalog = require("../data/catalog.json");
const { valid } = require("./fixtures.cjs");
function server() {
  const sheets = {
    Settings: [
      ["Key", "Value"],
      ["PrivacyContact", "privacy@example.invalid"],
      ["RetentionPeriod", "Test policy"],
      ["ConsentVersion", "STEP-2026-01"],
      ["RegistrationEnabled", "true"],
      ["Environment", "production"],
    ],
    Offerings: [
      [
        "Offering ID",
        "Course ID",
        "Course Name",
        "Training Center",
        "Modality",
        "Hours",
        "City",
        "Selectable",
      ],
      ...catalog.map((o) => [
        o.id,
        o.courseId,
        o.courseName,
        o.institution,
        o.modality,
        o.hours,
        o.city,
        true,
      ]),
    ],
    Applications: [Core.headers],
  };
  const control = { busy: false, fail: false, failAfterWrite: false },
    props = {
      SPREADSHEET_ID: "test-sheet",
      TOKEN_SECRET: "test-secret-at-least-thirty-two-characters",
    };
  const spreadsheet = {
    getSheetByName(name) {
      if (!sheets[name]) return null;
      return {
        getDataRange() {
          return { getValues: () => sheets[name].map((r) => r.slice()) };
        },
        getLastRow: () => sheets[name].length,
        getRange(row, col, n, m) {
          return {
            getValues: () =>
              sheets[name]
                .slice(row - 1, row - 1 + n)
                .map((r) => r.slice(col - 1, col - 1 + m)),
            setValues(values) {
              if (control.fail) throw Error("test write failure");
              for (let i = 0; i < values.length; i++) {
                sheets[name][row - 1 + i] ||= [];
                values[i].forEach(
                  (v, j) =>
                    (sheets[name][row - 1 + i][col - 1 + j] =
                      typeof v === "string" && v.startsWith("'")
                        ? v.slice(1)
                        : v),
                );
              }
              if (control.failAfterWrite) throw Error("lost response");
            },
          };
        },
      };
    },
  };
  const ctx = vm.createContext({
    console: { error() {} },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k) => props[k] }),
    },
    SpreadsheetApp: { openById: () => spreadsheet, flush() {} },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => !control.busy,
        hasLock: () => !control.busy,
        releaseLock() {},
      }),
    },
    Utilities: {
      getUuid: () => crypto.randomUUID(),
      base64EncodeWebSafe: (b) => Buffer.from(b).toString("base64url"),
      computeHmacSha256Signature: (s, k) =>
        crypto.createHmac("sha256", k).update(s).digest(),
      computeDigest: (_, s) => crypto.createHash("sha256").update(s).digest(),
      DigestAlgorithm: { SHA_256: "sha256" },
    },
  });
  vm.runInContext(
    fs.readFileSync("src/core.js", "utf8") +
      "\n" +
      fs.readFileSync("src/server.gs", "utf8"),
    ctx,
  );
  function request(d = valid()) {
    return { data: d, token: ctx.issueSubmissionToken().token, website: "" };
  }
  return { ctx, sheets, control, request };
}
test("durable idempotency and changed-payload rejection", () => {
  const s = server(),
    r = s.request(),
    a = s.ctx.submitApplication(r),
    b = s.ctx.submitApplication(r);
  assert.equal(a.ok, true);
  assert.equal(a.registrationId, b.registrationId);
  assert.equal(s.sheets.Applications.length, 2);
  assert.equal(
    s.ctx.submitApplication({ ...r, data: { ...r.data, firstName: "Changed" } })
      .code,
    "TOKEN_USED",
  );
});
test("possible duplicates retained without public disclosure", () => {
  const s = server();
  s.ctx.submitApplication(s.request());
  const b = s.ctx.submitApplication(s.request());
  assert.equal(b.ok, true);
  assert.equal(s.sheets.Applications.length, 3);
  assert.equal(
    s.sheets.Applications[2][Core.headers.indexOf("Possible Duplicate")],
    true,
  );
  assert.equal(b.duplicate, undefined);
});
test("placeholder guard, unavailable offering and tampered tokens", () => {
  const s = server(),
    r = s.request();
  s.sheets.Settings[1][1] = "[APO PRIVACY CONTACT EMAIL]";
  assert.equal(s.ctx.submitApplication(r).ok, false);
  assert.equal(s.ctx.issueSubmissionToken().ok, false);
  s.sheets.Settings[1][1] = "privacy@example.invalid";
  s.sheets.Offerings[1][7] = false;
  assert.equal(s.ctx.submitApplication(r).ok, false);
  assert.equal(
    s.ctx.submitApplication({ ...r, token: r.token + "x" }).code,
    "TOKEN_INVALID",
  );
});
test("lock contention, failed write and uncertain successful write can retry", () => {
  for (const mode of ["busy", "fail", "failAfterWrite"]) {
    const s = server(),
      r = s.request();
    s.control[mode] = true;
    assert.equal(s.ctx.submitApplication(r).ok, false);
    s.control[mode] = false;
    assert.equal(s.ctx.submitApplication(r).ok, true);
    assert.equal(s.sheets.Applications.length, 2);
  }
});
test("server rejects malformed, oversized, bot and stale consent requests", () => {
  const s = server();
  for (const r of [
    { ...s.request(), website: "spam" },
    { ...s.request(), extra: "x".repeat(19000) },
    s.request({ ...valid(), membershipNumber: "" }),
    s.request({ ...valid(), consentVersion: "old" }),
  ])
    assert.equal(s.ctx.submitApplication(r).ok, false);
  assert.equal(s.sheets.Applications.length, 1);
});
test("formula-like input remains literal; private helpers not exposed", () => {
  const s = server();
  assert.equal(
    s.ctx.submitApplication(
      s.request({ ...valid(), firstName: '=IMPORTXML("x")' }),
    ).ok,
    true,
  );
  assert.equal(s.ctx.literal_("=1+1"), "'=1+1");
  const names = fs
    .readFileSync("src/server.gs", "utf8")
    .match(/function\s+(\w+)\(/g)
    .map((x) => x.slice(9, -1))
    .filter((n) => !n.endsWith("_"));
  assert.deepEqual(names, [
    "doGet",
    "getPublicData",
    "issueSubmissionToken",
    "submitApplication",
  ]);
  const p = s.ctx.getPublicData();
  assert.equal(p.applications, undefined);
  assert.equal(p.settings.TOKEN_SECRET, undefined);
});
test("expired unused token fails but an existing receipt survives expiry", () => {
  const s = server(),
    r = s.request();
  const parts = r.token.split(".");
  parts[1] = "1";
  parts[2] = s.ctx.sign_(parts[0] + "." + parts[1]);
  r.token = parts.join(".");
  assert.equal(s.ctx.submitApplication(r).code, "TOKEN_EXPIRED");
  const good = s.request();
  assert.equal(s.ctx.submitApplication(good).ok, true);
  const p = good.token.split(".");
  p[1] = "1";
  p[2] = s.ctx.sign_(p[0] + "." + p[1]);
  assert.equal(
    s.ctx.submitApplication({ ...good, token: p.join(".") }).ok,
    true,
  );
});

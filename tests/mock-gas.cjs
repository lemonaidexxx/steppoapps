const fs = require("node:fs"),
  vm = require("node:vm"),
  crypto = require("node:crypto");
const Core = require("../src/core.js"),
  catalog = require("../data/catalog.json"),
  { valid } = require("./fixtures.cjs");
function server() {
  const sheets = {
    Settings: [
      ["Key", "Value"],
      ["PrivacyContact", "privacy@example.invalid"],
      ["RetentionPeriod", "Through December 31, 2026"],
      ["ConsentVersion", "STEP-2026-02"],
      ["RegistrationEnabled", "true"],
      ["Environment", "production"],
      ["OtherProgramsConsentVersion", "APO-OTHER-2026-01"],
      ["EmailEnabled", "true"],
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
    Applications: [Core.headers.slice()],
  };
  const control = {
      busy: false,
      fail: false,
      failAfterWrite: false,
      quota: 100,
      mailThrows: "",
      failSentStatus: false,
      now: null,
    },
    sent = [],
    triggers = [];
  const props = {
    SPREADSHEET_ID: "test-sheet",
    TOKEN_SECRET: "test-secret-at-least-thirty-two-characters",
  };
  function sheet(name) {
    if (!sheets[name]) return null;
    return {
      getDataRange() {
        return this.getRange(1, 1, sheets[name].length, this.getLastColumn());
      },
      getLastRow: () => sheets[name].length,
      getLastColumn: () => Math.max(...sheets[name].map((r) => r.length)),
      getMaxColumns: () => 100,
      insertColumnsAfter() {},
      appendRow(row) {
        sheets[name].push(row);
      },
      getRange(row, col, n = 1, m = 1) {
        return {
          getValues: () =>
            Array.from({ length: n }, (_, i) =>
              Array.from(
                { length: m },
                (_, j) => sheets[name][row - 1 + i]?.[col - 1 + j] ?? "",
              ),
            ),
          setValues(values) {
            if (control.fail) throw Error("test write failure");
            values.forEach((r, i) => {
              sheets[name][row - 1 + i] ||= [];
              r.forEach((v, j) => {
                sheets[name][row - 1 + i][col - 1 + j] =
                  typeof v === "string" && v.startsWith("'") ? v.slice(1) : v;
              });
            });
            if (control.failAfterWrite) throw Error("lost response");
            return this;
          },
          setValue(v) {
            if (control.failSentStatus && v === "Sent")
              throw Error("status write lost");
            return this.setValues([[v]]);
          },
          setBackground() {
            return this;
          },
          setFontColor() {
            return this;
          },
          setFontWeight() {
            return this;
          },
        };
      },
    };
  }
  class Clock extends Date {
    constructor(...args) {
      super(...(args.length ? args : [control.now ?? Date.now()]));
    }
    static now() {
      return control.now ?? Date.now();
    }
  }
  const ctx = vm.createContext({
    Date: Clock,
    console: { error() {} },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k) => props[k],
        setProperty: (k, v) => (props[k] = v),
      }),
    },
    SpreadsheetApp: { openById: () => ({ getSheetByName: sheet }), flush() {} },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => !control.busy,
        waitLock() {
          if (control.busy) throw Error("busy");
        },
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
    MailApp: { getRemainingDailyQuota: () => control.quota },
    GmailApp: {
      sendEmail(...args) {
        if (control.mailThrows) throw Error(control.mailThrows);
        sent.push(args);
        control.quota--;
      },
    },
    ScriptApp: {
      getProjectTriggers: () =>
        triggers.map((name) => ({ getHandlerFunction: () => name })),
      newTrigger(name) {
        return {
          timeBased() {
            return this;
          },
          everyMinutes() {
            return this;
          },
          everyDays() {
            return this;
          },
          atHour() {
            return this;
          },
          create() {
            triggers.push(name);
          },
        };
      },
    },
  });
  vm.runInContext(
    ["src/core.js", "src/server.gs", "src/mail.gs", "src/migrate.gs"]
      .map((p) => fs.readFileSync(p, "utf8"))
      .join("\n"),
    ctx,
  );
  return {
    ctx,
    sheets,
    control,
    sent,
    triggers,
    request: (data = valid()) => ({
      data,
      token: ctx.issueSubmissionToken().token,
      website: "",
    }),
    record: (i = 1) =>
      Object.fromEntries(
        sheets.Applications[0].map((h, j) => [
          h,
          sheets.Applications[i]?.[j] ?? "",
        ]),
      ),
  };
}
module.exports = { server };

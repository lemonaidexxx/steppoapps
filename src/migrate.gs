/* Run migrateV2_ in the editor after replacing project files. Idempotent, no deletes. */
function migrateV2_() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = spreadsheet_(),
      sheet = ss.getSheetByName("Applications");
    if (!sheet) throw new Error("Run setup_ first");
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (
      headers.some(function (h) {
        return !h;
      }) ||
      new Set(headers).size !== headers.length
    )
      throw new Error("Duplicate or empty headers; review before migration");
    StepCore.legacyHeaders.forEach(function (h) {
      if (headers.indexOf(h) < 0)
        throw new Error("Missing legacy column: " + h);
    });
    var missing = StepCore.headers.filter(function (h) {
      return headers.indexOf(h) < 0;
    });
    if (missing.length) {
      var total = headers.length + missing.length;
      if (sheet.getMaxColumns() < total)
        sheet.insertColumnsAfter(
          sheet.getMaxColumns(),
          total - sheet.getMaxColumns(),
        );
      sheet
        .getRange(1, headers.length + 1, 1, missing.length)
        .setValues([missing])
        .setBackground("#142e4c")
        .setFontColor("#ffffff")
        .setFontWeight("bold");
    }
    var settings = ss.getSheetByName("Settings"),
      rows = settings.getDataRange().getValues();
    var updates = {
      PrivacyContact: "apocmwd2026.2027@gmail.com",
      RetentionPeriod: "Through December 31, 2026",
      ConsentVersion: "STEP-2026-02",
      OtherProgramsConsentVersion: "APO-OTHER-2026-01",
    };
    Object.keys(updates).forEach(function (key) {
      var index = rows.findIndex(function (r) {
        return r[0] === key;
      });
      if (index < 0) {
        settings.appendRow([key, updates[key]]);
        rows.push([key, updates[key]]);
      } else settings.getRange(index + 1, 2).setValue(updates[key]);
    });
    // Migration does not reopen registration or start sending messages.
    ["RegistrationEnabled", "EmailEnabled"].forEach(function (key) {
      var index = rows.findIndex(function (r) {
        return r[0] === key;
      });
      if (index < 0) {
        settings.appendRow([key, "false"]);
        rows.push([key, "false"]);
      } else settings.getRange(index + 1, 2).setValue("false");
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  reviewRetention_();
}

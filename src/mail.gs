/* Private owner-authorized worker. Never called from browser RPC. */
function applicationHeaders_(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (
    new Set(headers).size !== headers.length ||
    headers.some(function (h) {
      return !h;
    })
  )
    throw new Error("Duplicate or empty application header");
  StepCore.headers.forEach(function (h) {
    if (headers.indexOf(h) < 0)
      throw new Error("Missing application header: " + h);
  });
  return headers;
}
function updateApplicationCells_(sheet, headers, row, updates) {
  Object.keys(updates).forEach(function (key) {
    var index = headers.indexOf(key);
    if (index < 0) throw new Error("Missing application header");
    sheet.getRange(row, index + 1).setValue(literal_(updates[key]));
  });
  SpreadsheetApp.flush();
}
function confirmationMessage_(record) {
  return {
    subject: "APO STEP application received — " + record["Registration ID"],
    body:
      "Thank you for applying to APO STEP.\n\nYour application has been received for staff review. This is not a confirmation of enrollment.\n\nRegistration reference: " +
      record["Registration ID"] +
      "\nCourse: " +
      record["Course Name"] +
      "\nTraining institution: " +
      record["Training Center"] +
      "\nModality: " +
      record.Modality +
      "\nTraining hours: " +
      record.Hours +
      "\nLocation: " +
      record.City +
      "\n\nEach class requires 25 learners before training can begin. Please keep your phone lines open and check your email regularly for updates.\n\nAlpha Phi Omega Philippines, Inc.\nDevelopmental Year " +
      (settings_().DevelopmentalYear || "2026 - 2027") +
      "\nCommittee on Training and Skills Development\nCommittee on Members’ Welfare and Development\n\nFor assistance, reply to this message.\nPrivacy requests: apocmwd2026.2027@gmail.com",
  };
}
function processEmailQueue_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var settings = settings_();
    if (settings.EmailEnabled !== "true") return;
    var sheet = spreadsheet_().getSheetByName("Applications"),
      headers = applicationHeaders_(sheet),
      values = sheet.getDataRange().getValues(),
      now = new Date().toISOString(),
      count = 0;
    for (var i = 1; i < values.length; i++) {
      var record = {};
      headers.forEach(function (h, j) {
        record[h] = values[i][j];
      });
      if (!record["Registration ID"]) continue;
      var status = record["Email Status"],
        attempts = Number(record["Email Attempts"] || 0);
      // No Sending item can belong to another running worker while this script lock is held.
      if (status === "Sending") {
        updateApplicationCells_(sheet, headers, i + 1, {
          "Email Status": "Needs review",
          "Email Error":
            "Previous send outcome is uncertain. Check Sent mail before manually retrying.",
        });
        continue;
      }
      if (status !== "Pending" && status !== "Retry") continue;
      if (count >= 5) break;
      if (
        record["Email Next Attempt At"] &&
        String(record["Email Next Attempt At"]) > now
      )
        continue;
      if (attempts >= 3) {
        updateApplicationCells_(sheet, headers, i + 1, {
          "Email Status": "Needs review",
          "Email Error": "Maximum automatic attempts reached.",
        });
        continue;
      }
      count++;
      attempts++;
      var address = String(record["Email Address"] || "");
      if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(address)) {
        updateApplicationCells_(sheet, headers, i + 1, {
          "Email Status": "Needs review",
          "Email Error": "Invalid recipient address.",
        });
        continue;
      }
      // A quota check happens before marking a send as started.
      var quota;
      try {
        quota = MailApp.getRemainingDailyQuota();
      } catch (e) {
        quota = 0;
      }
      if (quota < 1) {
        updateApplicationCells_(sheet, headers, i + 1, {
          "Email Status": attempts >= 3 ? "Needs review" : "Retry",
          "Email Attempts": attempts,
          "Email Last Attempt At": now,
          "Email Next Attempt At": new Date(
            Date.now() + 24 * 60 * 60 * 1000,
          ).toISOString(),
          "Email Error":
            "Daily email quota or authorization unavailable; no send attempted.",
        });
        break;
      }
      // Persist Sending BEFORE Gmail. A crash after this point requires manual reconciliation.
      updateApplicationCells_(sheet, headers, i + 1, {
        "Email Status": "Sending",
        "Email Attempts": attempts,
        "Email Last Attempt At": now,
        "Email Next Attempt At": "",
        "Email Error": "",
      });
      var message = confirmationMessage_(record);
      try {
        GmailApp.sendEmail(address, message.subject, message.body, {
          name: "APO STEP",
          replyTo: "apocmwd2026.2027@gmail.com",
        });
      } catch (e) {
        var knownQuota =
          /limit exceeded.*email|daily.*quota|service invoked too many times.*email/i.test(
            String((e && e.message) || ""),
          );
        updateApplicationCells_(sheet, headers, i + 1, {
          "Email Status": knownQuota && attempts < 3 ? "Retry" : "Needs review",
          "Email Next Attempt At":
            knownQuota && attempts < 3
              ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
              : "",
          "Email Error": knownQuota
            ? "Google rejected the send due to an email quota."
            : "Send outcome uncertain. Check Sent mail before manually retrying.",
        });
        continue;
      }
      // Do not catch this write failure as a send failure: Sending must remain durable.
      updateApplicationCells_(sheet, headers, i + 1, {
        "Email Sent At": new Date().toISOString(),
        "Email Error": "",
        "Email Status": "Sent",
      });
    }
  } finally {
    lock.releaseLock();
  }
}
function reviewRetention_() {
  if (new Date().toISOString() < "2026-12-31T16:00:00.000Z") return;
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    var sheet = spreadsheet_().getSheetByName("Applications"),
      headers = applicationHeaders_(sheet),
      values = sheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++)
      if (
        values[i][headers.indexOf("Registration ID")] &&
        values[i][headers.indexOf("Retention Review")] !==
          "Due for staff review"
      )
        updateApplicationCells_(sheet, headers, i + 1, {
          "Retention Cutoff": "2026-12-31",
          "Retention Review": "Due for staff review",
        });
  } finally {
    lock.releaseLock();
  }
}
function installWorkers_() {
  var names = ScriptApp.getProjectTriggers().map(function (t) {
    return t.getHandlerFunction();
  });
  if (names.indexOf("processEmailQueue_") < 0)
    ScriptApp.newTrigger("processEmailQueue_")
      .timeBased()
      .everyMinutes(5)
      .create();
  if (names.indexOf("reviewRetention_") < 0)
    ScriptApp.newTrigger("reviewRetention_")
      .timeBased()
      .everyDays(1)
      .atHour(3)
      .create();
}

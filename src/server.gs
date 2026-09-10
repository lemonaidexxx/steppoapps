/* Only doGet, getPublicData, issueSubmissionToken and submitApplication are public. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile("Index")
    .setTitle("APO STEP | Skills for your next chapter")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}
function spreadsheet_() {
  var id =
    PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  if (!id) throw new Error("Missing spreadsheet configuration");
  return SpreadsheetApp.openById(id);
}
function rows_(name) {
  var sheet = spreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error("Missing sheet");
  var values = sheet.getDataRange().getValues(),
    heads = values.shift();
  return values
    .filter(function (row) {
      return row.some(function (v) {
        return v !== "";
      });
    })
    .map(function (row) {
      var o = {};
      heads.forEach(function (h, i) {
        o[h] = row[i];
      });
      return o;
    });
}
function settings_() {
  var s = {};
  rows_("Settings").forEach(function (r) {
    s[r.Key] = String(r.Value);
  });
  return s;
}
function live_(s) {
  return (
    s.RegistrationEnabled === "true" &&
    s.Environment === "production" &&
    !!String(s.PrivacyContact || "").trim() &&
    !!String(s.RetentionPeriod || "").trim() &&
    !!String(s.ConsentVersion || "").trim() &&
    !!String(s.OtherProgramsConsentVersion || "").trim() &&
    !/[\[\]]/.test(s.PrivacyContact + s.RetentionPeriod) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.PrivacyContact)
  );
}
function offerings_() {
  return rows_("Offerings").map(function (r) {
    return {
      id: r["Offering ID"],
      courseId: r["Course ID"],
      courseName: r["Course Name"],
      institution: r["Training Center"],
      modality: r.Modality,
      hours: r.Hours,
      city: r.City,
      selectable: r.Selectable === true || r.Selectable === "true",
    };
  });
}
function getPublicData() {
  try {
    var s = settings_();
    return {
      ok: true,
      offerings: offerings_().filter(function (r) {
        return r.selectable;
      }),
      settings: {
        programName: s.ProgramName,
        districtYear: s.DistrictYear,
        privacyContact: s.PrivacyContact,
        retentionPeriod: s.RetentionPeriod,
        consentVersion: s.ConsentVersion,
        otherProgramsConsentVersion: s.OtherProgramsConsentVersion,
        registrationEnabled: live_(s),
      },
    };
  } catch (e) {
    console.error("Public configuration unavailable");
    return {
      ok: false,
      message:
        "The course catalog is temporarily unavailable. Please try again.",
    };
  }
}
function secret_() {
  var secret =
    PropertiesService.getScriptProperties().getProperty("TOKEN_SECRET");
  if (!secret || secret.length < 32)
    throw new Error("Token secret unavailable");
  return secret;
}
function sign_(text) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(text, secret_()),
  ).replace(/=+$/, "");
}
function safeEqual_(a, b) {
  if (a.length !== b.length) return false;
  var d = 0;
  for (var i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
function issueSubmissionToken() {
  try {
    if (!live_(settings_()))
      return {
        ok: false,
        message:
          "Applications are not open yet. You can still explore courses.",
      };
    var nonce = Utilities.getUuid(),
      expires = Date.now() + 2 * 60 * 60 * 1000,
      body = nonce + "." + expires;
    return { ok: true, token: body + "." + sign_(body) };
  } catch (e) {
    return {
      ok: false,
      message: "Unable to prepare your application. Please try again.",
    };
  }
}
function token_(value) {
  if (typeof value !== "string" || value.length > 200)
    throw new Error("Invalid token");
  var parts = value.split(".");
  if (
    parts.length !== 3 ||
    !/^\d+$/.test(parts[1]) ||
    !safeEqual_(sign_(parts[0] + "." + parts[1]), parts[2])
  )
    throw new Error("Invalid token");
  return { nonce: parts[0], expires: Number(parts[1]) };
}
function hash_(data) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      JSON.stringify(data),
    ),
  );
}
function literal_(value) {
  return typeof value === "string" &&
    (/^[\s]*[=+@\-]/.test(value) || /^\d+$/.test(value))
    ? "'" + value
    : value;
}
function receipt_(row) {
  return {
    ok: true,
    registrationId: row["Registration ID"],
    submittedAt: String(row["Submitted At"]),
  };
}
function submitApplication(request) {
  var lock;
  try {
    if (
      !request ||
      typeof request !== "object" ||
      JSON.stringify(request).length > 18000 ||
      request.website
    )
      return { ok: false, message: "Unable to accept this request." };
    var token;
    try {
      token = token_(request.token);
    } catch (e) {
      return {
        ok: false,
        code: "TOKEN_INVALID",
        message:
          "Your submission session is invalid. Refresh the submission session and try again.",
      };
    }
    var result = StepCore.validate(request.data || {}),
      data = result.data;
    if (Object.keys(result.errors).length)
      return {
        ok: false,
        errors: result.errors,
        message: "Please check the highlighted fields.",
      };
    var payloadHash = hash_(data);
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000))
      return {
        ok: false,
        message:
          "The service is busy. Your details are preserved; please try again.",
      };
    var existing = rows_("Applications"),
      previous = existing.find(function (r) {
        return r["Submission Token"] === token.nonce;
      });
    // Check durable receipts before expiry or availability: a successful retry stays successful.
    if (previous) {
      if (previous["Payload Hash"] !== payloadHash)
        return {
          ok: false,
          code: "TOKEN_USED",
          message:
            "This session already submitted different details. Start a new application.",
        };
      return receipt_(previous);
    }
    if (token.expires < Date.now())
      return {
        ok: false,
        code: "TOKEN_EXPIRED",
        message:
          "Your submission session expired. Refresh the submission session; your answers are preserved.",
      };
    var s = settings_();
    if (!live_(s))
      return {
        ok: false,
        message:
          "Applications are not open yet. Your answers have been preserved.",
      };
    if (
      data.consentVersion !== s.ConsentVersion ||
      data.otherProgramsConsentVersion !== s.OtherProgramsConsentVersion
    )
      return {
        ok: false,
        code: "CONSENT_CHANGED",
        message:
          "The privacy notice has changed. Reload the page and review the current notice before applying.",
      };
    var offering = offerings_().find(function (o) {
      return o.id === data.offeringId && o.selectable;
    });
    if (!offering)
      return {
        ok: false,
        message:
          "This offering is no longer accepting applications. Return to the catalog to select another.",
      };
    var matches = existing
      .filter(function (row) {
        var old = {};
        StepCore.fields.forEach(function (f) {
          old[f.id] = String(row[f.column] || "");
        });
        return StepCore.duplicate(data, old);
      })
      .map(function (row) {
        return row["Registration ID"];
      });
    var now = new Date().toISOString(),
      record = {
        "Registration ID": "STEP-" + Utilities.getUuid(),
        "Submission Token": token.nonce,
        "Submitted At": now,
        "Updated At": now,
        "Learner ID": "",
        "Offering ID": offering.id,
        "Course ID": offering.courseId,
        "Course Name": offering.courseName,
        "Training Center": offering.institution,
        Modality: offering.modality,
        Hours: offering.hours,
        City: offering.city,
        Consent: true,
        "Consent Version": s.ConsentVersion,
        "Consent Accepted At": now,
        "Review Status": "Pending review",
        "Possible Duplicate": matches.length > 0,
        "Duplicate Registration IDs": matches.join(", "),
        Source: "APO STEP Web",
        "Payload Hash": payloadHash,
        "Other Programs Consent": data.otherProgramsConsent,
        "Other Programs Consent Version": s.OtherProgramsConsentVersion,
        "Other Programs Consent Recorded At": now,
        "Retention Cutoff": "2026-12-31",
        "Retention Review":
          now >= "2026-12-31T16:00:00.000Z"
            ? "Due for staff review"
            : "Not due",
        "Email Status": "Pending",
        "Email Attempts": 0,
      };
    StepCore.fields.forEach(function (f) {
      record[f.column] = data[f.id];
    });
    if (data.category === "OFW") {
      record["OFW First Name"] = data.firstName;
      record["OFW Middle Name"] = data.middleName;
      record["OFW Last Name"] = data.lastName;
      record["OFW Date of Birth"] = data.birthDate;
    }
    var sheet = spreadsheet_().getSheetByName("Applications"),
      heads = applicationHeaders_(sheet);
    sheet.getRange(sheet.getLastRow() + 1, 1, 1, heads.length).setValues([
      heads.map(function (h) {
        return literal_(record[h] === undefined ? "" : record[h]);
      }),
    ]);
    SpreadsheetApp.flush();
    return receipt_(record);
  } catch (e) {
    console.error("Submission failed; request data omitted");
    return {
      ok: false,
      message:
        "We could not confirm your submission. Keep this page open and retry; the same submission will not be added twice.",
    };
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}

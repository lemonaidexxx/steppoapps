var StepOptions =
  typeof module !== "undefined" ? require("./options.js") : StepOptions;
/* Shared field schema and pure validation. Included in browser and Apps Script. */
var StepCore = (function () {
  "use strict";
  var goals = [
    "Find jobs in the Philippines.",
    "Access legal overseas employment opportunities.",
    "Start or grow your own business.",
    "Enhance your skills through continuous learning.",
    "Others (Please specify)",
  ];
  var regions = [
    "National Capital Region",
    "Cordillera Administrative Region",
    "Region I – Ilocos Region",
    "Region II – Cagayan Valley",
    "Region III – Central Luzon",
    "Region IV-A – CALABARZON",
    "Region IV-B – MIMAROPA Region",
    "Region V – Bicol Region",
    "Region VI – Western Visayas",
    "Negros Island Region",
    "Region VII – Central Visayas",
    "Region VIII – Eastern Visayas",
    "Region IX – Zamboanga Peninsula",
    "Region X – Northern Mindanao",
    "Region XI – Davao Region",
    "Region XII – SOCCSKSARGEN",
    "Region XIII – Caraga",
    "Bangsamoro Autonomous Region in Muslim Mindanao",
  ];
  function field(id, label, column, type, required, step, options, condition) {
    return {
      id: id,
      label: label,
      column: column,
      type: type,
      required: required,
      step: step,
      options: options,
      condition: condition,
    };
  }
  var fields = [
    field("firstName", "First name", "First Name", "text", true, 0),
    field("middleName", "Middle name", "Middle Name", "text", false, 0),
    field("lastName", "Last name", "Last Name", "text", true, 0),
    field("birthDate", "Date of birth", "Date of Birth", "date", true, 0),
    field("sex", "Sex", "Sex", "select", true, 0, [
      "Male",
      "Female",
      "Prefer not to say",
    ]),
    field("civilStatus", "Civil status", "Civil Status", "select", false, 0, [
      "Single",
      "Married",
      "Widowed",
      "Legally Separated",
      "Annulled",
      "Divorced, if legally recognized",
    ]),
    field("phone", "Contact number", "Contact Number", "tel", true, 0),
    field("email", "Email address", "Email Address", "email", true, 0),
    field(
      "voucher",
      "TESDA voucher code (if available)",
      "TESDA Voucher Code",
      "text",
      false,
      0,
    ),
    field("category", "Applying as", "Applicant Category", "select", true, 1, [
      "APO Member",
      "Family Member",
    ]),
    field(
      "ofwStatus",
      "Qualifying APO member’s OFW status",
      "Member OFW Status",
      "select",
      true,
      1,
      ["Current OFW", "Former OFW"],
    ),
    field(
      "membershipNumber",
      "Qualifying member’s APO membership number",
      "APO Membership Number",
      "text",
      true,
      1,
    ),
    field(
      "relationship",
      "Your relationship to the OFW",
      "Relationship to OFW",
      "select",
      true,
      1,
      ["Parent", "Child", "Sibling", "Spouse"],
      "family",
    ),
    field(
      "ofwFirstName",
      "OFW relative’s first name",
      "OFW First Name",
      "text",
      true,
      1,
      null,
      "family",
    ),
    field(
      "ofwMiddleName",
      "OFW relative’s middle name",
      "OFW Middle Name",
      "text",
      false,
      1,
      null,
      "family",
    ),
    field(
      "ofwLastName",
      "OFW relative’s last name",
      "OFW Last Name",
      "text",
      true,
      1,
      null,
      "family",
    ),
    field(
      "ofwBirthDate",
      "OFW relative’s date of birth",
      "OFW Date of Birth",
      "date",
      true,
      1,
      null,
      "family",
    ),
    field(
      "country",
      "Member’s latest country of deployment",
      "Country of Deployment",
      "text",
      true,
      1,
    ),
    field(
      "occupation",
      "Member’s latest overseas occupation",
      "Occupation",
      "text",
      true,
      1,
    ),
    field("region", "Philippine region", "Region", "select", true, 2, regions),
    field("province", "Province / Metro Manila", "Province", "text", true, 2),
    field(
      "city",
      "City / municipality",
      "City / Municipality",
      "text",
      true,
      2,
    ),
    field(
      "address",
      "Address line / street / house number",
      "Address Line",
      "text",
      true,
      2,
    ),
    field(
      "otherCourse",
      "Other TESDA course you would like to take in future",
      "Other Course Interest",
      "text",
      false,
      3,
    ),
    field(
      "goal",
      "Primary goal in attending this training",
      "Training Goal",
      "select",
      true,
      3,
      goals,
    ),
    field(
      "otherGoal",
      "Please specify your training goal",
      "Other Training Goal",
      "text",
      true,
      3,
      null,
      "otherGoal",
    ),
  ];
  var systemHeaders = [
    "Registration ID",
    "Submission Token",
    "Submitted At",
    "Updated At",
    "Learner ID",
    "Offering ID",
    "Course ID",
    "Course Name",
    "Training Center",
    "Modality",
    "Hours",
    "City",
    "Consent",
    "Consent Version",
    "Consent Accepted At",
    "Review Status",
    "Possible Duplicate",
    "Duplicate Registration IDs",
    "Source",
    "Payload Hash",
  ];
  // Keep the v1 storage contract, including retired columns, for existing records.
  var legacyHeaders = systemHeaders.concat(
    fields.map(function (f) {
      return f.column;
    }),
  );
  fields = fields.filter(function (f) {
    return f.id !== "voucher";
  });
  fields.forEach(function (f) {
    if (f.id === "sex") f.options = ["Male", "Female"];
    if (f.id === "category") f.options = ["OFW", "OFW family member"];
    if (f.id === "membershipNumber")
      f.label = "APO ID number (numeric part only)";
    f.section =
      f.step === 0
        ? "passport-details"
        : f.step === 2
          ? "address"
          : f.step === 3
            ? "training-goals"
            : "ofw-details";
    if (f.id === "category" || f.id === "ofwStatus")
      f.section = "classification";
    if (f.id === "membershipNumber") f.section = "apo-details";
    if (
      /^(firstName|middleName|lastName|ofwFirstName|ofwMiddleName|ofwLastName)$/.test(
        f.id,
      )
    )
      f.hint = "Enter exactly as shown on your passport.";
  });
  var chapter = field("chapter", "Chapter", "Chapter", "text", true, 0),
    batch = field("batchYear", "Batch (year)", "Batch Year", "text", true, 0);
  chapter.section = batch.section = "apo-details";
  var membership = fields.find(function (f) {
    return f.id === "membershipNumber";
  });
  fields = [chapter, batch, membership].concat(
    fields.filter(function (f) {
      return f !== membership;
    }),
  );
  var extraHeaders = [
    "Chapter",
    "Batch Year",
    "Other Programs Consent",
    "Other Programs Consent Version",
    "Other Programs Consent Recorded At",
    "Retention Cutoff",
    "Retention Review",
    "Email Status",
    "Email Attempts",
    "Email Last Attempt At",
    "Email Sent At",
    "Email Next Attempt At",
    "Email Error",
  ];
  var v2Fields = fields.slice();
  fields = fields.filter(function (f) {
    return f.id !== "ofwStatus";
  });
  fields.forEach(function (f) {
    if (f.section === "passport-details") f.section = "personal-information";
    if (
      ["chapter", "batchYear", "membershipNumber", "category"].indexOf(f.id) >=
      0
    )
      f.section = "checkpoint";
    if (["country", "province", "city"].indexOf(f.id) >= 0) f.type = "select";
    if (f.id === "relationship")
      f.hint =
        "Choose your relationship to the OFW: for example, select Child if you are their child.";
    if (f.id === "province") f.label = "Province / area";
    if (/Name$/.test(f.id)) {
      var part = /First|^first/.test(f.id)
        ? "First Name"
        : /Middle|^middle/.test(f.id)
          ? "Middle Name"
          : "Last Name";
      f.hint =
        "Enter " +
        (f.id.indexOf("ofw") === 0 ? "your OFW relative’s " : "your ") +
        part +
        " exactly as shown on " +
        (f.id.indexOf("ofw") === 0 ? "their" : "your") +
        " passport.";
    }
  });
  extraHeaders = extraHeaders.concat([
    "Selection Keys",
    "Configuration Version",
    "Membership Details Belong To",
  ]);
  function sectionFor(f, d) {
    return ["country", "occupation"].indexOf(f.id) >= 0
      ? d.category === "family"
        ? "ofw-details"
        : "personal-information"
      : f.section;
  }
  function labelFor(f, d) {
    if (f.id === "country")
      return d.category === "family"
        ? "Your OFW relative’s country of deployment"
        : "Your country of deployment";
    if (f.id === "occupation")
      return d.category === "family"
        ? "Your OFW relative’s overseas occupation"
        : "Your overseas occupation";
    return f.label.replace(/^OFW relative’s/, "Your OFW relative’s");
  }
  function legacyClean(input) {
    var d = {};
    v2Fields.forEach(function (f) {
      d[f.id] = typeof input[f.id] === "string" ? input[f.id].trim() : "";
    });
    v2Fields.forEach(function (f) {
      if (
        (f.condition === "family" && d.category !== "OFW family member") ||
        (f.condition === "otherGoal" && d.goal !== goals[4])
      )
        d[f.id] = "";
    });
    d.offeringId = typeof input.offeringId === "string" ? input.offeringId : "";
    d.consent = input.consent === true;
    d.otherProgramsConsent = input.otherProgramsConsent === true;
    d.otherProgramsConsentVersion =
      typeof input.otherProgramsConsentVersion === "string"
        ? input.otherProgramsConsentVersion
        : "";
    d.consentVersion =
      typeof input.consentVersion === "string" ? input.consentVersion : "";
    return d;
  }
  var sections = [
    { id: "checkpoint", label: "APO membership and applicant classification" },
    { id: "personal-information", label: "Personal information" },
    { id: "ofw-details", label: "Your OFW relative’s information" },
    { id: "address", label: "Philippine address" },
    { id: "training-goals", label: "Training goals" },
    { id: "consent", label: "Privacy & consent" },
  ];
  function visible(f, d) {
    return (
      !f.condition ||
      (f.condition === "family" && d.category === "family") ||
      (f.condition === "otherGoal" && d.goal === "goal-other")
    );
  }
  function clean(input) {
    var d = {};
    fields.forEach(function (f) {
      d[f.id] = typeof input[f.id] === "string" ? input[f.id].trim() : "";
    });
    fields.forEach(function (f) {
      if (!visible(f, d)) d[f.id] = "";
    });
    d.offeringId = typeof input.offeringId === "string" ? input.offeringId : "";
    d.consent = input.consent === true;
    d.configurationVersion =
      typeof input.configurationVersion === "string"
        ? input.configurationVersion
        : "";
    d.consentVersion =
      typeof input.consentVersion === "string" ? input.consentVersion : "";
    return d;
  }
  function validate(input, step) {
    var d = clean(input),
      errors = {};
    fields.forEach(function (f) {
      if (
        (step !== undefined &&
          (typeof step === "string"
            ? sectionFor(f, d) !== step
            : f.step !== step)) ||
        !visible(f, d)
      )
        return;
      var v = d[f.id];
      if (f.required && !v)
        errors[f.id] = "Enter " + f.label.toLowerCase() + ".";
      else if (v.length > 300) errors[f.id] = "Use 300 characters or fewer.";
      else if (v && f.type === "select" && !StepOptions.valid(f.id, v, d))
        errors[f.id] = "Select a listed option.";
      else if (f.id === "batchYear" && !/^\d{4}$/.test(v))
        errors[f.id] = "Enter a four-digit batch year.";
      else if (f.id === "membershipNumber" && !/^\d+$/.test(v))
        errors[f.id] =
          "Enter only the numeric part of the APO ID; keep any leading zeros.";
      else if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
        errors[f.id] = "Enter a valid email address.";
      else if (
        v &&
        f.type === "tel" &&
        (!/^[+\d\s().-]+$/.test(v) ||
          v.replace(/\D/g, "").length < 7 ||
          v.replace(/\D/g, "").length > 15)
      )
        errors[f.id] = "Enter 7–15 digits; international prefixes are welcome.";
      else if (v && f.type === "date") {
        var date = new Date(v + "T00:00:00Z");
        if (
          !/^\d{4}-\d{2}-\d{2}$/.test(v) ||
          isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== v ||
          v > new Date().toISOString().slice(0, 10)
        )
          errors[f.id] = "Enter a valid date that is not in the future.";
      }
    });
    if (step === undefined) {
      if (!d.offeringId) errors.offeringId = "Select a course offering.";
      if (!d.consent)
        errors.consent = "Please read and accept the privacy notice.";
    }
    return { data: d, errors: errors };
  }
  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }
  function duplicate(a, b) {
    return (
      normalize(a.email) === normalize(b.email) ||
      a.phone.replace(/\D/g, "") === String(b.phone || "").replace(/\D/g, "") ||
      (normalize(a.firstName + " " + a.lastName) ===
        normalize(b.firstName + " " + b.lastName) &&
        a.birthDate === b.birthDate)
    );
  }
  function filterOfferings(rows, q, modality, city) {
    q = normalize(q);
    return rows.filter(function (r) {
      return (
        r.selectable !== false &&
        (!q || normalize(r.courseName + " " + r.institution).indexOf(q) >= 0) &&
        (!modality || r.modality === modality) &&
        (!city || r.city === city)
      );
    });
  }
  return {
    fields: fields,
    legacyClean: legacyClean,
    sectionFor: sectionFor,
    labelFor: labelFor,
    headers: legacyHeaders.concat(extraHeaders),
    legacyHeaders: legacyHeaders,
    sections: sections,
    visible: visible,
    clean: clean,
    validate: validate,
    duplicate: duplicate,
    filterOfferings: filterOfferings,
  };
})();
if (typeof module !== "undefined") module.exports = StepCore;

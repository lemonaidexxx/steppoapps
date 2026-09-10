/* Run setup_ manually in the editor. Trailing underscores prevent browser RPC access. */
function setup_() {
  var ss = spreadsheet_(),
    defs = {
      Courses: ["Course ID", "Course Name"],
      Offerings: [
        "Offering ID",
        "Course ID",
        "Course Name",
        "Training Center",
        "Modality",
        "Hours",
        "City",
        "Selectable",
      ],
      Applications: StepCore.headers,
      Settings: ["Key", "Value"],
    };
  Object.keys(defs).forEach(function (name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name),
      heads = defs[name];
    if (sheet.getLastRow() > 0) {
      if (name === "Applications") return; // migrateV2_ validates and appends by header name.
      var old = sheet.getRange(1, 1, 1, heads.length).getValues()[0];
      if (JSON.stringify(old) !== JSON.stringify(heads))
        throw new Error(
          "Existing " + name + " schema differs. No data overwritten.",
        );
      return;
    }
    if (sheet.getMaxColumns() < heads.length)
      sheet.insertColumnsAfter(
        sheet.getMaxColumns(),
        heads.length - sheet.getMaxColumns(),
      );
    sheet
      .getRange(1, 1, 1, heads.length)
      .setValues([heads])
      .setBackground("#142e4c")
      .setFontColor("#ffffff")
      .setFontWeight("bold");
    sheet.setFrozenRows(1);
    sheet.setColumnWidths(1, heads.length, 190);
  });
  var seen = {};
  var courses = CATALOG_SEED.filter(function (o) {
    if (seen[o.courseId]) return false;
    seen[o.courseId] = true;
    return true;
  }).map(function (o) {
    return [o.courseId, o.courseName];
  });
  seed_("Courses", courses);
  seed_(
    "Offerings",
    CATALOG_SEED.map(function (o) {
      return [
        o.id,
        o.courseId,
        o.courseName,
        o.institution,
        o.modality,
        o.hours,
        o.city,
        true,
      ];
    }),
  );
  seed_("Settings", [
    ["ProgramName", "SKILLS. TRAINING. EMPOWERMENT. PROGRESS."],
    ["DistrictYear", "2026–2027"],
    ["PrivacyContact", "apocmwd2026.2027@gmail.com"],
    ["RetentionPeriod", "Through December 31, 2026"],
    ["ConsentVersion", "STEP-2026-02"],
    ["OtherProgramsConsentVersion", "APO-OTHER-2026-01"],
    ["EmailEnabled", "false"],
    ["RegistrationEnabled", "false"],
    ["Environment", "production"],
  ]);
  var p = PropertiesService.getScriptProperties();
  if (!p.getProperty("TOKEN_SECRET"))
    p.setProperty("TOKEN_SECRET", Utilities.getUuid() + Utilities.getUuid());
  migrateV3_();
}
function seed_(name, rows) {
  var sheet = spreadsheet_().getSheetByName(name);
  if (sheet.getLastRow() === 1 && rows.length)
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}

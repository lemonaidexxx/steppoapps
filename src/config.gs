/* Only public, non-personal option rows are returned to the browser. */
function configuration_() {
  var form = rows_("FormOptions").map(function (r) {
    return {
      list: String(r["List Name"]),
      key: String(r["Option Key"]),
      label: String(r.Label),
      enabled: r.Enabled === true || r.Enabled === "true",
      order: Number(r["Display Order"]),
    };
  });
  var addresses = rows_("AddressOptions").map(function (r) {
    return {
      key: String(r["Geographic Key"]),
      level: String(r.Level),
      parent: String(r["Parent Key"] || ""),
      label: String(r.Label),
      enabled: r.Enabled === true || r.Enabled === "true",
      order: Number(r["Display Order"]),
      sourceCode: String(r["Source Code"] || ""),
    };
  });
  // Canonical ordering makes sheet row reordering harmless to the version.
  form.sort(function (a, b) {
    return a.key.localeCompare(b.key);
  });
  addresses.sort(function (a, b) {
    return a.key.localeCompare(b.key);
  });
  var config = { form: form, addresses: addresses };
  StepOptions.normalize(config);
  config.version = hash_(config);
  StepOptions.configure(config);
  return config;
}
function migrateV3_() {
  migrateV2_();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = spreadsheet_();
    [
      [
        "FormOptions",
        ["List Name", "Option Key", "Label", "Enabled", "Display Order"],
        OPTION_SEED.form.map(function (o) {
          return [o.list, o.key, o.label, o.enabled, o.order];
        }),
      ],
      [
        "AddressOptions",
        [
          "Geographic Key",
          "Level",
          "Parent Key",
          "Label",
          "Enabled",
          "Display Order",
          "Source Code",
        ],
        OPTION_SEED.addresses.map(function (o) {
          return [
            o.key,
            o.level,
            o.parent,
            o.label,
            o.enabled,
            o.order,
            o.sourceCode,
          ];
        }),
      ],
    ].forEach(function (spec) {
      var sheet = ss.getSheetByName(spec[0]);
      if (!sheet) sheet = ss.insertSheet(spec[0]);
      if (sheet.getLastRow() === 0) {
        if (sheet.getMaxRows() < spec[2].length + 1)
          sheet.insertRowsAfter(
            sheet.getMaxRows(),
            spec[2].length + 1 - sheet.getMaxRows(),
          );
        sheet
          .getRange(1, 1, 1, spec[1].length)
          .setValues([spec[1]])
          .setBackground("#142e4c")
          .setFontColor("#ffffff")
          .setFontWeight("bold");
        sheet.getRange(2, 1, spec[2].length, spec[1].length).setValues(spec[2]);
        sheet.setFrozenRows(1);
        sheet.setColumnWidths(1, spec[1].length, 190);
      }
      var heads = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      if (
        new Set(heads).size !== heads.length ||
        spec[1].some(function (h) {
          return heads.indexOf(h) < 0;
        })
      )
        throw Error("Invalid option headers");
    });
    configuration_();
    var sheet = ss.getSheetByName("Settings"),
      rows = sheet.getDataRange().getValues();
    var values = {
      ConsentVersion: "STEP-2026-03",
      AddressSourceRelease: OPTION_SEED.source.release,
      AddressSourceURL: OPTION_SEED.source.url,
      AddressSourceMirror: OPTION_SEED.source.mirror,
    };
    Object.keys(values).forEach(function (key) {
      var i = rows.findIndex(function (r) {
        return r[0] === key;
      });
      if (i < 0) sheet.appendRow([key, values[key]]);
      else if (key === "ConsentVersion")
        sheet.getRange(i + 1, 2).setValue(values[key]);
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

function publicConfiguration_(config) {
  var enabled = Object.create(null);
  config.addresses.forEach(function (o) {
    if (o.enabled) enabled[o.key] = o;
  });
  return {
    version: config.version,
    form: config.form.filter(function (o) {
      return o.enabled;
    }),
    addresses: config.addresses.filter(function (o) {
      return (
        o.enabled &&
        (!o.parent ||
          (enabled[o.parent] &&
            (!enabled[o.parent].parent || enabled[enabled[o.parent].parent])))
      );
    }),
  };
}

function migrateV4_() {
  migrateV3_();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = spreadsheet_().getSheetByName("Settings"),
      rows = sheet.getDataRange().getValues();
    var values = {
      DevelopmentalYear: "2026 - 2027",
      WhatsAppNumber: "639927110929",
      WhatsAppEnabled: "true",
      ConsentVersion: "STEP-2026-04",
    };
    Object.keys(values).forEach(function (key) {
      var i = rows.findIndex(function (r) {
        return r[0] === key;
      });
      if (i < 0) sheet.appendRow([key, values[key]]);
      else if (key === "ConsentVersion")
        sheet.getRange(i + 1, 2).setValue(values[key]);
    });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
}

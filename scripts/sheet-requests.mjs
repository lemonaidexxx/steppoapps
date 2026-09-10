// Generate an atomic initialization batch for the dedicated tabs. Inspect live metadata first.
import fs from "node:fs";
import Core from "../src/core.js";
const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const unique = [
  ...new Map(
    catalog.map((o) => [o.courseId, [o.courseId, o.courseName]]),
  ).values(),
];
const tables = [
  {
    id: 260601,
    name: "Courses",
    rows: [["Course ID", "Course Name"], ...unique],
  },
  {
    id: 260602,
    name: "Offerings",
    rows: [
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
  },
  { id: 260603, name: "Applications", rows: [Core.headers] },
  {
    id: 260604,
    name: "Settings",
    rows: [
      ["Key", "Value"],
      ["ProgramName", "SKILLS. TRAINING. EMPOWERMENT. PROGRESS."],
      ["DistrictYear", "2026–2027"],
      ["PrivacyContact", "[APO PRIVACY CONTACT EMAIL]"],
      ["RetentionPeriod", "[APPLICATION RETENTION PERIOD]"],
      ["ConsentVersion", "STEP-2026-01"],
      ["RegistrationEnabled", "false"],
      ["Environment", "production"],
    ],
  },
];
const requests = [];
for (const t of tables) {
  const columns = t.rows[0].length,
    range = {
      sheetId: t.id,
      startRowIndex: 0,
      endRowIndex: t.rows.length,
      startColumnIndex: 0,
      endColumnIndex: columns,
    };
  requests.push({
    addSheet: {
      properties: {
        sheetId: t.id,
        title: t.name,
        gridProperties: {
          rowCount: 1000,
          columnCount: Math.max(26, columns),
          frozenRowCount: 1,
        },
      },
    },
  });
  requests.push({
    updateCells: {
      range,
      rows: t.rows.map((r) => ({
        values: r.map((v) => ({
          userEnteredValue:
            typeof v === "number"
              ? { numberValue: v }
              : typeof v === "boolean"
                ? { boolValue: v }
                : { stringValue: String(v) },
        })),
      })),
      fields: "userEnteredValue",
    },
  });
  requests.push({
    repeatCell: {
      range: { ...range, endRowIndex: 1 },
      cell: {
        userEnteredFormat: {
          backgroundColor: { red: 0.078, green: 0.18, blue: 0.298 },
          textFormat: {
            foregroundColor: { red: 1, green: 1, blue: 1 },
            bold: true,
          },
          wrapStrategy: "WRAP",
        },
      },
      fields: "userEnteredFormat",
    },
  });
  requests.push({
    updateDimensionProperties: {
      range: {
        sheetId: t.id,
        dimension: "COLUMNS",
        startIndex: 0,
        endIndex: columns,
      },
      properties: { pixelSize: 190 },
      fields: "pixelSize",
    },
  });
  if (t.rows.length > 1)
    requests.push({
      repeatCell: {
        range: { ...range, startRowIndex: 1 },
        cell: {
          userEnteredFormat: { wrapStrategy: "WRAP", verticalAlignment: "TOP" },
        },
        fields: "userEnteredFormat",
      },
    });
  if (t.name === "Offerings")
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: t.id,
          dimension: "COLUMNS",
          startIndex: 2,
          endIndex: 4,
        },
        properties: { pixelSize: 360 },
        fields: "pixelSize",
      },
    });
  if (t.name === "Settings")
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: t.id,
          dimension: "COLUMNS",
          startIndex: 1,
          endIndex: 2,
        },
        properties: { pixelSize: 560 },
        fields: "pixelSize",
      },
    });
  if (t.name === "Courses")
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: t.id,
          dimension: "COLUMNS",
          startIndex: 1,
          endIndex: 2,
        },
        properties: { pixelSize: 440 },
        fields: "pixelSize",
      },
    });
}
fs.mkdirSync("test-results", { recursive: true });
fs.writeFileSync("test-results/sheet-requests.json", JSON.stringify(requests));
console.log(
  "Prepared dedicated-tab initialization. No remote write performed.",
);

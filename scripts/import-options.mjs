// Rebuild seed JSON only. Never overwrites staff-edited Google Sheets.
import fs from "node:fs";
import crypto from "node:crypto";
import Core from "../src/core.js";
const sourcePath = process.argv[2] || "data/psgc-source.json";
const geographic = JSON.parse(fs.readFileSync(sourcePath, "utf8"));
const expected = { Reg: 18, Prov: 82, City: 149, Mun: 1493 };
for (const [level, count] of Object.entries(expected))
  if (geographic.filter((r) => r.geographic_level === level).length !== count)
    throw Error("Unexpected PSA Q2 2026 count: " + level);
const regionLabels = Core.fields.find((f) => f.id === "region").options;
const regionCodes = [
  "13",
  "14",
  "01",
  "02",
  "03",
  "04",
  "17",
  "05",
  "06",
  "18",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "16",
  "19",
];
const addresses = [];
function address(key, level, parent, label, order, sourceCode = "") {
  addresses.push({
    key,
    level,
    parent,
    label,
    enabled: true,
    order,
    sourceCode,
  });
}
regionCodes.forEach((code, i) =>
  address("r" + code, "region", "", regionLabels[i], i, code + "00000000"),
);
const provinces = geographic.filter((r) => r.geographic_level === "Prov");
provinces.forEach((r, i) =>
  address(
    "p" + r.psgc_code,
    "province",
    "r" + r.psgc_code.slice(0, 2),
    r.area_name,
    i,
    r.psgc_code,
  ),
);
address("p-ncr", "province", "r13", "Metro Manila", 0);
for (const r of geographic.filter((r) =>
  ["City", "Mun"].includes(r.geographic_level),
)) {
  const region = r.psgc_code.slice(0, 2);
  let parent = region === "13" ? "p-ncr" : null;
  if (!parent) {
    const province =
      provinces.find(
        (p) => p.psgc_code.slice(0, 5) === r.psgc_code.slice(0, 5),
      ) ||
      provinces.find(
        (p) =>
          p.correspondence_code?.slice(0, 4) ===
            r.correspondence_code?.slice(0, 4) &&
          p.psgc_code.slice(0, 2) === region,
      );
    if (province) parent = "p" + province.psgc_code;
    else {
      parent = "p-special-" + region;
      if (!addresses.some((a) => a.key === parent))
        address(
          parent,
          "province",
          "r" + region,
          "Independent cities / special area",
          999,
        );
    }
  }
  address("c" + r.psgc_code, "city", parent, r.area_name, 0, r.psgc_code);
}
// Alphabetical order within a parent, retaining the approved region order.
for (const level of ["province", "city"]) {
  const parents = new Set(
    addresses.filter((a) => a.level === level).map((a) => a.parent),
  );
  for (const parent of parents)
    addresses
      .filter((a) => a.level === level && a.parent === parent)
      .sort((a, b) => a.label.localeCompare(b.label, "en"))
      .forEach((a, i) => (a.order = i));
}
const form = [];
function list(name, items) {
  items.forEach(([key, label], order) =>
    form.push({ list: name, key, label, enabled: true, order }),
  );
}
list("category", [
  ["member", "OFW or Former OFW"],
  ["family", "Family member of an OFW or Former OFW"],
]);
list("sex", [
  ["male", "Male"],
  ["female", "Female"],
]);
list(
  "relationship",
  ["Parent", "Child", "Sibling", "Spouse"].map((s) => [s.toLowerCase(), s]),
);
list(
  "civilStatus",
  Core.fields
    .find((f) => f.id === "civilStatus")
    .options.map((s, i) => ["civil-" + i, s]),
);
list(
  "goal",
  Core.fields
    .find((f) => f.id === "goal")
    .options.map((s, i) => [i === 4 ? "goal-other" : "goal-" + i, s]),
);
const countries = fs
  .readFileSync("data/countries.txt", "utf8")
  .trim()
  .split(/\r?\n/);
if (countries.length !== 250 || new Set(countries).size !== 250)
  throw Error("Country list must contain supplied 250 entries");
list(
  "country",
  countries.map((s, i) => [
    i === 0
      ? "country-seabased"
      : "country-" +
        crypto.createHash("sha256").update(s).digest("hex").slice(0, 12),
    s,
  ]),
);
const result = {
  form,
  addresses,
  source: {
    release: "PSA PSGC Q2 2026 (30 June 2026)",
    url: "https://psa.gov.ph/classification/psgc",
    mirror:
      "https://github.com/yng-me/psgc/tree/83f506a7f5c89b7fd2f84fbebb9a0bfd275f0bc0",
    sourceSHA256: crypto
      .createHash("sha256")
      .update(fs.readFileSync(sourcePath))
      .digest("hex"),
  },
};
result.version = crypto
  .createHash("sha256")
  .update(JSON.stringify({ form, addresses }))
  .digest("hex");
fs.writeFileSync("data/options.json", JSON.stringify(result, null, 2) + "\n");
console.log(
  JSON.stringify({
    form: form.length,
    addresses: addresses.length,
    regions: 18,
    citiesMunicipalities: 1642,
    countries: countries.length,
  }),
);

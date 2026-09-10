import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const catalog = JSON.parse(read("data/catalog.json"));
if (catalog.length !== 139 || new Set(catalog.map((o) => o.id)).size !== 139)
  throw Error("Catalog integrity failed");
let html = read("src/index.html")
  .replace("/* APP_CSS */", () => read("src/styles.css"))
  .replace("/* CORE_JS */", () => read("src/core.js"))
  .replace("/* APP_JS */", () => read("src/app.js"));
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/Index.html"), html);
fs.writeFileSync(path.join(root, "dist/Core.gs"), read("src/core.js"));
fs.writeFileSync(path.join(root, "dist/Server.gs"), read("src/server.gs"));
fs.writeFileSync(path.join(root, "dist/Setup.gs"), read("src/setup.gs"));
fs.writeFileSync(
  path.join(root, "dist/Catalog.gs"),
  "var CATALOG_SEED = " + JSON.stringify(catalog) + ";\n",
);
fs.copyFileSync(
  path.join(root, "appsscript.json"),
  path.join(root, "dist/appsscript.json"),
);
console.log("Built Apps Script project in dist/.");

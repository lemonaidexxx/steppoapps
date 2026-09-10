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
  .replace("/* OPTIONS_JS */", () => read("src/options.js"))
  .replace("/* CORE_JS */", () => read("src/core.js"))
  .replace("/* APP_JS */", () => read("src/app.js"));
html = html
  .replace("/* REGISTRATION_JS */", () => read("src/registration.js"))
  .replaceAll(
    "APO_LOGO_DATA",
    "data:image/png;base64," +
      fs
        .readFileSync(path.join(root, "assets/apo-logo.png"))
        .toString("base64"),
  );
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.writeFileSync(path.join(root, "dist/Index.html"), html);
fs.writeFileSync(path.join(root, "dist/Core.gs"), read("src/core.js"));
fs.writeFileSync(path.join(root, "dist/Server.gs"), read("src/server.gs"));
fs.writeFileSync(path.join(root, "dist/Setup.gs"), read("src/setup.gs"));
fs.writeFileSync(path.join(root, "dist/Mail.gs"), read("src/mail.gs"));
fs.writeFileSync(path.join(root, "dist/Migrate.gs"), read("src/migrate.gs"));
fs.writeFileSync(
  path.join(root, "dist/Catalog.gs"),
  "var CATALOG_SEED = " + JSON.stringify(catalog) + ";\n",
);
fs.copyFileSync(
  path.join(root, "appsscript.json"),
  path.join(root, "dist/appsscript.json"),
);
console.log("Built Apps Script project in dist/.");

fs.writeFileSync(path.join(root, "dist/Options.gs"), read("src/options.js"));
fs.writeFileSync(path.join(root, "dist/Config.gs"), read("src/config.gs"));
fs.writeFileSync(
  path.join(root, "dist/OptionSeed.gs"),
  "var OPTION_SEED = " + read("data/options.json") + ";\n",
);

const bridgeHtml =
  '<!doctype html><html><head><meta charset="UTF-8"></head><body><script>window.STEP_BRIDGE_CONFIG = <?!= connectionConfig ?>;</script><script>' +
  read("src/bridge-client.js") +
  "</script></body></html>";
fs.writeFileSync(path.join(root, "dist/Bridge.html"), bridgeHtml);
fs.writeFileSync(
  path.join(root, "dist/BridgeServer.gs"),
  read("src/bridge.gs"),
);
// Manual deployment alternative: one server file prevents partial module uploads.
const single = path.join(root, "dist", "single-file");
fs.mkdirSync(single, { recursive: true });
const serverFiles = [
  "Options.gs",
  "Core.gs",
  "Catalog.gs",
  "OptionSeed.gs",
  "Server.gs",
  "Mail.gs",
  "Migrate.gs",
  "Config.gs",
  "BridgeServer.gs",
  "Setup.gs",
];
fs.writeFileSync(
  path.join(single, "Code.gs"),
  "/* Complete APO STEP server. Do not combine with the separate .gs files. */\n" +
    serverFiles
      .map((name) => "\n/* ---- " + name + " ---- */\n" + read("dist/" + name))
      .join("\n"),
);
fs.copyFileSync(
  path.join(root, "dist", "Index.html"),
  path.join(single, "Index.html"),
);
fs.copyFileSync(
  path.join(root, "appsscript.json"),
  path.join(single, "appsscript.json"),
);
console.log(
  "Manual deployment bundle: dist/single-file (Code.gs, Index.html, appsscript.json).",
);

fs.copyFileSync(
  path.join(root, "dist/Bridge.html"),
  path.join(single, "Bridge.html"),
);
const siteConfig = JSON.parse(read("site-config.json"));
if (
  siteConfig.appsScriptUrl &&
  !/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(
    siteConfig.appsScriptUrl,
  )
)
  throw Error("Invalid Apps Script deployment URL");
if (!/^https:\/\/[a-z0-9.-]+$/.test(siteConfig.siteOrigin))
  throw Error("Invalid public site origin");
const pages = path.join(root, "dist/pages");
fs.mkdirSync(pages, { recursive: true });
const scriptConfig = JSON.stringify(siteConfig).replace(/</g, "\\u003c");
fs.writeFileSync(
  path.join(pages, "index.html"),
  html.replace(
    "<script>",
    "<script>window.STEP_SITE_CONFIG=" +
      scriptConfig +
      ";</script><script>" +
      read("src/pages-transport.js") +
      "</script><script>",
  ),
);
fs.writeFileSync(path.join(pages, ".nojekyll"), "");
console.log(
  "GitHub Pages frontend: dist/pages; Apps Script bridge: Bridge.html.",
);

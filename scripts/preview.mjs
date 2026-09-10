import http from "node:http";
import fs from "node:fs";
import "./build.mjs";
const catalog = JSON.parse(fs.readFileSync("data/catalog.json", "utf8"));
const options = JSON.parse(fs.readFileSync("data/options.json", "utf8"));
const demo = `window.STEP_PREVIEW=async function(name,arg){if(name==='getPublicData')return {ok:true,configuration:${JSON.stringify(options)},offerings:${JSON.stringify(catalog)},settings:{districtYear:'2026–2027',privacyContact:'apocmwd2026.2027@gmail.com',retentionPeriod:'Through December 31, 2026',consentVersion:'STEP-2026-03',registrationEnabled:false}};if(name==='issueSubmissionToken')return {ok:true,token:'local-demo'};if(name==='submitApplication'){var v=StepCore.validate(arg.data);return Object.keys(v.errors).length?{ok:false,errors:v.errors}:{ok:true,registrationId:'DEMO-'+crypto.randomUUID(),submittedAt:new Date().toISOString()};}};`;
const page = fs
  .readFileSync("dist/Index.html", "utf8")
  .replace("<script>", "<script>" + demo + "</script><script>");
http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(page);
  })
  .listen(4173, "127.0.0.1", () =>
    console.log("Synthetic-data preview: http://127.0.0.1:4173"),
  );

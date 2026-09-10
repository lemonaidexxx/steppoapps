const {test}=require("node:test"),assert=require("node:assert/strict"),{execFileSync}=require("node:child_process");
const {server}=require("./mock-gas.cjs");
execFileSync(process.execPath,["scripts/build.mjs"],{stdio:"pipe"});
test("single-file deployment initializes a blank sheet and installs workers without missing modules",()=>{
 const s=server({bundle:"dist/single-file/Code.gs"});
 for(const name of Object.keys(s.sheets))delete s.sheets[name];
 s.ctx.setup_();s.ctx.installWorkers_();
 assert.equal(s.sheets.Courses.length,54);assert.equal(s.sheets.Offerings.length,140);assert.equal(s.sheets.FormOptions.length,270);assert.equal(s.sheets.AddressOptions.length,1745);
 assert.equal(s.sheets.Applications[0].length,62);assert.equal(s.ctx.getPublicData().settings.consentVersion,"STEP-2026-04");assert.equal(s.ctx.getPublicData().settings.registrationEnabled,false);assert.equal(s.triggers.length,2);
 const snapshot=JSON.stringify(s.sheets);s.ctx.setup_();s.ctx.installWorkers_();assert.equal(JSON.stringify(s.sheets),snapshot);assert.equal(s.triggers.length,2);
 s.sheets.Settings.find(r=>r[0]==="RegistrationEnabled")[1]="true";
 assert.ok(s.ctx.submitApplication(s.request()).ok);assert.equal(s.record()["Membership Details Belong To"],"Applicant");
});

const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  vm = require("node:vm"),
  fs = require("node:fs");
const frontend = fs.readFileSync("src/pages-transport.js", "utf8"),
  bridge = fs.readFileSync("src/bridge-client.js", "utf8");
const origin = "https://lemonaidexxx.github.io",
  googleOrigin = "https://example-script.googleusercontent.com";
function transport() {
  const listeners = [],
    timers = new Map(),
    frames = [],
    out = [];
  let serial = 0;
  const remote = { postMessage: (m, target) => out.push({ m, target }) };
  const w = {
    STEP_SITE_CONFIG: {
      siteOrigin: origin,
      appsScriptUrl: "https://script.google.com/macros/s/Test123/exec",
    },
    addEventListener: (n, f) => listeners.push(f),
    removeEventListener: (n, f) => {
      const i = listeners.indexOf(f);
      if (i >= 0) listeners.splice(i, 1);
    },
  };
  const ctx = vm.createContext({
    window: w,
    location: { origin },
    crypto: {
      randomUUID: () =>
        `00000000-0000-4000-8000-${String(++serial).padStart(12, "0")}`,
    },
    Map,
    URL,
    Error,
    document: {
      createElement: () => ({ remove() {} }),
      body: { appendChild: (f) => frames.push(f) },
    },
    setTimeout: (f) => {
      let k = ++serial;
      timers.set(k, f);
      return k;
    },
    clearTimeout: (k) => timers.delete(k),
  });
  vm.runInContext(frontend, ctx);
  const emit = (data, from = googleOrigin, source = remote) =>
    listeners.slice().forEach((f) => f({ data, origin: from, source }));
  return { w, frames, out, remote, emit, timers };
}
test("Pages transport pins channel, Google origin and source; correlates replies", async () => {
  const t = transport(),
    p = t.w.STEP_REMOTE("getPublicData");
  const channel = new URL(t.frames[0].src).searchParams.get("channel");
  t.emit({ type: "STEP_READY", protocol: 1, channel }, "https://evil.example");
  await Promise.resolve();
  assert.equal(t.out.length, 0);
  t.emit({ type: "STEP_READY", protocol: 1, channel });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(t.out.length, 1);
  const request = t.out[0];
  assert.equal(request.target, googleOrigin);
  t.emit(
    { type: "STEP_RESULT", channel, id: request.m.id, result: { ok: false } },
    googleOrigin,
    {},
  );
  t.emit({
    type: "STEP_RESULT",
    channel: "wrong",
    id: request.m.id,
    result: { ok: false },
  });
  t.emit({
    type: "STEP_RESULT",
    channel,
    id: request.m.id,
    result: { ok: true },
  });
  assert.equal((await p).ok, true);
  await assert.rejects(t.w.STEP_REMOTE("setup_"));
});
test("Pages request timeout rejects without sending a second application", async () => {
  const t = transport(),
    p = t.w.STEP_REMOTE("submitApplication", { token: "same-token", data: {} });
  const channel = new URL(t.frames[0].src).searchParams.get("channel");
  t.emit({ type: "STEP_READY", protocol: 1, channel });
  await Promise.resolve();
  await Promise.resolve();
  for (const f of t.timers.values()) f();
  await assert.rejects(p, /could not be confirmed/);
  assert.equal(t.out.length, 1);
  assert.equal(t.out[0].m.argument.token, "same-token");
});
test("bridge denies foreign parents, private helpers, bad channels and oversized input", () => {
  const posted = [],
    calls = [];
  let listener, success, failure;
  const top = { postMessage: (m, target) => posted.push({ m, target }) };
  const run = {
    withSuccessHandler(f) {
      success = f;
      return this;
    },
    withFailureHandler(f) {
      failure = f;
      return this;
    },
    getPublicData(arg) {
      calls.push(arg);
      success({ ok: true });
    },
    submitApplication(arg) {
      calls.push(arg);
      failure(Error("private internal detail"));
    },
  };
  const w = {
    top,
    STEP_BRIDGE_CONFIG: { origin, channel: "channel" },
    addEventListener: (n, f) => (listener = f),
  };
  vm.runInNewContext(bridge, { window: w, google: { script: { run } } });
  assert.equal(posted[0].m.type, "STEP_READY");
  assert.equal(posted[0].target, origin);
  const message = {
    type: "STEP_CALL",
    channel: "channel",
    id: "1",
    method: "getPublicData",
  };
  for (const patch of [
    { origin: "https://evil.example" },
    { source: {} },
    { data: { ...message, method: "migrateV4_" } },
    { data: { ...message, channel: "wrong" } },
    { data: { ...message, argument: "a".repeat(21000) } },
  ])
    listener({ origin, source: top, data: message, ...patch });
  assert.equal(calls.length, 0);
  listener({ origin, source: top, data: message });
  assert.equal(calls.length, 1);
  assert.equal(posted[1].m.result.ok, true);
  listener({
    origin,
    source: top,
    data: { ...message, method: "submitApplication" },
  });
  assert.equal(posted[2].m.error, true);
  assert.ok(!JSON.stringify(posted).includes("private internal"));
});
test("bridge server only embeds approved origins and valid channels", () => {
  let loaded = 0;
  const output = {
    setTitle() {
      return this;
    },
    setXFrameOptionsMode() {
      this.embedded = true;
      return this;
    },
  };
  const ctx = vm.createContext({
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => null }),
    },
    HtmlService: {
      createHtmlOutput: () => ({ denied: true }),
      createTemplateFromFile() {
        loaded++;
        return { evaluate: () => output };
      },
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
    },
  });
  vm.runInContext(fs.readFileSync("src/bridge.gs", "utf8"), ctx);
  assert.equal(
    ctx.bridgeOutput_({ origin: "https://evil.example", channel: "x" }).denied,
    true,
  );
  assert.equal(loaded, 0);
  assert.equal(
    ctx.bridgeOutput_({
      origin,
      channel: "00000000-0000-4000-8000-000000000000",
    }).embedded,
    true,
  );
});

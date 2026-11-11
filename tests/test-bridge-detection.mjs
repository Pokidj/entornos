import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function setup({ oldTimeout = false, localOption = true } = {}) {
  const dom = new JSDOM(fs.readFileSync(root + "/index.html", "utf8"), {
    url: "https://detection.test/",
    runScripts: "outside-only",
  });
  const w = dom.window,
    d = w.document,
    timeouts = [],
    healthOptions = [];
  let mode = "offline",
    executions = 0, pairs = 0, authorized = false;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.confirm = () => true;
  w.Request = localOption
    ? class {
        constructor(url, options) {
          this.targetAddressSpace = options.targetAddressSpace;
        }
      }
    : class {};
  w.AbortSignal.timeout = oldTimeout
    ? undefined
    : (ms) => {
        timeouts.push(ms);
        return new w.AbortController().signal;
      };
  w.fetch = async (url, options = {}) => {
    if (url.endsWith('/discover') && ['pair', 'deny-pair'].includes(mode))
      return {ok:true,json:async()=>({bridge:'entorno-fivem',version:3,authorized})};
    if (url.endsWith('/pair')) {
      pairs++;
      assert.equal(options.method,'POST');
      assert.equal(options.body,'{}');
      assert.equal(options.headers['X-Entorno-Token'],undefined);
      if(mode==='deny-pair') return {ok:false,status:403,json:async()=>({error:'Autorización rechazada.'})};
      authorized=true;
      return {ok:true,json:async()=>({ok:true})};
    }
    if (String(url).split("?")[0] === "vehicles.json")
      return {
        ok: true,
        json: async () =>
          JSON.parse(fs.readFileSync(root + "/vehicles.json", "utf8")),
      };
    if (url.endsWith("/health")) {
      healthOptions.push(options);
      if (mode === "offline") throw new TypeError("Failed to fetch");
      if (mode === "timeout")
        throw Object.assign(new Error("timeout"), { name: "AbortError" });
      if (mode === "forbidden") return { ok: false, status: 403 };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          bridge: mode === "invalid" ? "other-service" : "entorno-fivem",
          version: ['pair','deny-pair'].includes(mode) ? 3 : 2,
          connected: true,
          token: "test-token",
          capabilities: ["prepare"],
          preparation: { ready: false, sent: false },
          hotkey: { configured: "CTRL+F9", active: true },
        }),
      };
    }
    if (url.endsWith("/prepare"))
      return {
        ok: true,
        json: async () => ({ ok: true, ready: false, sent: false }),
      };
    if (url.endsWith("/execute")) {
      executions++;
      throw Object.assign(new Error('aborted'), {name:'AbortError'});
    }
    throw new Error("unexpected request");
  };
  for (const script of d.querySelectorAll("script[src]"))
    vm.runInContext(
      fs.readFileSync(
        root + "/" + script.getAttribute("src").split("?")[0],
        "utf8",
      ),
      dom.getInternalVMContext(),
    );
  await tick();
  await tick();
  return {
    dom,
    w,
    d,
    timeouts,
    healthOptions,
    setMode: (value) => (mode = value),
    executions: () => executions,
    pairs: () => pairs,
  };
}
const a = await setup();
const message = () =>
  a.d.getElementById("bridge-connection-message").textContent;
assert.match(message(), /permite.*red local/);
assert.equal(a.d.getElementById("connect-bridge").disabled, false);
assert(a.d.getElementById("execute-fivem").hidden);
assert.equal(a.healthOptions[0].targetAddressSpace, "loopback");
a.setMode("forbidden");
await a.d.getElementById("connect-bridge").onclick();
assert.match(message(), /rechazó.*dirección/);
assert(a.timeouts.includes(20000), "manual connection allows permission time");
a.setMode("invalid");
await a.w.checkBridge();
assert.match(message(), /versión compatible/);
a.setMode("timeout");
await a.w.checkBridge();
assert.match(message(), /no respondió a tiempo/);
a.setMode("ok");
await a.d.getElementById("connect-bridge").onclick();
assert(
  a.d.querySelector(".bridge-download").hidden,
  "detected bridge hides setup block",
);
assert.equal(a.d.getElementById("execute-fivem").hidden, false);
assert.equal(
  a.executions(),
  0,
  "connection button never executes a game command",
);
a.setMode("offline");
await a.w.checkBridge();
const violation = new a.w.Event("securitypolicyviolation");
Object.defineProperty(violation, "blockedURI", {
  value: "http://127.0.0.1:39173/health",
});
a.d.dispatchEvent(violation);
assert.match(message(), /política.*bloquea/);
a.dom.window.close();
const b = await setup({ oldTimeout: true, localOption: false });
b.setMode("ok");
await b.d.getElementById("connect-bridge").onclick();
assert(
  b.healthOptions.at(-1).signal instanceof b.w.AbortSignal,
  "timeout fallback supplies a signal",
);
assert(
  !("targetAddressSpace" in b.healthOptions.at(-1)),
  "unsupported option is omitted",
);
assert(
  b.d.querySelector(".bridge-download").hidden,
  "detection works without AbortSignal.timeout",
);
assert.equal(b.executions(), 0);
b.d.getElementById('output').textContent='/entorno Prueba de tiempo agotado';
await b.w.syncPreparedDraft();
await b.d.getElementById('execute-fivem').onclick();
assert.match(b.d.getElementById('bridge-status').textContent,/No se pudo confirmar.*Comprueba el juego/);
assert.equal(b.executions(),1,'only explicit mocked execute attempts a send');
b.dom.window.close();
const pair = await setup();
pair.setMode('pair');
await pair.w.checkBridge();
assert.equal(pair.pairs(),0,'background discovery never opens a native approval');
assert.match(pair.d.getElementById('bridge-connection-message').textContent,/Puente detectado.*autoriza/);
assert(pair.d.getElementById('execute-fivem').hidden,'no session before approval');
await pair.d.getElementById('connect-bridge').onclick();
assert.equal(pair.pairs(),1,'manual connection requests approval');
assert(!pair.d.getElementById('execute-fivem').hidden,'v3 available after native approval');
await pair.w.checkBridge();
assert.equal(pair.pairs(),1,'approved domain does not request again');
assert.equal(pair.executions(),0,'pairing never sends an environment');
pair.dom.window.close();
const denied = await setup();
denied.setMode('deny-pair');
await denied.d.getElementById('connect-bridge').onclick();
assert.match(denied.d.getElementById('bridge-connection-message').textContent,/rechazada/);
assert(denied.d.getElementById('execute-fivem').hidden);
assert.equal(denied.executions(),0);
denied.dom.window.close();
console.log(
  "PASS: manual connection, timeout fallback, loopback compatibility, blocked requests, HTTP 403, unexpected service and reconnect; no game commands sent.",
);

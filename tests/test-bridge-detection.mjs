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
    executions = 0;
  w.HTMLElement.prototype.scrollIntoView = function () {};
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
    if (url === "vehicles.json")
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
          version: 2,
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
    if (url.endsWith("/execute")) executions++;
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
b.dom.window.close();
console.log(
  "PASS: manual connection, timeout fallback, loopback compatibility, blocked requests, HTTP 403, unexpected service and reconnect; no game commands sent.",
);

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const html = fs.readFileSync(root + "/index.html", "utf8");
const tick = () => new Promise((r) => setTimeout(r, 0));
async function create(version) {
  const dom = new JSDOM(html, {
      url: "https://hotkey.test/",
      runScripts: "outside-only",
    }),
    w = dom.window,
    d = w.document;
  let text = "",
    sent = false,
    preparations = 0,
    executions = 0;
  let holdResolve = null;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.AbortSignal.timeout = () => undefined;
  w.confirm = () => true;
  Object.defineProperty(w.navigator, "clipboard", {
    value: { writeText: async () => {} },
  });
  w.fetch = async (url, options) => {
    if (url === "vehicles.json")
      return {
        ok: true,
        json: async () =>
          JSON.parse(fs.readFileSync(root + "/vehicles.json", "utf8")),
      };
    if (url.endsWith("/health"))
      return {
        ok: true,
        json: async () => ({
          bridge: "entorno-fivem",
          version,
          token: "test-token",
          connected: true,
          capabilities: version === 2 ? ["prepare", "hotkey"] : [],
          preparation: { ready: !!text && !sent, sent },
          hotkey: { configured: "CTRL+F9", active: true, error: "" },
        }),
      };
    const value = JSON.parse(options.body).text;
    if (url.endsWith("/prepare")) {
      preparations++;
      if (value !== text) {
        text = value;
        sent = false;
      }
      if (holdResolve) await new Promise((r) => (holdResolve = r));
      return {
        ok: true,
        json: async () => ({ ok: true, ready: !!text && !sent, sent }),
      };
    }
    if (url.endsWith("/execute")) {
      executions++;
      sent = true;
      text = value;
      return { ok: true, json: async () => ({ ok: true, sent: true }) };
    }
    throw Error(url);
  };
  for (const script of d.querySelectorAll("script[src]"))
    vm.runInContext(
      fs.readFileSync(root + "/" + script.getAttribute("src"), "utf8"),
      dom.getInternalVMContext(),
    );
  await tick();
  await tick();
  return {
    w,
    d,
    dom,
    state: () => ({ text, sent, preparations, executions }),
    setDraft: async (value) => {
      d.getElementById("output").textContent = value;
      await tick();
      await w.syncPreparedDraft();
      await tick();
    },
  };
}
const a = await create(2);
await a.setDraft("/entorno Primer entorno");
assert.equal(a.state().text, "/entorno Primer entorno");
assert.match(
  a.d.getElementById("bridge-status").textContent,
  /CTRL\+F9.*preparado/,
);
assert.equal(a.state().executions, 0);
const count = a.state().preparations;
await a.w.syncPreparedDraft();
assert.equal(a.state().preparations, count);
await a.d.getElementById("execute-fivem").onclick();
assert.equal(a.state().executions, 1);
assert(a.d.getElementById("execute-fivem").disabled);
await a.setDraft("");
await new Promise((r) => setTimeout(r, 2300));
assert.equal(a.state().text, "");
assert(a.d.getElementById("execute-fivem").disabled);
a.dom.window.close();
const b = await create(1);
await b.setDraft("/entorno Puente antiguo");
assert.equal(b.state().preparations, 0);
assert(!b.d.getElementById("execute-fivem").disabled);
assert.match(
  b.d.getElementById("bridge-status").textContent,
  /Actualiza el puente/,
);
b.dom.window.close();
console.log(
  "PASS: preparar sin enviar, no subir duplicados, estado del atajo, bloqueo tras enviar, vaciar borrador y compatibilidad con puente anterior.",
);

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
async function create(version, events = false) {
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
  let sequence = 0, eventResolve = null;
  let connected = true, available = true;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.AbortSignal.timeout = () => undefined;
  w.confirm = () => true;
  Object.defineProperty(w.navigator, "clipboard", {
    value: { writeText: async () => {} },
  });
  w.fetch = async (url, options) => {
    if (String(url).split("?")[0] === "vehicles.json")
      return {
        ok: true,
        json: async () =>
          JSON.parse(fs.readFileSync(root + "/vehicles.json", "utf8")),
      };
    if (url.endsWith('/health') && !available) throw new TypeError('offline');
    if (url.endsWith("/health"))
      return {
        ok: true,
        json: async () => ({
          bridge: "entorno-fivem",
          version,
          token: "test-token",
          connected,
          capabilities: version === 2 ? ["prepare", "hotkey", ...(events ? ['send-events'] : [])] : [],
          sequence,
          preparation: { ready: !!text && !sent, sent },
          hotkey: { configured: "CTRL+F9", active: true, error: "" },
        }),
      };
    if (url.endsWith('/events')) return new Promise((resolve, reject) => {
      eventResolve = event => resolve({ok:true,json:async()=>({ok:true,event})});
      options.signal.addEventListener('abort', () => reject(new Error('aborted')), {once:true});
    });
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
      fs.readFileSync(root + "/" + script.getAttribute("src").split('?')[0], "utf8"),
      dom.getInternalVMContext(),
    );
  await tick();
  await tick();
  return {
    w,
    d,
    dom,
    state: () => ({ text, sent, preparations, executions }),
    connection: async (game, bridge=true) => { connected=game;available=bridge;await w.checkBridge(); },
    emit: async (source='hotkey', value=text) => {
      assert(eventResolve, 'event listener running');
      sequence++; sent=true;
      eventResolve({sequence, source, text:value});
      await tick(); await tick();
    },
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
const c = await create(2, true);
assert(c.d.querySelector('.bridge-download').hidden,'download hidden when bridge detected');
assert(c.d.getElementById('auto-version').parentElement.hidden,'option hidden with disabled execute');
c.w.loadConfig({fields:{situation:'0',place:'0'}});
await c.w.syncPreparedDraft();
const original=c.state().text;
const settings=()=>[...c.d.querySelectorAll('#form select, #form input, #form textarea')].map(e=>[e.id,e.value,e.checked]);
const before=settings();
const option=c.d.getElementById('auto-version');
assert(!option.parentElement.hidden,'option visible when execute enabled');
await c.connection(false);
assert(option.parentElement.hidden,'option hidden without game connection');
assert(c.d.querySelector('.bridge-download').hidden,'bridge detected even if game closed');
await c.connection(true);
assert(!option.parentElement.hidden);
assert(!option.checked);
option.checked=true; option.dispatchEvent(new c.w.Event('change'));
await tick(); await tick();
assert.equal(c.w.localStorage.getItem('entorno-auto-version'),'true');
await c.emit();
assert.notEqual(c.state().text,original);
assert.deepEqual(settings(),before);
assert.equal(c.state().executions,0,'new version never auto-executes');
const next=c.state().text;
await c.emit('web');
assert.equal(c.state().text,next,'manual web sends do not rotate');
await c.emit('hotkey',original);
assert.equal(c.state().text,next,'stale events cannot replace edited output');
Object.defineProperty(c.d,'hidden',{configurable:true,value:true});
for (const length of ['brief','normal','long']) {
  c.d.getElementById('length').value=length;
  c.w.generate();await c.w.syncPreparedDraft();
  const previous=c.state().text, selected=settings();
  await c.emit();
  assert.notEqual(c.state().text,previous,'rotates '+length+' while backgrounded');
  assert.deepEqual(settings(),selected);
}
const current=c.state().text;
c.w.handleSendEvent({sequence:1,source:'hotkey',text:current});
assert.equal(c.state().text,current,'duplicate event ignored');
option.checked=false;option.dispatchEvent(new c.w.Event('change'));
await tick();await tick();
c.w.handleSendEvent({sequence:99,source:'hotkey',text:current});
assert.equal(c.state().text,current,'disabled option leaves draft alone');
assert.equal(c.state().executions,0);
await c.connection(false,false);
assert(!c.d.querySelector('.bridge-download').hidden,'download restored when bridge unavailable');
assert(option.parentElement.hidden);
c.dom.window.close();
console.log(
  "PASS: preparación, compatibilidad y generación tras atajo: parámetros intactos, sin autoenvío, opción persistente, eventos antiguos y envíos manuales ignorados.",
);

import fs from "node:fs";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "vehicles.json"), "utf8"),
);
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
async function app({ delayCatalog = false, storage = {} } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", (e) => errors.push(e));
  const dom = new JSDOM(html, {
    url: "https://qa.entornos.test/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
    virtualConsole: vc,
  });
  const w = dom.window;
  for (const [key,value] of Object.entries(storage)) w.localStorage.setItem(key,value);
  let release;
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.fetch = async (url) => {
    if (url === "vehicles.json") {
      if (delayCatalog) await new Promise((r) => (release = r));
      return { ok: true, json: async () => catalog.map((c) => ({ ...c })) };
    }
    throw new TypeError("No bridge");
  };
  w.AbortSignal.timeout = () => undefined;
  Object.defineProperty(w.navigator, "clipboard", {
    value: { writeText: async (text) => (w.copied = text) },
  });
  for (const script of dom.window.document.querySelectorAll("script[src]"))
    vm.runInContext(
      fs.readFileSync(path.join(root, script.getAttribute("src").split('?')[0]), "utf8"),
      dom.getInternalVMContext(),
    );
  if (!delayCatalog) await tick();
  return {
    w,
    d: w.document,
    errors,
    release: () => release?.(),
    close: () => w.close(),
  };
}
function set(a, id, value) {
  a.d.getElementById(id).value = value;
  a.d
    .getElementById(id)
    .dispatchEvent(new a.w.Event("change", { bubbles: true }));
}
function button(a, container, label) {
  const b = [...a.d.querySelectorAll(container + " button")].find(
    (b) => b.textContent === label,
  );
  assert.ok(b, "Button " + label);
  b.click();
}
function scene(a, label) {
  const id = a.w.eval(
    "situations.findIndex(x=>x[0]===" + JSON.stringify(label) + ")",
  );
  assert.ok(id >= 0, label);
  set(a, "situation", String(id));
}
function place(a, label) {
  return a.w.eval("places.indexOf(" + JSON.stringify(label) + ")");
}
function output(a) {
  return a.d.getElementById("output").textContent;
}
const a = await app();
ok(a.errors.length === 0, "No initialization errors");
ok(output(a) === "", "Empty initial scene");
ok(a.d.getElementById("length").value === "normal", "Normal default");
ok(a.d.getElementById("tone").value === "", "Random default");
ok(a.d.getElementById("copy").disabled, "Copy disabled when empty");
ok(
  a.d.querySelectorAll("#numbers button").length === 10,
  "10 quantity buttons",
);
scene(a, "atracando un yate");
ok(
  ![...a.d.getElementById("place").options].some(
    (o) => o.textContent === "en una tienda",
  ),
  "Yacht cannot be in store",
);
ok(
  ![...a.d.getElementById("place").options].some(
    (o) => o.textContent === "en Grand Senora Desert",
  ),
  "Yacht cannot be in desert",
);
set(a, "place", String(place(a, "en Paleto Bay")));
ok(output(a).includes("Paleto Bay"), "Coastal location");
scene(a, "atracando una farmacia");
ok(
  ![...a.d.getElementById("place").options].some(
    (o) => o.textContent === "en Diamond Casino",
  ),
  "Specific landmark is not generic geography",
);
set(a, "place", String(place(a, "en una farmacia")));
scene(a, "atracando un yate");
ok(a.d.getElementById("place").value === "", "Incompatible selection cleared");
scene(a, "amenazando a alguien");
button(a, "#numbers", "8");
a.d.getElementById("number-more").checked = true;
a.d
  .getElementById("number-more")
  .dispatchEvent(new a.w.Event("change", { bubbles: true }));
ok(output(a).includes("más de 8 personas"), "More than quantity");
const manual = a.d.getElementById("manual-number");
manual.value = "18";
manual.dispatchEvent(new a.w.Event("input", { bubbles: true }));
ok(output(a).includes("más de 18 personas"), "Manual quantity");
manual.value = "1.5";
manual.dispatchEvent(new a.w.Event("input", { bubbles: true }));
ok(
  output(a) === "" && a.d.getElementById("copy").disabled,
  "Invalid quantity blocks stale output",
);
button(a, "#numbers", "1");
a.d.getElementById("number-more").checked = false;
a.w.generate();
ok(output(a).includes("una persona"), "Singular");
button(a, "#weapons", "Arma melee");
button(a, "#weapon-types", "Machete");
ok(output(a).includes("machete"), "Melee output");
button(a, "#weapons", "Arma de fuego");
button(a, "#weapon-types", "Rifle");
ok(output(a).includes("rifle"), "Firearm output");
button(a, "#weapons", "Desarmado");
ok(a.d.getElementById("weapon-types").hidden, "Subtype hidden");
set(a, "tone", "s");
set(a, "length", "normal");
const normal = output(a).length;
set(a, "length", "long");
ok(output(a).length > normal + 100, "Long output");
set(a, "length", "brief");
ok(output(a).length < normal, "Brief output");
set(a, "clothing", "22");
set(a, "clothcolor", "0");
ok(!output(a).includes("no se distingue de color"), "Clothing grammar");
// Save, clear and load, including custom quantity and vehicle.
scene(a, "amenazando a alguien");
manual.value = "18";
manual.dispatchEvent(new a.w.Event("input", { bubbles: true }));
button(a, "#travel-buttons", "Seleccionar coche");
ok(a.d.getElementById('vehicle-picker').open, 'Catalog starts expanded');
[...a.d.querySelectorAll('#cars .choose')].find(b=>b.firstChild.textContent==='Massacro').click();
ok(!a.d.getElementById('vehicle-picker').open, 'Choosing a car collapses catalog');
a.d.querySelector("#slots input").value = "Revisión";
button(a, "#slots", "Guardar");
await tick();
a.d.getElementById("reset").click();
ok(output(a) === "", "Clear all");
ok(a.d.getElementById('vehicle-picker').open, 'Reset reopens catalog');
button(a, "#preset-list", "Revisión");
await tick();
ok(
  output(a).includes("18 personas") && output(a).includes("Massacro"),
  "Config roundtrip",
);
ok(!a.d.getElementById('vehicle-picker').open, 'Loading a saved car keeps catalog compact');
a.d.getElementById("copy").click();
await tick();
ok(a.w.copied === output(a).trim(), "Clipboard");
// 40 updates must not leak detached selector handlers.
for (let i = 0; i < 40; i++) {
  button(a, "#slots", "Actualizar datos");
  await tick();
}
ok(
  a.w.eval("searchableSelects.size") ===
    a.d.querySelectorAll("select").length - 2,
  "Detached selectors cleaned",
);
// Verify keyboard navigation and one active popup.
const input = a.d.querySelector("#place").parentElement.querySelector("input");
input.focus();
input.dispatchEvent(
  new a.w.KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
);
ok(
  input.getAttribute("aria-activedescendant") ===
    a.d.querySelector("#place").parentElement.querySelector(".unified-list")
      .id +
      "-" +
      (a.d.getElementById("place").options.length - 1),
  "ArrowUp selects last",
);
a.d.getElementById("situation-search").focus();
ok(input.getAttribute("aria-expanded") === "false", "Only one popup");
let calls = 0;
const old = a.w.generate;
a.w.generate = () => {
  calls++;
  old();
};
a.d
  .getElementById("number-more")
  .dispatchEvent(new a.w.Event("change", { bubbles: true }));
ok(calls === 1, "No double generation");
calls = 0;
set(a, "category", "SPORT");
ok(calls === 0, "Vehicle category does not regenerate");
a.w.generate = old;
// All scene/tone/length combinations must generate without undefined values.
const total = a.w.eval("situations.length");
for (let i = 0; i < total; i++) {
  set(a, "situation", String(i));
  ok(!/undefined|NaN/.test(output(a)), "Scene " + i);
}
ok(a.errors.length === 0, "No runtime errors");
a.close();
const delayed = await app({ delayCatalog: true });
const saved = {
  fields: { situation: "0", travel: "vehicle", length: "normal", tone: "s" },
  number: "3",
  vehicleId: "massacro",
};
delayed.w.loadConfig(saved);
delayed.release();
await tick();
await tick();
ok(
  output(delayed).includes("Massacro"),
  "Saved vehicle survives delayed catalog",
);
ok(delayed.errors.length === 0, "Delayed load errors");
delayed.close();
// Every tone rotates all openings before reuse; long retains supplied details.
const v = await app();
for (const tone of v.w.eval("Object.keys(voicePools)")) {
  const size = v.w.eval(
    "voicePools[" + JSON.stringify(tone) + "].start.length",
  );
  const starts = new Set();
  for (let i = 0; i < size; i++) {
    const result = v.w.voiceScene(
      ["Veo a 2 personas.", "Vehículo: Massacro gris."],
      tone,
    );
    starts.add(result[0]);
    assert.ok(result.join(" ").includes("Massacro gris"));
  }
  ok(starts.size === size, "Opening rotation " + tone);
}
v.close();
// Named presets: migration, unlimited entries, actions, reload and failures.
const legacy = JSON.stringify([{name:'Atraco',data:saved},null,{name:'Atraco',data:saved},null,null]);
const p = await app({storage:{'entorno-configs-v1':legacy}});
const stored = () => JSON.parse(p.w.localStorage.getItem('entorno-configs-v2'));
ok(p.d.querySelectorAll('#preset-list button').length===2,'Only populated legacy slots migrate');
ok(p.w.localStorage.getItem('entorno-configs-v1')===legacy,'Legacy backup retained');
ok(stored()[1].name==='Atraco (2)','Migration disambiguates duplicate names');
button(p,'#preset-list','Atraco');
ok(output(p).includes('Massacro') && output(p).includes('3 personas'),'Legacy preset retains full parameters');
for(let i=0;i<7;i++){
  p.d.getElementById('preset-name').value='Nueva '+i;
  p.d.getElementById('preset-save').click();
}
ok(stored().length===9,'No five-entry limit');
const before=stored().length;
p.d.getElementById('preset-name').value='  nueva 0  ';
p.d.getElementById('preset-save').click();
ok(stored().length===before,'Duplicate name cannot overwrite');
p.d.getElementById('preset-name').value='';p.d.getElementById('preset-save').click();
ok(stored().length===before,'Empty name rejected');
p.d.getElementById('preset-name').value='Renombrada';p.d.getElementById('preset-rename').click();
ok(stored().some(x=>x.name==='Renombrada'),'Rename stored');
p.d.getElementById('manual-number').value='27';p.d.getElementById('manual-number').dispatchEvent(new p.w.Event('input',{bubbles:true}));
p.d.getElementById('preset-update').click();
ok(stored().find(x=>x.name==='Renombrada').data.number==='27','Update saves parameters');
p.d.getElementById('reset').click();button(p,'#preset-list','Renombrada');
ok(output(p).includes('27 personas'),'Quick button loads updated parameters');
p.d.getElementById('preset-delete').click();
ok(stored().length===before-1,'Delete removes one preset');
button(p,'#slot-status','Deshacer');
ok(stored().length===before && stored().some(x=>x.name==='Renombrada'),'Undo restores deleted preset');
const persisted=p.w.localStorage.getItem('entorno-configs-v2');
const reloaded=await app({storage:{'entorno-configs-v2':persisted,'entorno-configs-v1':legacy}});
ok(reloaded.d.querySelectorAll('#preset-list button').length===before,'Reload uses new store without remigrating');
button(reloaded,'#preset-list','Renombrada');
ok(output(reloaded).includes('27 personas'),'Reload retains saved data');
reloaded.close();
const raw=JSON.stringify([{id:'unsafe',name:'<img src=x onerror=alert(1)>',data:saved}]);
const safe=await app({storage:{'entorno-configs-v2':raw}});
ok(safe.d.querySelector('#preset-list img')===null,'Names rendered as text, never HTML');safe.close();
const broken=await app({storage:{'entorno-configs-v2':'broken'}});
ok(broken.d.getElementById('preset-save').disabled,'Unreadable store prevents overwriting');
ok(broken.w.localStorage.getItem('entorno-configs-v2')==='broken','Corrupt original retained');broken.close();
const memoryBefore=p.w.localStorage.getItem('entorno-configs-v2');
const proto=Object.getPrototypeOf(p.w.localStorage), originalSet=proto.setItem;
proto.setItem=()=>{throw new Error('quota')};
p.d.getElementById('preset-name').value='No guardar';p.d.getElementById('preset-save').click();
ok(p.w.localStorage.getItem('entorno-configs-v2')===memoryBefore,'Failed write keeps old data');
ok(/No se ha podido guardar/.test(p.d.getElementById('slot-status').textContent),'Storage error reported');
proto.setItem=originalSet;
ok(p.errors.length===0,'No preset runtime errors');p.close();
console.log(
  `PASS: ${checks} comprobaciones; ${total} situaciones; configuraciones, catálogo lento, filtros, cantidades, armas, longitudes, teclado y rotación.`,
);

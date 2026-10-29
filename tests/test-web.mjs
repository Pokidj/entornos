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
  if (id === 'situation' && /^\d+$/.test(value)) {
    const action=a.w.eval('sceneActionFor(situations['+Number(value)+'][0]).id');
    a.d.getElementById('scene-action').value=action;
    a.d.getElementById('situation-search').value='';
    a.w.renderSituations();
    if (![...a.d.getElementById('situation').options].some(o=>o.value===value)) {
      const option=a.d.createElement('option');option.value=value;option.textContent='Legacy detail';a.d.getElementById('situation').append(option);
    }
  }
  a.d.getElementById(id).value = value;
  a.d
    .getElementById(id)
    .dispatchEvent(new a.w.Event("change", { bubbles: true }));
}
function button(a, container, label) {
  const b = [...a.d.querySelectorAll(container + " button")].find(
    (b) => b.textContent.trim() === label,
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
const outfits = await app();
scene(outfits, "amenazando a alguien");
button(outfits, "#numbers", "2");
ok(!outfits.d.getElementById('wardrobe-controls').hidden, 'Multiple people show wardrobe controls');
ok(!outfits.d.getElementById('same-clothing').checked, 'New group defaults to individual outfits');
const outfitOption = (id, text) => [...outfits.d.getElementById(id).options].find(o=>o.textContent===text).value;
set(outfits,'clothing',outfitOption('clothing','ropa de calle'));
set(outfits,'clothcolor',outfitOption('clothcolor','negro'));
set(outfits,'face',outfitOption('face','con pasamontañas'));
set(outfits,'clothing-person','1');
ok(outfits.d.getElementById('clothing').value==='', 'Second person starts empty');
set(outfits,'clothing',outfitOption('clothing','ropa deportiva'));
set(outfits,'clothcolor',outfitOption('clothcolor','blanco'));
ok(/Persona 1: ropa de calle de color negro, con pasamontañas/.test(output(outfits)), 'First outfit and mask preserved');
ok(/Persona 2: ropa deportiva de color blanco\./.test(output(outfits)), 'Second outfit described independently');
set(outfits,'length','brief');
ok(output(outfits).includes('Persona 1:') && output(outfits).includes('Persona 2:'), 'Brief preserves individual clothing');
outfits.d.getElementById('same-clothing').click();
ok(outfits.d.getElementById('person-picker').hidden && !output(outfits).includes('Persona 2:'), 'Shared mode uses a group description');
outfits.d.getElementById('same-clothing').click();
ok(output(outfits).includes('ropa de calle de color negro') && output(outfits).includes('ropa deportiva de color blanco'), 'Unchecking recovers individual outfits');
set(outfits,'clothing-person','0');
ok(outfits.d.getElementById('face').value===outfitOption('face','con pasamontañas'), 'Person switch restores accessories');
set(outfits,'length','normal');
const wardrobeSaved = outfits.w.eval('JSON.stringify(snapshot())');
outfits.d.getElementById('reset').click();
ok(outfits.d.getElementById('wardrobe-controls').hidden, 'Reset hides group editor');
outfits.w.eval('loadConfig('+wardrobeSaved+')');
ok(output(outfits).includes('Persona 1: ropa de calle de color negro') && output(outfits).includes('Persona 2: ropa deportiva de color blanco'), 'Saved outfits restore together');
button(outfits,'#numbers','1');
ok(!output(outfits).includes('ropa deportiva') && output(outfits).includes('ropa de calle'), 'Reducing count excludes removed people');
button(outfits,'#numbers','2');
ok(output(outfits).includes('ropa deportiva'), 'Increasing count recovers current session data');
outfits.d.getElementById('number-more').click();
ok(output(outfits).includes('más de 2 personas') && !output(outfits).includes('Persona 3:'), 'More-than count does not invent other outfits');
outfits.w.eval('loadConfig('+JSON.stringify({number:'2',fields:{situation:'0',clothing:'0',clothcolor:'0'}})+')');
ok(outfits.d.getElementById('same-clothing').checked && !output(outfits).includes('Persona 1:'), 'Legacy group clothing remains shared');
outfits.w.eval('loadConfig('+wardrobeSaved+')');
set(outfits,'clothing-person','1');
outfits.d.getElementById('preset-name').value='Ropa individual'; outfits.d.getElementById('preset-save').click();
outfits.d.getElementById('reset').click(); button(outfits,'#preset-list','Ropa individual');
ok(output(outfits).includes('Persona 1: ropa de calle') && output(outfits).includes('Persona 2: ropa deportiva'), 'Named preset retains both outfits from second-person editor');
outfits.d.getElementById('manual-number').value='999';
outfits.d.getElementById('manual-number').dispatchEvent(new outfits.w.Event('input',{bubbles:true}));
set(outfits,'clothing-person','998');
set(outfits,'clothing',outfitOption('clothing','ropa de calle'));
ok(output(outfits).includes('Persona 999: ropa de calle'), 'Manual count supports last identified person');
ok(outfits.errors.length===0,'No wardrobe runtime errors'); outfits.close();
const crimes = await app();
const labels = crimes.w.eval('situations.map(x=>x[0])');
ok(new Set(labels).size===labels.length, 'Expanded crime catalog has no duplicate labels');
ok(labels[0]==='amenazando a alguien' && labels[1]==='atracando una tienda' && labels[2]==='robando un vehículo', 'Existing scene indices remain stable');
for (const [query, expected] of [
  ['chatarreria','Robando metal de una chatarrería'],
  ['peluqueria','Atracando una peluquería'],
  ['robar peluqueria','Robando la caja de una peluquería'],
  ['peluqueria robar','Robando la caja de una peluquería'],
  ['robar','Robando'], ['atracar','Robando'], ['secuestro','Secuestrando a alguien'],
  ['secuestrar','Secuestrando a alguien'], ['atrac','Atracando una peluquería'],
  ['barb','Atracando una barbería'], ['desguace','Robando metal de una chatarrería'],
]) {
  const expectedId=labels.indexOf(expected.charAt(0).toLowerCase()+expected.slice(1));
  set(crimes,'scene-action',crimes.w.eval('sceneActionFor(situations['+expectedId+'][0]).id'));
  crimes.d.getElementById('situation-search').value=query;
  crimes.d.getElementById('situation-search').dispatchEvent(new crimes.w.Event('input',{bubbles:true}));
  ok([...crimes.d.getElementById('situation').options].some(o=>o.value===String(expectedId)&&!o.textContent.startsWith('Seleccionado:')), 'Crime search: '+query);
}
crimes.d.getElementById('situation-search').value='';
crimes.d.getElementById('situation-search').dispatchEvent(new crimes.w.Event('input',{bubbles:true}));
for (const [action, allowed, denied] of [
  ['atracando una peluquería','en una peluquería','en una joyería'],
  ['robando metal de una chatarrería','en un desguace','en una tienda'],
  ['secuestrando a una persona en una chatarrería','en un centro de reciclaje','en un banco'],
  ['robando en una ferretería','en una ferretería','en una farmacia'],
  ['robando en una tienda de mascotas','en una tienda de mascotas','en una tienda de ropa'],
  ['robando obras de arte de un museo','en un museo','en un supermercado'],
  ['robando ordenadores de una oficina','en una oficina','en una tienda de electrónica'],
  ['robando un helicóptero','en un helipuerto','en una tienda'],
  ['robando una lancha','en el puerto','en una tienda'],
]) {
  scene(crimes,action);
  const locations=[...crimes.d.getElementById('place').options].map(o=>o.textContent);
  ok(locations.includes(allowed) && !locations.includes(denied),'Compatible place for '+action);
}
scene(crimes,'robando');
ok([...crimes.d.getElementById('place').options].some(o=>o.textContent==='en una tienda'), 'Generic robbery keeps location choices');
button(crimes,'#numbers','1');
ok(output(crimes).includes('está robando'), 'Generic robbery uses singular');
button(crimes,'#numbers','3');
ok(output(crimes).includes('están robando'), 'Generic robbery uses plural');
scene(crimes,'secuestrando a alguien');
ok([...crimes.d.getElementById('place').options].some(o=>o.textContent==='en una vivienda'), 'Generic kidnapping keeps location choices');
ok(crimes.errors.length===0,'No expanded catalog runtime errors'); crimes.close();
const custom = await app();
set(custom,'scene-action','rob');
button(custom,'#numbers','2');
ok(output(custom).includes('están robando'), 'Generic robbery is directly accessible');
const writeCustom = text => {
  custom.d.getElementById('situation-search').value=text;
  custom.d.getElementById('situation-search').dispatchEvent(new custom.w.Event('input',{bubbles:true}));
  custom.d.getElementById('situation-use-custom').click();
};
writeCustom('robar en una peluquería');
set(custom,'place',String(place(custom,'en una peluquería')));
for (const length of ['normal','brief','long']) {
  set(custom,'length',length);
  ok((output(custom).match(/peluquería/gi)||[]).length===1, 'Custom venue appears once: '+length);
}
ok(custom.d.getElementById('situation').value==='custom','Custom scene selected');
ok(![...custom.d.getElementById('place').options].some(o=>o.textContent==='en una tienda'),'Custom scene uses place compatibility');
custom.d.getElementById('preset-name').value='Mi situación';custom.d.getElementById('preset-save').click();
const customStorage=custom.w.localStorage.getItem('entorno-configs-v2');
custom.d.getElementById('reset').click();button(custom,'#preset-list','Mi situación');
ok(output(custom).includes('robando en una peluquería'),'Custom scene restored from preset');
const customReload=await app({storage:{'entorno-configs-v2':customStorage}});
button(customReload,'#preset-list','Mi situación');
ok(output(customReload).includes('robando en una peluquería'),'Custom scene survives reload');customReload.close();
writeCustom('robar robar en en una una joyería');
ok(output(custom).includes('robando en una joyería') && !/robar robar|en en|una una/.test(output(custom)),'Repeated words removed');
writeCustom('constructor');
ok(output(custom).includes('constructor') && !/function Object|\[object Object\]/.test(output(custom)),'Unknown word is kept literally');
custom.d.getElementById('situation-search').value='mi escena manual';
custom.d.getElementById('situation-search').dispatchEvent(new custom.w.Event('input',{bubbles:true}));
custom.d.getElementById('situation-search').dispatchEvent(new custom.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));
ok(custom.d.activeElement.id==='situation-use-custom','Custom text action is keyboard accessible');
writeCustom('<img src=x onerror=alert(1)>');
ok(!custom.d.querySelector('#output img') && output(custom).includes('<img'), 'Custom situation rendered as text');
writeCustom('x'.repeat(200));
ok(custom.w.eval('customSituation.length')===160,'Custom situation length limited');
writeCustom('   ');
ok(custom.d.getElementById('situation-use-custom').hidden,'Blank input cannot replace scene');
custom.d.getElementById('situation-search').value='celebración espontánea';
custom.d.getElementById('situation-search').dispatchEvent(new custom.w.Event('input',{bubbles:true}));
custom.d.getElementById('situation-search').dispatchEvent(new custom.w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
ok(output(custom).includes('celebración espontánea'),'Enter accepts custom text without matches');
set(custom,'scene-action','kidnap');
ok(output(custom).includes('secuestrando a alguien') && custom.w.eval('customSituation')==='','Catalog selection replaces custom scene');
custom.d.getElementById('reset').click();scene(custom,'robando la caja de una peluquería');
set(custom,'place',String(place(custom,'en una peluquería')));
ok((output(custom).match(/peluquería/gi)||[]).length===1,'Catalog scene does not repeat selected venue');
set(custom,'place',String(place(custom,'en Paleto Bay')));
ok(output(custom).includes('Paleto Bay') && output(custom).includes('peluquería'),'Specific geography preserved');
ok(custom.w.eval('cleanRepeatedWords("de color de color negro negro")')==='de color negro','Repeated color phrase removed');
ok(custom.errors.length===0,'No custom scene runtime errors');custom.close();
const split = await app();
ok(split.d.getElementById('scene-action').value==='' && split.d.getElementById('situation-search').disabled, 'Blank action disables dependent detail');
ok(split.d.getElementById('scene-action').options.length===21, 'Twenty general actions and blank choice');
set(split,'scene-action','rob');
ok(output(split).includes('está robando') && !output(split).includes('joyería'),'Robbery without detail is general');
const robberyChoices=[...split.d.getElementById('situation').options];
ok(robberyChoices.some(o=>o.textContent==='Una joyería') && robberyChoices.some(o=>o.textContent==='Un coche'),'Robbery details include businesses and vehicles');
ok(!robberyChoices.some(o=>/reteniendo|secuestrando|disparando/i.test(o.textContent)),'Robbery excludes unrelated details');
const jeweler=robberyChoices.find(o=>o.textContent==='Una joyería');
set(split,'situation',jeweler.value);
ok(output(split).includes('joyería'),'Specific robbery uses selected detail');
set(split,'scene-action','kidnap');
ok(output(split).includes('secuestrando a alguien') && !output(split).includes('joyería'),'Action change removes old detail');
ok(split.d.getElementById('situation-search').value==='','General selection displays an empty optional detail');
const hostages=[...split.d.getElementById('situation').options];
ok(!hostages.some(o=>/robando|joyas|mercancía/i.test(o.textContent)),'Kidnapping details exclude robbery targets');
split.d.getElementById('situation-search').value='una persona del muelle';
split.d.getElementById('situation-search').dispatchEvent(new split.w.Event('input',{bubbles:true}));
split.d.getElementById('situation-use-custom').click();
ok(output(split).includes('secuestrando a alguien (una persona del muelle)'),'Own detail retains general action');
split.d.getElementById('situation-clear').click();
ok(output(split).includes('secuestrando a alguien') && !output(split).includes('muelle'),'Clearing detail preserves action and generic output');
set(split,'scene-action','rob');
split.d.getElementById('situation-search').value='amenazar al encargado';
split.d.getElementById('situation-search').dispatchEvent(new split.w.Event('input',{bubbles:true}));split.d.getElementById('situation-use-custom').click();
ok(split.d.getElementById('scene-action').value==='threat' && output(split).includes('amenazando al encargado'),'Explicit custom action updates category');
const splitSaved=split.w.eval('JSON.stringify(snapshot())');
split.d.getElementById('reset').click();split.w.eval('loadConfig('+splitSaved+')');
ok(split.d.getElementById('scene-action').value==='threat' && output(split).includes('amenazando al encargado'),'Custom action and detail survive saved config');
split.w.eval('loadConfig('+JSON.stringify({fields:{situation:String(labels.indexOf('atracando una chatarrería'))}})+')');
ok(split.d.getElementById('scene-action').value==='rob' && output(split).includes('chatarrería'),'Old configuration infers action without changing scene');
for (const id of split.w.eval('sceneActions.map(x=>x.id)')) {
  set(split,'scene-action',id);
  ok(output(split).startsWith('/entorno ') && !/undefined|NaN/.test(output(split)), 'General action generates: '+id);
}
const generateSplit=split.w.generate; let splitCalls=0; split.w.generate=()=>{splitCalls++;generateSplit()};
set(split,'scene-action','rob');ok(splitCalls===1,'Action selection generates exactly once');
split.w.generate=generateSplit;
ok(split.errors.length===0,'No split selector runtime errors');split.close();
console.log(
  `PASS: ${checks} comprobaciones; ${total} situaciones; configuraciones, catálogo lento, filtros, cantidades, armas, longitudes, teclado y rotación.`,
);

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../dist",
);
const key = "entorno-sent-history-v1",
  token = "private-test-session-never-store";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
let checks = 0;
const ok = (condition, message) => {
  assert.ok(condition, message);
  checks++;
};
async function setup({ version = 2, storage = {}, mode = "success" } = {}) {
  const errors = [],
    vc = new VirtualConsole();
  vc.on("jsdomError", (error) => errors.push(error));
  const dom = new JSDOM(fs.readFileSync(root + "/index.html", "utf8"), {
    url: "https://history.test/",
    runScripts: "outside-only",
    virtualConsole: vc,
  });
  const w = dom.window,
    d = w.document;
  for (const [name, value] of Object.entries(storage))
    w.localStorage.setItem(name, value);
  let sequence = 0,
    resolveEvent = null,
    text = "",
    sent = false,
    executions = 0,
    confirmed = true,
    copied = "";
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.AbortSignal.timeout = () => undefined;
  w.confirm = () => confirmed;
  Object.defineProperty(w.navigator, "clipboard", {
    value: { writeText: async (value) => (copied = value) },
  });
  const settle = async () => {
    await tick();
    await tick();
  };
  function deliver(source, value) {
    assert.ok(
      resolveEvent,
      "Event watcher is active with automatic variation off",
    );
    sequence++;
    const resolve = resolveEvent;
    resolveEvent = null;
    resolve({
      ok: true,
      json: async () => ({
        ok: true,
        event: { sequence, source, text: value },
      }),
    });
  }
  w.fetch = async (url, options = {}) => {
    if (String(url).split("?")[0] === "vehicles.json")
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
          token,
          connected: true,
          sequence,
          capabilities:
            version === 2 ? ["prepare", "hotkey", "send-events"] : [],
          hotkey: { configured: "CTRL+F9", active: true },
          preparation: { ready: Boolean(text) && !sent, sent },
        }),
      };
    if (url.endsWith("/events"))
      return new Promise((resolve, reject) => {
        resolveEvent = resolve;
        options.signal.addEventListener(
          "abort",
          () => reject(Error("aborted")),
          { once: true },
        );
      });
    const value = JSON.parse(options.body).text;
    if (url.endsWith("/prepare")) {
      if (text !== value) {
        text = value;
        sent = false;
      }
      return {
        ok: true,
        json: async () => ({ ok: true, ready: Boolean(text) && !sent, sent }),
      };
    }
    if (url.endsWith("/execute")) {
      executions++;
      if (mode === "failure" || mode === "uncertain")
        return {
          ok: false,
          json: async () => ({
            ok: false,
            sent: mode === "uncertain",
            uncertain: mode === "uncertain",
            error: "No confirmado",
          }),
        };
      sent = true;
      text = value;
      if (mode === "event-first") {
        deliver("web", value);
        await settle();
      }
      return { ok: true, json: async () => ({ ok: true, sent: true }) };
    }
    throw Error("Unexpected request");
  };
  for (const script of d.querySelectorAll("script[src]"))
    vm.runInContext(
      fs.readFileSync(
        root + "/" + script.getAttribute("src").split("?")[0],
        "utf8",
      ),
      dom.getInternalVMContext(),
    );
  await settle();
  async function draft(value) {
    d.getElementById("output").textContent = value;
    d.getElementById("output").dispatchEvent(new w.Event("input"));
    await w.syncPreparedDraft();
    await settle();
  }
  return {
    w,
    d,
    errors,
    close: () => dom.window.close(),
    items: () => JSON.parse(w.localStorage.getItem(key) || "[]"),
    draft,
    execute: () => d.getElementById("execute-fivem").onclick(),
    confirm: (value) => (confirmed = value),
    emit: async (source, value) => {
      deliver(source, value);
      await settle();
    },
    state: () => ({ executions, copied }),
  };
}

const hotkey = await setup();
hotkey.d.getElementById("history-jump").click();
ok(
  hotkey.d.getElementById("sent-history").open,
  "History shortcut expands the panel",
);
await hotkey.draft("/entorno Primera prueba de atajo");
await hotkey.emit("hotkey", "/entorno Primera prueba de atajo");
ok(
  hotkey.items().length === 1 && hotkey.items()[0].via === "hotkey",
  "Hotkey is logged with automatic variation off",
);
ok(
  hotkey.d.getElementById("output").textContent ===
    "/entorno Primera prueba de atajo",
  "Logging does not generate another version",
);
ok(
  !hotkey.w.localStorage.getItem(key).includes(token),
  "No bridge token is persisted",
);
const first = hotkey.items()[0];
hotkey.w.handleSendEvent({ sequence: 1, source: "hotkey", text: first.text });
ok(hotkey.items().length === 1, "Replayed event does not duplicate history");
await hotkey.draft("/entorno Texto que estoy editando");
await hotkey.emit("hotkey", "/entorno El texto anterior realmente enviado");
ok(
  hotkey.items()[0].text.includes("anterior realmente"),
  "History uses sent text even if the draft changed",
);
await hotkey.emit("hotkey", "/entorno El texto anterior realmente enviado");
ok(
  hotkey.items().length === 3,
  "Different confirmed sends can contain identical text",
);
await hotkey.d
  .getElementById("sent-history-list")
  .querySelector("button")
  .onclick();
ok(
  hotkey.state().copied === hotkey.items()[0].text &&
    hotkey.state().executions === 0,
  "History copy never sends to the game",
);
const persisted = hotkey.w.localStorage.getItem(key);
hotkey.close();
const reload = await setup({ storage: { [key]: persisted } });
ok(
  reload.items().length === 3 &&
    reload.d.querySelectorAll("#sent-history-list > li").length === 3,
  "History survives reload",
);
reload.w.handleSendEvent({
  sequence: 5,
  source: "hotkey",
  text: "/entorno Recuperado tras un intervalo",
});
ok(
  reload.d
    .getElementById("sent-history-status")
    .textContent.includes("intervalo sin conexión"),
  "A sequence gap is reported instead of inventing missing sends",
);
reload.close();

const manual = await setup();
await manual.draft("/entorno Envío manual");
manual.confirm(false);
await manual.execute();
ok(
  manual.items().length === 0 && manual.state().executions === 0,
  "Cancelled execution is not logged",
);
await manual.d.getElementById("copy").onclick();
ok(manual.items().length === 0, "Copying the draft is not an execution");
manual.confirm(true);
await manual.execute();
ok(
  manual.items().length === 1 && manual.items()[0].via === "button",
  "Successful button response is logged",
);
await manual.emit("web", "/entorno Envío manual");
ok(manual.items().length === 1, "Response before event is deduplicated");
manual.close();
const eventFirst = await setup({ mode: "event-first" });
await eventFirst.draft("/entorno Evento anterior a respuesta");
await eventFirst.execute();
ok(eventFirst.items().length === 1, "Event before response is deduplicated");
eventFirst.close();
for (const mode of ["failure", "uncertain"]) {
  const failed = await setup({ mode });
  await failed.draft("/entorno No confirmado");
  await failed.execute();
  ok(
    failed.items().length === 0,
    "Failed or uncertain execution is not logged: " + mode,
  );
  failed.close();
}
const old = await setup({ version: 1 });
await old.draft("/entorno Puente sin eventos");
await old.execute();
ok(old.items().length === 1, "Button history works with an old bridge");
old.close();

const bounded = await setup();
for (let n = 0; n < 110; n++)
  bounded.w.recordConfirmedSend({
    text: "/entorno Entrada " + n,
    source: "hotkey",
    session: token,
    sequence: n + 1,
  });
ok(
  bounded.items().length === 100 &&
    bounded.items()[0].text.endsWith("109") &&
    bounded.items()[99].text.endsWith("10"),
  "Keeps the newest 100 entries",
);
bounded.w.recordConfirmedSend({
  text: "/entorno <img src=x onerror=alert(1)>",
  source: "hotkey",
  session: token,
  sequence: 111,
});
ok(
  !bounded.d.querySelector("#sent-history-list img") &&
    bounded.items()[0].text.includes("<img"),
  "History text cannot insert HTML",
);
const before = bounded.w.localStorage.getItem(key);
const proto = Object.getPrototypeOf(bounded.w.localStorage),
  originalSet = proto.setItem;
proto.setItem = () => {
  throw Error("quota");
};
bounded.w.recordConfirmedSend({
  text: "/entorno Solo en memoria",
  source: "hotkey",
  session: token,
  sequence: 112,
});
ok(
  bounded.w.localStorage.getItem(key) === before &&
    bounded.d
      .getElementById("sent-history-status")
      .textContent.includes("no se ha podido guardar"),
  "Storage errors preserve the old persisted log",
);
proto.setItem = originalSet;
bounded.w.localStorage.setItem("entorno-favs", '["massacro"]');
bounded.w.localStorage.setItem("entorno-configs-v2", "[]");
bounded.confirm(false);
bounded.d.getElementById("sent-history-clear").click();
ok(bounded.items().length === 100, "Cancelling clear keeps history");
bounded.confirm(true);
bounded.d.getElementById("sent-history-clear").click();
ok(
  bounded.items().length === 0 &&
    bounded.w.localStorage.getItem("entorno-favs") === '["massacro"]' &&
    bounded.w.localStorage.getItem("entorno-configs-v2") === "[]",
  "Clear leaves presets and favorites intact",
);
bounded.w.recordConfirmedSend({
  text: "/entorno Solo en memoria",
  source: "hotkey",
  session: token,
  sequence: 112,
});
ok(bounded.items().length === 0, "Clearing history does not replay old events");
bounded.close();
const corrupt = await setup({ storage: { [key]: "invalid-json" } });
corrupt.w.recordConfirmedSend({
  text: "/entorno Nuevo sin sobrescribir",
  source: "hotkey",
  session: token,
  sequence: 1,
});
ok(
  corrupt.w.localStorage.getItem(key) === "invalid-json" &&
    corrupt.d.querySelectorAll("#sent-history-list > li").length === 1,
  "Corrupt history is preserved while new sends remain visible",
);
corrupt.confirm(true);
corrupt.d.getElementById("sent-history-clear").click();
ok(
  corrupt.w.localStorage.getItem(key) === null,
  "Explicit clear can recover an unreadable history",
);
corrupt.close();
ok(
  hotkey.errors.length === 0 &&
    manual.errors.length === 0 &&
    bounded.errors.length === 0,
  "No history runtime errors",
);
console.log(
  "PASS: " +
    checks +
    " comprobaciones de historial: atajo sin rotación, botón, confirmación, fallos, duplicados, persistencia, límite, copia, borrado y texto seguro. Sin envíos reales.",
);

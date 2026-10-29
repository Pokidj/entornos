// The history stores text and UI metadata only. Bridge sessions stay in memory.
const sentHistoryKey = "entorno-sent-history-v1";
const sentHistoryLimit = 100;
const sentHistoryDateFormat = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "medium",
});
let sentHistory = [],
  sentHistoryReadable = true;
const seenSendEvents = new Set();
let manualSendReceipts = [];
function validSentText(text) {
  return (
    typeof text === "string" &&
    text.length <= 12000 &&
    /^\/entorno\s+\S/i.test(text.trim())
  );
}
function historyMessage(text) {
  $("sent-history-status").textContent = text;
}
try {
  const stored = JSON.parse(localStorage.getItem(sentHistoryKey) || "[]");
  if (
    !Array.isArray(stored) ||
    stored.some(
      (entry) =>
        !entry ||
        typeof entry.id !== "string" ||
        entry.id.length > 100 ||
        !validSentText(entry.text) ||
        !["button", "hotkey"].includes(entry.via) ||
        typeof entry.at !== "string" ||
        !Number.isFinite(Date.parse(entry.at)),
    )
  )
    throw Error("Invalid history");
  sentHistory = stored
    .slice(0, sentHistoryLimit)
    .map(({ id, text, via, at }) => ({ id, text, via, at }));
  if (new Set(sentHistory.map((entry) => entry.id)).size !== sentHistory.length)
    throw Error("Duplicate IDs");
} catch {
  sentHistory = [];
  sentHistoryReadable = false;
  historyMessage(
    "No se pudo leer el historial guardado. Los envíos nuevos se mostrarán sin sobrescribir esos datos.",
  );
}
function persistSentHistory() {
  if (!sentHistoryReadable) return false;
  try {
    localStorage.setItem(sentHistoryKey, JSON.stringify(sentHistory));
    return true;
  } catch {
    historyMessage(
      "El historial se muestra, pero no se ha podido guardar en este navegador.",
    );
    return false;
  }
}
function renderSentHistory() {
  $("sent-history-count").textContent =
    sentHistory.length + (sentHistory.length === 1 ? " envío" : " envíos");
  $("sent-history-empty").hidden = sentHistory.length > 0;
  $("sent-history-clear").disabled =
    sentHistory.length === 0 && sentHistoryReadable;
  $("sent-history-list").replaceChildren(
    ...sentHistory.map((entry) => {
      const item = document.createElement("li"),
        detail = document.createElement("details"),
        summary = document.createElement("summary");
      const time = document.createElement("time");
      time.dateTime = entry.at;
      time.textContent = sentHistoryDateFormat.format(new Date(entry.at));
      const source = document.createElement("span");
      source.className = "sent-source";
      source.textContent =
        entry.via === "hotkey" ? "Atajo del puente" : "Botón web";
      const preview = document.createElement("span");
      preview.className = "sent-preview";
      preview.textContent =
        entry.text.length > 160 ? entry.text.slice(0, 157) + "…" : entry.text;
      const text = document.createElement("p");
      text.className = "sent-text";
      text.textContent = entry.text;
      const copy = document.createElement("button");
      copy.type = "button";
      copy.textContent = "Copiar texto";
      copy.setAttribute("aria-label", "Copiar envío del " + time.textContent);
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(entry.text);
          historyMessage("Texto del envío copiado al portapapeles.");
        } catch {
          historyMessage(
            "No se pudo copiar. Abre el envío y selecciona su texto para copiarlo manualmente.",
          );
        }
      };
      summary.append(time, source, preview);
      detail.append(summary, text, copy);
      item.append(detail);
      return item;
    }),
  );
}
function addSentEntry(text, via) {
  const entry = {
    id:
      globalThis.crypto?.randomUUID?.() ||
      "sent-" +
        Date.now().toString(36) +
        "-" +
        Math.random().toString(36).slice(2),
    at: new Date().toISOString(),
    text: text.trim(),
    via,
  };
  sentHistory = [entry, ...sentHistory].slice(0, sentHistoryLimit);
  if (persistSentHistory()) historyMessage("Envío registrado en el historial.");
  renderSentHistory();
  return entry.id;
}
function recordConfirmedSend({
  text,
  source,
  session,
  sequence,
  acknowledgement = false,
}) {
  if (
    !validSentText(text) ||
    !["web", "hotkey"].includes(source) ||
    typeof session !== "string" ||
    !session ||
    (acknowledgement && source !== "web")
  )
    return null;
  const now = Date.now();
  if (!acknowledgement) {
    if (!Number.isSafeInteger(sequence) || sequence < 1) return null;
    const key = session + ":" + sequence;
    if (seenSendEvents.has(key)) return null;
    seenSendEvents.add(key);
    // Bounded replay protection; no session value is written to storage or the DOM.
    if (seenSendEvents.size > 1000)
      seenSendEvents.delete(seenSendEvents.values().next().value);
  }
  manualSendReceipts = manualSendReceipts.filter(
    (receipt) => now - receipt.at < 60000,
  );
  if (source === "web") {
    const opposite = acknowledgement ? "response" : "event";
    const index = manualSendReceipts.findIndex(
      (receipt) =>
        receipt.waitingFor === opposite &&
        receipt.session === session &&
        receipt.text === text,
    );
    if (index >= 0) return manualSendReceipts.splice(index, 1)[0].id;
    const id = addSentEntry(text, "button");
    manualSendReceipts.push({
      id,
      session,
      text,
      at: now,
      waitingFor: acknowledgement ? "event" : "response",
    });
    manualSendReceipts = manualSendReceipts.slice(-100);
    return id;
  }
  return addSentEntry(text, "hotkey");
}
$("sent-history-clear").onclick = () => {
  if (
    !window.confirm(
      "¿Vaciar el historial de envíos de este navegador? Los entornos guardados y favoritos se conservan.",
    )
  )
    return;
  try {
    localStorage.removeItem(sentHistoryKey);
  } catch {
    historyMessage(
      "No se pudo vaciar el historial guardado. Comprueba los permisos del navegador.",
    );
    return;
  }
  sentHistory = [];
  sentHistoryReadable = true;
  historyMessage("Historial vaciado.");
  renderSentHistory();
};
$("history-jump").onclick = (event) => {
  event.preventDefault();
  const panel = $("sent-history");
  panel.open = true;
  panel.scrollIntoView({
    block: "start",
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
  panel.querySelector("summary").focus({ preventScroll: true });
};
renderSentHistory();

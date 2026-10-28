const bridgeURL = "http://127.0.0.1:39173";
let bridgeToken = "",
  bridgeConnected = false,
  bridgeBusy = false,
  bridgeChecking = false;
let bridgeState = null,
  preparedText = null,
  preparedToken = "",
  preparing = false;
let prepareTimer,
  bridgeTimer,
  prepareError = "";
let eventSequence = 0,
  eventSession = "",
  eventLoopRunning = false,
  eventController = null,
  autoNeedsBaseline = true;
const autoVersion = document.createElement("label");
autoVersion.className = "auto-version hint";
autoVersion.hidden = true;
const autoVersionInput = document.createElement("input");
autoVersionInput.type = "checkbox";
autoVersionInput.id = "auto-version";
try {
  autoVersionInput.checked =
    localStorage.getItem("entorno-auto-version") === "true";
} catch {}
const autoVersionText = document.createElement("span");
autoVersionText.textContent = "Generar otra versión después de usar el atajo";
autoVersion.append(autoVersionInput, autoVersionText);
const bridgeDownload = document.querySelector(".bridge-download");
let localCspBlocked = false;
const bridgeConnect = document.createElement("button");
bridgeConnect.type = "button";
bridgeConnect.id = "connect-bridge";
bridgeConnect.textContent = "Conectar puente";
const connectionMessage = document.createElement("p");
connectionMessage.id = "bridge-connection-message";
connectionMessage.className = "hint";
connectionMessage.setAttribute("role", "status");
connectionMessage.setAttribute("aria-live", "polite");
const connectionControls = document.createElement("div");
connectionControls.className = "bridge-connect-controls";
connectionControls.append(bridgeConnect, connectionMessage);
if (bridgeDownload) {
  const content = bridgeDownload.querySelector("div");
  content.insertBefore(connectionControls, content.querySelector("details"));
}
function connectionFeedback(message) {
  if (connectionMessage.textContent !== message)
    connectionMessage.textContent = message;
}
function bridgeConnectionError(error) {
  if (localCspBlocked)
    return "La política de esta página bloquea la conexión local. Prueba la web en una pestaña de Chrome o Edge.";
  if (error.status === 403)
    return "El puente rechazó la dirección de esta web. Revisa el dominio autorizado en configuracion.json y reinicia el puente.";
  if (error.code === "bridge-identity")
    return "El servicio local no es una versión compatible del puente. Actualiza Puente Entorno.";
  if (error.status)
    return `El puente respondió con error ${error.status}. Comprueba su estado e inténtalo de nuevo.`;
  if (error.name === "AbortError" || error.name === "TimeoutError")
    return "El puente no respondió a tiempo. Comprueba que esté abierto y permite el acceso a la red local si el navegador lo solicita.";
  return "No se puede conectar con el puente. Si está abierto, permite a esta web acceder a la red local en este navegador y pulsa «Conectar puente». Si el navegador no ofrece ese permiso, prueba Chrome o Edge.";
}
bridgeConnect.onclick = () => checkBridge({ manual: true });
document.addEventListener("securitypolicyviolation", (event) => {
  if (
    typeof event.blockedURI === "string" &&
    (event.blockedURI === bridgeURL ||
      event.blockedURI.startsWith(bridgeURL + "/"))
  ) {
    localCspBlocked = true;
    connectionFeedback(bridgeConnectionError({}));
  }
});
const localFetchOptions = (() => {
  try {
    const request = new Request(bridgeURL + "/health", {
      targetAddressSpace: "loopback",
    });
    return request.targetAddressSpace === "loopback"
      ? { targetAddressSpace: "loopback" }
      : {};
  } catch {
    return {};
  }
})();
function bridgeTimeout(milliseconds) {
  if (
    typeof AbortSignal !== "undefined" &&
    typeof AbortSignal.timeout === "function"
  )
    return AbortSignal.timeout(milliseconds);
  const controller = new AbortController();
  setTimeout(() => controller.abort(), milliseconds);
  return controller.signal;
}
const executeButton = document.createElement("button");
executeButton.type = "button";
executeButton.id = "execute-fivem";
executeButton.textContent = "Ejecutar en FiveM";
executeButton.hidden = true;
executeButton.disabled = true;
const bridgeStatus = document.createElement("div");
bridgeStatus.id = "bridge-status";
bridgeStatus.className = "hint";
bridgeStatus.setAttribute("role", "status");
bridgeStatus.setAttribute("aria-live", "polite");
bridgeStatus.hidden = true;
document.querySelector(".copy-bottom .actions").append(executeButton);
document.querySelector(".copy-notes").append(bridgeStatus);
document.querySelector(".copy-notes").append(autoVersion);
autoVersionInput.onchange = () => {
  try {
    localStorage.setItem(
      "entorno-auto-version",
      String(autoVersionInput.checked),
    );
  } catch {}
  autoNeedsBaseline = true;
  eventController?.abort();
  checkBridge();
};
function supportsSendEvents() {
  return bridgeState?.capabilities?.includes("send-events") === true;
}
function handleSendEvent(event) {
  if (
    !event ||
    !Number.isSafeInteger(event.sequence) ||
    event.sequence <= eventSequence
  )
    return;
  eventSequence = event.sequence;
  if (
    !autoVersionInput.checked ||
    event.source !== "hotkey" ||
    event.text !== currentDraft()
  )
    return;
  if ($("situation").value === "") return;
  const previous = currentDraft();
  // Generate uses the current parameters; it never sends a command.
  for (let attempt = 0; attempt < 6 && currentDraft() === previous; attempt++)
    generate();
  queuePreparation();
}
async function watchSendEvents() {
  if (
    eventLoopRunning ||
    !autoVersionInput.checked ||
    !supportsSendEvents() ||
    !bridgeToken ||
    autoNeedsBaseline
  )
    return;
  eventLoopRunning = true;
  const token = bridgeToken;
  let failed = false;
  try {
    while (
      autoVersionInput.checked &&
      supportsSendEvents() &&
      bridgeToken === token &&
      !autoNeedsBaseline
    ) {
      eventController = new AbortController();
      const timeout = setTimeout(() => eventController?.abort(), 24000);
      let response;
      try {
        response = await bridgeFetch("/events", {
          method: "POST",
          signal: eventController.signal,
          headers: {
            "Content-Type": "application/json",
            "X-Entorno-Token": token,
          },
          body: JSON.stringify({ after: eventSequence }),
        });
      } finally {
        clearTimeout(timeout);
      }
      if (!response.ok) throw Error("Eventos no disponibles");
      const data = await response.json();
      if (bridgeToken !== token || autoNeedsBaseline) break;
      handleSendEvent(data.event);
      await syncPreparedDraft();
    }
  } catch {
    failed = true;
  } finally {
    eventLoopRunning = false;
    eventController = null;
    if (autoVersionInput.checked && bridgeToken && supportsSendEvents()) {
      if (failed || autoNeedsBaseline) setTimeout(checkBridge, 1500);
      else watchSendEvents();
    }
  }
}
function currentDraft() {
  return $("output")
    .textContent.trim()
    .replace(/[\r\n\t]+/g, " ");
}
function supportsHotkey() {
  return bridgeState?.capabilities?.includes("prepare") === true;
}
function draftAlreadySent() {
  return (
    supportsHotkey() &&
    preparedText === currentDraft() &&
    bridgeState?.preparation?.sent === true
  );
}
function refreshExecuteState() {
  executeButton.disabled =
    !bridgeConnected ||
    bridgeBusy ||
    !currentDraft().startsWith("/entorno ") ||
    draftAlreadySent();
  autoVersion.hidden =
    !supportsSendEvents() || executeButton.hidden || executeButton.disabled;
}
function renderBridgeStatus() {
  if (!bridgeState) return;
  let text = bridgeConnected
    ? "Puente conectado · Consola de FiveM disponible"
    : "Puente conectado · Abre FiveM y entra a tu servidor";
  if (supportsHotkey()) {
    const hotkey = bridgeState.hotkey || {};
    if (hotkey.error) text += " · " + hotkey.error;
    else if (!hotkey.configured) text += " · Atajo desactivado";
    else if (hotkey.active)
      text +=
        " · Atajo " +
        hotkey.configured +
        (draftAlreadySent()
          ? " · Entorno ya enviado"
          : currentDraft() && preparedText === currentDraft()
            ? " · Entorno preparado"
            : " · Sin entorno preparado");
    else text += " · Atajo no disponible";
  } else text += " · Actualiza el puente para usar atajos";
  bridgeStatus.textContent = prepareError || text;
}
async function bridgeFetch(path, options = {}) {
  const { timeoutMs = 3000, ...requestOptions } = options;
  return fetch(bridgeURL + path, {
    ...localFetchOptions,
    ...requestOptions,
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
    signal: requestOptions.signal ?? bridgeTimeout(timeoutMs),
  });
}
async function syncPreparedDraft() {
  if (!supportsHotkey() || !bridgeToken || preparing || bridgeBusy) return;
  if (preparedText === currentDraft() && preparedToken === bridgeToken) return;
  preparing = true;
  try {
    while (supportsHotkey() && bridgeToken && !bridgeBusy) {
      const text = currentDraft(),
        token = bridgeToken;
      if (text && !text.startsWith("/entorno ")) {
        prepareError = "El texto debe comenzar por /entorno para prepararlo.";
        break;
      }
      const response = await bridgeFetch("/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Entorno-Token": token,
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (token !== bridgeToken) continue;
      if (!response.ok || !data.ok)
        throw Error(data.error || "No se pudo preparar el atajo.");
      preparedText = text;
      preparedToken = token;
      prepareError = "";
      bridgeState.preparation = { ready: data.ready, sent: data.sent };
      if (currentDraft() === text) break;
    }
  } catch (error) {
    prepareError =
      error.name === "TimeoutError" || error.name === "AbortError" || error instanceof TypeError
        ? "No se ha podido preparar el atajo. Revisa el puente."
        : error.message;
  } finally {
    preparing = false;
    refreshExecuteState();
    if (!bridgeBusy) renderBridgeStatus();
  }
}
async function checkBridge(options = {}) {
  if (bridgeBusy || bridgeChecking) return;
  bridgeChecking = true;
  bridgeConnect.disabled = true;
  if (options.manual === true) {
    bridgeConnect.textContent = "Conectando…";
    connectionFeedback(
      "Comprobando el puente. Si aparece una solicitud de acceso a la red local, permite la conexión para esta web.",
    );
  }
  try {
    const response = await bridgeFetch("/health", {
      timeoutMs: options.manual === true ? 20000 : 3000,
    });
    if (!response.ok)
      throw Object.assign(Error("HTTP"), { status: response.status });
    const data = await response.json();
    if (
      data.bridge !== "entorno-fivem" ||
      ![1, 2].includes(data.version) ||
      typeof data.token !== "string"
    )
      throw Object.assign(Error("Bridge identity"), {
        code: "bridge-identity",
      });
    if (bridgeToken !== data.token) {
      preparedText = null;
      preparedToken = "";
      eventController?.abort();
    }
    bridgeToken = data.token;
    bridgeConnected = data.connected === true;
    bridgeState = data;
    connectionFeedback("Puente detectado.");
    if (eventSession !== data.token || autoNeedsBaseline) {
      eventSequence = Number.isSafeInteger(data.sequence) ? data.sequence : 0;
      eventSession = data.token;
      autoNeedsBaseline = false;
    }
    if (bridgeDownload) bridgeDownload.hidden = true;
    executeButton.hidden = false;
    bridgeStatus.hidden = false;
    await syncPreparedDraft();
    renderBridgeStatus();
    watchSendEvents();
  } catch (error) {
    bridgeConnected = false;
    bridgeToken = "";
    bridgeState = null;
    preparedText = null;
    preparedToken = "";
    executeButton.hidden = true;
    bridgeStatus.hidden = true;
    autoVersion.hidden = true;
    if (bridgeDownload) bridgeDownload.hidden = false;
    connectionFeedback(bridgeConnectionError(error));
    eventController?.abort();
  } finally {
    bridgeChecking = false;
    bridgeConnect.disabled = false;
    bridgeConnect.textContent = "Conectar puente";
    refreshExecuteState();
  }
}
executeButton.onclick = async () => {
  if (executeButton.disabled) return;
  const text = currentDraft();
  if (
    !window.confirm(
      "¿Quieres enviar este entorno a FiveM? Se ejecutará en el servidor donde estás conectado.\n\n" +
        text,
    )
  )
    return;
  if (!bridgeConnected || bridgeBusy) return;
  bridgeBusy = true;
  refreshExecuteState();
  bridgeStatus.textContent = "Enviando a FiveM…";
  try {
    const response = await bridgeFetch("/execute", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Entorno-Token": bridgeToken,
      },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (supportsHotkey() && data.sent) {
      preparedText = text;
      preparedToken = bridgeToken;
      bridgeState.preparation = { ready: false, sent: true };
    }
    if (!response.ok || !data.ok)
      throw Error(data.error || "No se ha podido enviar.");
    bridgeStatus.textContent =
      "Enviado a la consola. Prepara un entorno nuevo para volver a enviar.";
  } catch (error) {
    bridgeStatus.textContent =
      error.name === "TimeoutError" || error.name === "AbortError" || error instanceof TypeError
        ? "No se pudo confirmar el envío. Comprueba el juego antes de repetir."
        : error.message || "No se ha podido conectar con el puente.";
  } finally {
    setTimeout(() => {
      bridgeBusy = false;
      refreshExecuteState();
      syncPreparedDraft();
    }, 2200);
  }
};
function queuePreparation() {
  refreshExecuteState();
  clearTimeout(prepareTimer);
  prepareTimer = setTimeout(syncPreparedDraft, 180);
}
new MutationObserver(queuePreparation).observe($("output"), {
  childList: true,
  subtree: true,
  characterData: true,
});
function scheduleBridgeCheck() {
  clearTimeout(bridgeTimer);
  bridgeTimer = setTimeout(async () => {
    if (!document.hidden) await checkBridge();
    scheduleBridgeCheck();
  }, 8000);
}
window.addEventListener("focus", checkBridge);
window.addEventListener("blur", () => {
  clearTimeout(prepareTimer);
  syncPreparedDraft();
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearTimeout(prepareTimer);
    syncPreparedDraft();
  } else checkBridge();
});
checkBridge();
scheduleBridgeCheck();

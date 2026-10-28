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
document.querySelector(".copy-bottom").append(bridgeStatus);
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
  return fetch(bridgeURL + path, {
    ...options,
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(3000),
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
      error.name === "TimeoutError" || error instanceof TypeError
        ? "No se ha podido preparar el atajo. Revisa el puente."
        : error.message;
  } finally {
    preparing = false;
    refreshExecuteState();
    if (!bridgeBusy) renderBridgeStatus();
  }
}
async function checkBridge() {
  if (bridgeBusy || bridgeChecking) return;
  bridgeChecking = true;
  try {
    const response = await bridgeFetch("/health");
    if (!response.ok) throw Error();
    const data = await response.json();
    if (
      data.bridge !== "entorno-fivem" ||
      ![1, 2].includes(data.version) ||
      typeof data.token !== "string"
    )
      throw Error();
    if (bridgeToken !== data.token) {
      preparedText = null;
      preparedToken = "";
    }
    bridgeToken = data.token;
    bridgeConnected = data.connected === true;
    bridgeState = data;
    executeButton.hidden = false;
    bridgeStatus.hidden = false;
    await syncPreparedDraft();
    renderBridgeStatus();
  } catch {
    bridgeConnected = false;
    bridgeToken = "";
    bridgeState = null;
    preparedText = null;
    preparedToken = "";
    executeButton.hidden = true;
    bridgeStatus.hidden = true;
  } finally {
    bridgeChecking = false;
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
      error.name === "TimeoutError" || error instanceof TypeError
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

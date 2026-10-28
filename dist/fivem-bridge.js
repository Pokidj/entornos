const bridgeURL = "http://127.0.0.1:39173";
let bridgeToken = "",
  bridgeConnected = false,
  bridgeBusy = false,
  bridgeChecking = false,
  bridgeTimer;
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
function refreshExecuteState() {
  executeButton.disabled =
    !bridgeConnected ||
    bridgeBusy ||
    !$("output").textContent.trim().startsWith("/entorno ");
}
async function bridgeFetch(path, options = {}) {
  return fetch(bridgeURL + path, {
    ...options,
    mode: "cors",
    cache: "no-store",
    credentials: "omit",
    signal: AbortSignal.timeout(2500),
  });
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
      data.version !== 1 ||
      typeof data.token !== "string"
    )
      throw Error();
    bridgeToken = data.token;
    bridgeConnected = data.connected === true;
    executeButton.hidden = false;
    bridgeStatus.hidden = false;
    bridgeStatus.textContent = bridgeConnected
      ? "Puente conectado · Consola de FiveM disponible"
      : "Puente conectado · Abre FiveM y entra a tu servidor";
  } catch {
    bridgeConnected = false;
    bridgeToken = "";
    executeButton.hidden = true;
    bridgeStatus.hidden = true;
  } finally {
    bridgeChecking = false;
  }
  refreshExecuteState();
}
executeButton.onclick = async () => {
  if (executeButton.disabled) return;
  const text = $("output")
    .textContent.trim()
    .replace(/[\r\n\t]+/g, " ");
  if (!window.confirm("¿Quieres enviar este entorno a FiveM? Se ejecutará en el servidor donde estás conectado.\n\n" + text)) return;
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
    if (!response.ok || !data.ok)
      throw Error(data.error || "No se ha podido enviar.");
    bridgeStatus.textContent =
      "Enviado a la consola. Comprueba el entorno en el juego.";
  } catch (error) {
    bridgeStatus.textContent =
      error.name === "TimeoutError" || error instanceof TypeError
        ? "No se pudo confirmar el envío. Comprueba el juego antes de repetir."
        : error.message || "No se ha podido conectar con el puente.";
  } finally {
    setTimeout(() => {
      bridgeBusy = false;
      refreshExecuteState();
    }, 2200);
  }
};
new MutationObserver(refreshExecuteState).observe($("output"), {
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
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) checkBridge();
});
checkBridge();
scheduleBridgeCheck();

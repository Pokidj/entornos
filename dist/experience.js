// Small, local guidance. No tour overlays and no persisted onboarding state.
const guideToggle = $("guide-toggle");
const usageGuide = $("usage-guide");
function setGuide(open) {
  usageGuide.hidden = !open;
  guideToggle.setAttribute("aria-expanded", String(open));
}
guideToggle.onclick = () => setGuide(usageGuide.hidden);
guideToggle.onkeydown = (event) => {
  if (event.key === "Escape") setGuide(false);
};
function focusGuideTarget(id) {
  setGuide(false);
  const section = $(id);
  const target =
    (id === "result" ? section : $(id + "-search-input")) ||
    section?.querySelector("button") ||
    section;
  if (id === "result" && section) section.tabIndex = -1;
  section?.scrollIntoView({
    block: "center",
    behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
  });
  target?.focus({ preventScroll: true });
}
document.querySelectorAll("[data-guide-target]").forEach((button) => {
  button.onclick = (event) => {
    event.stopPropagation();
    focusGuideTarget(button.dataset.guideTarget);
  };
});
usageGuide.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setGuide(false);
    guideToggle.focus();
  }
});
document.querySelectorAll("[data-quick-action]").forEach((button) => {
  button.onclick = (event) => {
    event.stopPropagation();
    $("scene-action").value = button.dataset.quickAction;
    $("scene-action").dispatchEvent(new Event("change", { bubbles: true }));
    focusGuideTarget("situation-search");
  };
});
function syncExperience() {
  const action = selectedSceneAction();
  const validCount =
    !$("manual-number").value ||
    /^[1-9]\d{0,2}$/.test($("manual-number").value);
  const message = !validCount
    ? "Revisa la cantidad: escribe un número entre 1 y 999."
    : !action
      ? "Elige qué está pasando. Puedes concretarlo después."
      : $("situation").value === action.index
        ? action.label +
          " · aviso general. Añade solo los detalles que puedas ver."
        : "Escena definida. Completa lo que ves o copia el entorno cuando quieras.";
  if ($("flow-hint").textContent !== message)
    $("flow-hint").textContent = message;
  $("empty-guide").hidden = Boolean($("output").textContent.trim());
  $("generate").disabled = !action || !validCount;
}
const countWithExperience = count;
count = function () {
  countWithExperience();
  syncExperience();
};
$("output").oninput = count;
syncExperience();

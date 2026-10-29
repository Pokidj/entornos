let situationOpen = false,
  situationActive = -1;
const originalRenderSituations = renderSituations;
function situationItems() {
  return [...$("situation").options].filter(
    (o) => o.value !== "" && !o.textContent.startsWith("Seleccionado:"),
  );
}
function drawSituationList() {
  const box = $("situation-list");
  box.replaceChildren();
  const options = situationItems();
  $("situation-use-custom").hidden =
    !selectedSceneAction() ||
    !cleanCustomSituation($("situation-search").value);
  options.forEach((option, i) => {
    const row = document.createElement("div");
    row.id = "situation-option-" + i;
    row.className =
      "situation-option" + (i === situationActive ? " active" : "");
    row.setAttribute("role", "option");
    row.setAttribute(
      "aria-selected",
      String(option.value === $("situation").value),
    );
    row.textContent = option.textContent;
    row.onmousedown = (e) => e.preventDefault();
    row.onclick = () => selectSituation(option.value);
    box.append(row);
  });
  if (!options.length) {
    const empty = document.createElement("div");
    empty.className = "situation-option";
    empty.textContent =
      "Sin coincidencias. Puedes usar tu texto como situación.";
    box.append(empty);
  }
  if (situationActive >= 0)
    $("situation-search").setAttribute(
      "aria-activedescendant",
      "situation-option-" + situationActive,
    );
  else $("situation-search").removeAttribute("aria-activedescendant");
}
renderSituations = function () {
  originalRenderSituations();
  if ($("situation-list")) drawSituationList();
};
function syncSituationLabel() {
  $("situation-search").value =
    $("situation").value === ""
      ? ""
      : $("situation").value === "custom"
        ? customSituation
        : $("situation").value === selectedSceneAction()?.index
          ? ""
          : detailLabel(situations[+$("situation").value][0]);
  $("situation-clear").hidden =
    $("situation").value === "" ||
    $("situation").value === selectedSceneAction()?.index;
  $("situation-search").placeholder = selectedSceneAction()
    ? "Sin detalle · aviso general"
    : "Elige primero una acción…";
}
function openSituation() {
  document.dispatchEvent(
    new CustomEvent("close-unified-selects", { detail: $("situation-combo") }),
  );
  situationOpen = true;
  situationActive = -1;
  $("situation-search").value = "";
  $("situation-popup").hidden = false;
  $("situation-search").setAttribute("aria-expanded", "true");
  renderSituations();
}
function closeSituation() {
  situationOpen = false;
  situationActive = -1;
  $("situation-popup").hidden = true;
  $("situation-search").setAttribute("aria-expanded", "false");
  $("situation-search").removeAttribute("aria-activedescendant");
  syncSituationLabel();
}
function selectSituation(value) {
  if (value !== "custom") customSituation = "";
  $("situation").value = value;
  closeSituation();
  $("situation").dispatchEvent(new Event("change", { bubbles: true }));
}
$("scene-action").addEventListener("change", () => {
  customSituation = "";
  $("situation").value = "";
  $("situation-search").value = "";
  renderSituations();
  selectSituation(selectedSceneAction()?.index || "");
});
$("situation-search").onfocus = () => {
  if (!situationOpen) openSituation();
};
$("situation-search").onclick = () => {
  if (!situationOpen) openSituation();
};
$("situation-search").oninput = () => {
  if (!situationOpen) {
    situationOpen = true;
    $("situation-popup").hidden = false;
    $("situation-search").setAttribute("aria-expanded", "true");
  }
  situationActive = -1;
  renderSituations();
};
$("situation-search").onkeydown = (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    closeSituation();
    return;
  }
  if (e.key === "Tab") {
    if (!e.shiftKey && situationOpen && !$("situation-use-custom").hidden) {
      e.preventDefault();
      $("situation-use-custom").focus();
    } else closeSituation();
    return;
  }
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!situationOpen) openSituation();
    const size = situationItems().length;
    if (size) {
      situationActive =
        situationActive < 0
          ? e.key === "ArrowDown"
            ? 0
            : size - 1
          : (situationActive + (e.key === "ArrowDown" ? 1 : -1) + size) % size;
      drawSituationList();
      $("situation-option-" + situationActive)?.scrollIntoView({
        block: "nearest",
      });
    }
  }
  if (e.key === "Enter") {
    e.preventDefault();
    if (!situationOpen) {
      openSituation();
      return;
    }
    const options = situationItems();
    if (options.length)
      selectSituation(options[Math.max(0, situationActive)].value);
    else useCustomSituation();
  }
};
function useCustomSituation() {
  const text = cleanCustomSituation($("situation-search").value);
  if (!text || !selectedSceneAction()) return;
  const words = text.match(/^(\S+)(.*)$/u),
    key = norm(words[1]);
  if (
    Object.hasOwn(customVerbs, key) ||
    /^(?:\S+ando|\S+iendo|\S+yendo)(?:\s|$)/iu.test(text)
  ) {
    $("scene-action").value = sceneActionFor(
      (customVerbs[key] || words[1]) + words[2],
    ).id;
  }
  customSituation = text;
  $("situation").querySelector('option[value="custom"]')?.remove();
  const option = document.createElement("option");
  option.value = "custom";
  option.textContent = text;
  $("situation").append(option);
  $("situation-search").focus();
  selectSituation("custom");
}
$("situation-use-custom").onclick = useCustomSituation;
$("situation-use-custom").onmousedown = (e) => e.preventDefault();
$("situation-toggle").onmousedown = (e) => e.preventDefault();
$("situation-toggle").onclick = () => {
  if (situationOpen) closeSituation();
  else {
    $("situation-search").focus();
    if (!situationOpen) openSituation();
  }
};
$("situation-clear").onmousedown = (e) => e.preventDefault();
$("situation-clear").onclick = () => {
  $("situation-search").value = "";
  renderSituations();
  selectSituation(selectedSceneAction()?.index || "");
  $("situation-search").blur();
};
document.addEventListener("click", (e) => {
  if (!$("situation-combo").contains(e.target)) closeSituation();
});
document.addEventListener("focusin", (e) => {
  if (!$("situation-combo").contains(e.target)) closeSituation();
});
$("situation").addEventListener("change", syncSituationLabel);
const previousClearConfig = clearConfig;
clearConfig = function () {
  previousClearConfig();
  closeSituation();
};
$("reset").onclick = clearConfig;
const previousLoadConfig = loadConfig;
loadConfig = function (data) {
  previousLoadConfig(data);
  closeSituation();
};
closeSituation();

document.addEventListener("close-unified-selects", (e) => {
  if (e.detail !== $("situation-combo")) closeSituation();
});

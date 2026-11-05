// Named configurations. The original five-slot store is kept as a migration backup.
const presetStorageKey = "entorno-configs-v2";
let savedPresets = [],
  activePresetId = null,
  deletedPreset = null,
  presetsReadable = true;
const presetNameKey = (name) =>
  name.trim().replace(/\s+/g, " ").toLocaleLowerCase("es");
const presetName = $("preset-name");
function presetMessage(text) {
  const status = $("slot-status");
  status.replaceChildren(document.createTextNode(text));
  if (deletedPreset) {
    const undo = document.createElement("button");
    undo.type = "button";
    undo.textContent = "Deshacer";
    undo.onclick = () => {
      const restored = {
        ...deletedPreset,
        name: uniquePresetName(deletedPreset.name),
      };
      if (!persistPresets([...savedPresets, restored])) return;
      deletedPreset = null;
      renderPresets();
      presetMessage("Configuración recuperada.");
    };
    status.append(undo);
  }
}
function uniquePresetName(name) {
  let result = name.slice(0, 40),
    i = 2;
  while (
    savedPresets.some((p) => presetNameKey(p.name) === presetNameKey(result))
  ) {
    const suffix = ` (${i++})`;
    result = name.slice(0, 40 - suffix.length) + suffix;
  }
  return result;
}
function persistPresets(next) {
  if (!presetsReadable) {
    presetMessage(
      "No se pudieron leer las configuraciones. Recarga antes de guardar.",
    );
    return false;
  }
  try {
    localStorage.setItem(presetStorageKey, JSON.stringify(next));
    savedPresets = next;
    return true;
  } catch {
    presetMessage(
      "No se ha podido guardar. Revisa el almacenamiento del navegador.",
    );
    return false;
  }
}
try {
  const current = localStorage.getItem(presetStorageKey);
  if (current !== null) {
    const parsed = JSON.parse(current);
    if (
      !Array.isArray(parsed) ||
      parsed.some(
        (p) =>
          !p ||
          typeof p.id !== "string" ||
          typeof p.name !== "string" ||
          !p.name.trim() ||
          !p.data ||
          typeof p.data !== "object" ||
          Array.isArray(p.data),
      ) ||
      new Set(parsed.map((p) => p.id)).size !== parsed.length
    )
      throw Error("Formato no válido");
    savedPresets = parsed;
  } else {
    const legacy = JSON.parse(
      localStorage.getItem("entorno-configs-v1") || "[]",
    );
    if (!Array.isArray(legacy)) throw Error("Formato anterior no válido");
    legacy.forEach((p, i) => {
      if (
        p &&
        typeof p === "object" &&
        p.data &&
        typeof p.data === "object" &&
        !Array.isArray(p.data)
      ) {
        const name =
          typeof p.name === "string" && p.name.trim()
            ? p.name.trim()
            : `Configuración ${i + 1}`;
        savedPresets.push({
          id: `legacy-${i}`,
          name: uniquePresetName(name),
          data: p.data,
        });
      }
    });
    if (savedPresets.length) persistPresets(savedPresets);
  }
} catch {
  presetsReadable = false;
}


function presetLabel(list, value) {
  return (typeof value === "string" || typeof value === "number") && /^\d+$/.test(String(value))
    ? list[Number(value)] || "" : "";
}
function presetSummary(data) {
  data = data && typeof data === "object" ? data : {};
  const quantity = (typeof data.number === "string" || typeof data.number === "number") && /^[1-9]\d{0,2}$/.test(String(data.number)) ? Number(data.number) : 0;
  const fields = data?.fields && typeof data.fields === "object" ? data.fields : {};
  const scene = presetLabel(situations, fields.situation);
  const action = sceneActions.find(a => a.id === fields["scene-action"]) || (scene ? sceneActionFor(scene[0]) : null);
  let title = action?.label || "Escena guardada";
  if (fields.situation === "custom" && typeof data.customSituation === "string")
    title += " · " + data.customSituation.slice(0, 160);
  else if (scene && String(fields.situation) !== action?.index)
    title += " · " + detailLabel(scene[0]);
  if (quantity)
    title = (data.numberMore ? "Más de " : "") + data.number + (String(data.number) === "1" ? " persona" : " personas") + " · " + title;
  const location = presetLabel(places, fields.place);
  if (location) title += " · " + location;
  let car = "Vehículo sin indicar";
  if (fields.travel === "foot") car = "A pie";
  else if (fields.travel === "unknown") car = "No se ha visto vehículo";
  else if (fields.travel === "vehicle") {
    const name = catalog.find(c => c.id === data.vehicleId)?.name ||
      (typeof data.vehicleName === "string" ? data.vehicleName.slice(0, 80) : "Vehículo guardado");
    const color = presetLabel(colors, fields.carcolor);
    car = name + (color ? " · " + color : "");
  }
  const describe = outfit => {
    if (!outfit || typeof outfit !== "object") return "";
    const face = presetLabel(faces, outfit.face);
    return [presetLabel(clothes, outfit.clothing), presetLabel(colors, outfit.clothcolor),
      face !== "sin detalle visible" ? face : ""].filter(Boolean).join(" · ");
  };
  const individual = data.wardrobe?.same === false &&
    (quantity > 1 || data.numberMore);
  const people = individual && Array.isArray(data.wardrobe?.people)
    ? data.wardrobe.people.slice(0, quantity).map(describe).filter(Boolean) : [];
  const shared = describe(fields);
  const clothing = individual
    ? people.length ? "Ropa individual: " + people.slice(0, 2).join(" / ") +
      (people.length > 2 ? ` · +${people.length - 2} más` : "") : "Ropa sin indicar"
    : shared ? "Ropa: " + shared : "Ropa sin indicar";
  return {scene: title, vehicle: car, wardrobe: clothing,
    search: [title, car, clothing, ...people].join(" ")};
}
const presetHoverTooltip = document.createElement("div");
presetHoverTooltip.id = "preset-hover-tooltip";
presetHoverTooltip.className = "preset-hover-tooltip";
presetHoverTooltip.hidden = true;
// Each button has its own accessible description; this is its visual duplicate.
presetHoverTooltip.setAttribute("aria-hidden", "true");
document.body.append(presetHoverTooltip);
let presetHoverAnchor = null, presetHoverTimer;
function hidePresetTooltip() {
  clearTimeout(presetHoverTimer);
  presetHoverTooltip.hidden = true;
  presetHoverAnchor = null;
}
function showPresetTooltip(button, name, summary) {
  clearTimeout(presetHoverTimer);
  presetHoverAnchor = button;
  const title = document.createElement("strong"); title.textContent = name;
  presetHoverTooltip.replaceChildren(title);
  for (const value of [summary.scene, summary.vehicle, summary.wardrobe]) {
    const row = document.createElement("p"); row.textContent = value;
    presetHoverTooltip.append(row);
  }
  const width = document.documentElement.clientWidth || window.innerWidth;
  presetHoverTooltip.style.width = Math.min(340, width - 24) + "px";
  presetHoverTooltip.hidden = false;
  const anchor = button.getBoundingClientRect(), tip = presetHoverTooltip.getBoundingClientRect();
  presetHoverTooltip.style.left = Math.max(12, Math.min(anchor.left, width - tip.width - 12)) + "px";
  const below = anchor.bottom + 8;
  presetHoverTooltip.style.top = (below + tip.height <= window.innerHeight - 12
    ? below : Math.max(12, anchor.top - tip.height - 8)) + "px";
}
function schedulePresetTooltipHide() {
  clearTimeout(presetHoverTimer);
  presetHoverTimer = setTimeout(() => {
    if (!presetHoverAnchor?.matches(":focus-visible")) hidePresetTooltip();
  }, 140);
}
presetHoverTooltip.onpointerenter = () => clearTimeout(presetHoverTimer);
presetHoverTooltip.onpointerleave = schedulePresetTooltipHide;
document.addEventListener("keydown", event => {if (event.key === "Escape") hidePresetTooltip();});
document.addEventListener("pointerdown", event => {
  if (!event.target.closest?.(".preset-shortcut") && !presetHoverTooltip.contains(event.target)) hidePresetTooltip();
});
window.addEventListener("resize", hidePresetTooltip);
window.addEventListener("scroll", event => {
  if (event.target !== presetHoverTooltip) hidePresetTooltip();
}, true);
function renderPresets() {
  hidePresetTooltip();
  const list = $("preset-list"), search = $("preset-search");
  list.replaceChildren();
  $("preset-count").textContent = `${savedPresets.length} guardado${savedPresets.length === 1 ? "" : "s"}`;
  search.hidden = savedPresets.length <= 6;
  if (search.hidden) search.value = "";
  const query = norm(search.value.trim());
  $("preset-actions").hidden = !savedPresets.some(p => p.id === activePresetId);
  $("preset-save").disabled = !presetsReadable;
  savedPresets.forEach((preset, index) => {
    const summary = presetSummary(preset.data);
    if (query && !norm(preset.name + " " + summary.search).includes(query)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-shortcut";
    button.dataset.presetId = preset.id;
    button.setAttribute("aria-label", preset.name);
    button.setAttribute("aria-pressed", String(preset.id === activePresetId));
    const name = document.createElement("strong"); name.textContent = preset.name;
    const details = document.createElement("span"); details.id = "preset-summary-" + index;
    details.className = "preset-summary-text";
    const scene = document.createElement("span"); scene.className = "preset-card-scene"; scene.textContent = summary.scene;
    const car = document.createElement("span"); car.className = "preset-card-car"; car.textContent = summary.vehicle;
    const wardrobe = document.createElement("span"); wardrobe.className = "preset-card-wardrobe"; wardrobe.textContent = summary.wardrobe;
    details.append(scene, car, wardrobe); button.append(name, details);
    button.setAttribute("aria-describedby", details.id);
    button.onpointerenter = event => {
      if (event.pointerType !== "touch") showPresetTooltip(button, preset.name, summary);
    };
    button.onpointerleave = schedulePresetTooltipHide;
    button.onfocus = () => showPresetTooltip(button, preset.name, summary);
    button.onblur = () => {if (presetHoverAnchor === button) hidePresetTooltip();};
    button.onclick = () => {
      loadConfig(preset.data);
      activePresetId = preset.id;
      renderPresets();
      presetMessage(`Cargado: ${preset.name}. Puedes actualizarlo, renombrarlo o eliminarlo.`);
      [...list.children].find(b => b.dataset.presetId === preset.id)?.focus({preventScroll:true});
    };
    list.append(button);
  });
  $("preset-empty").hidden = list.children.length > 0;
  $("preset-empty").textContent = savedPresets.length
    ? "No hay entornos que coincidan con la búsqueda."
    : "Prepara una escena y pulsa Guardar para tenerla aquí a un clic.";
}
const presetDialog = $("preset-dialog");
let presetDialogMode = "save", presetDialogId = null, presetDraft = null, presetReturnFocus = null;
function presetError(message) {
  $("preset-error").textContent = message;
  presetMessage(message);
}
function enteredPresetName(exceptId = null) {
  const name = presetName.value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 40) {
    presetError("Escribe un nombre de 1 a 40 caracteres."); presetName.focus(); return null;
  }
  if (savedPresets.some(p => p.id !== exceptId && presetNameKey(p.name) === presetNameKey(name))) {
    presetError("Ese nombre ya existe. Elige otro o cancela y usa Actualizar en el entorno guardado.");
    presetName.focus(); return null;
  }
  return name;
}
function validPresetScene() {
  if (!$("situation").value || !currentSituation() ||
    ($("manual-number").value && !/^[1-9]\d{0,2}$/.test($("manual-number").value))) {
    presetMessage("Elige una situación y una cantidad válida antes de guardar."); return false;
  }
  return true;
}
function capturePresetData() {
  const data = snapshot();
  if (vehicle?.name) data.vehicleName = vehicle.name;
  return data;
}
function openPresetDialog(mode = "save") {
  if (presetDialog.open || !presetsReadable) return;
  hidePresetTooltip();
  const selected = savedPresets.find(p => p.id === activePresetId);
  if (mode === "save" ? !validPresetScene() : !selected) return;
  presetDialogMode = mode; presetDialogId = mode === "rename" ? selected.id : null;
  presetDraft = mode === "rename" ? selected.data : capturePresetData();
  const summary = presetSummary(presetDraft);
  const preview = $("preset-dialog-summary"); preview.replaceChildren();
  for (const text of [summary.scene, summary.vehicle, summary.wardrobe]) {
    const p = document.createElement("p"); p.textContent = text; preview.append(p);
  }
  $("preset-dialog-title").textContent = mode === "rename" ? "Renombrar entorno" : "Guardar entorno";
  $("preset-confirm").textContent = mode === "rename" ? "Renombrar" : "Guardar";
  $("preset-error").textContent = "";
  presetName.value = mode === "rename" ? selected.name : uniquePresetName(summary.scene.replace(/^\d+ personas? · /, "").slice(0, 40));
  presetReturnFocus = document.activeElement;
  presetDialog.showModal(); presetName.focus(); presetName.select();
}
function closePresetDialog() { if (presetDialog.open) presetDialog.close(); }
presetDialog.addEventListener("cancel", event => {event.preventDefault(); closePresetDialog();});
presetDialog.addEventListener("close", () => {
  presetDraft = null;
  (presetReturnFocus?.isConnected ? presetReturnFocus : $("preset-save")).focus({preventScroll:true});
});
$("preset-save").onclick = () => openPresetDialog();
$("preset-rename").onclick = () => openPresetDialog("rename");
$("preset-cancel").onclick = closePresetDialog;
$("preset-search").oninput = renderPresets;
$("preset-dialog-form").onsubmit = event => {
  event.preventDefault();
  if (!presetDialog.open || !presetDraft) return;
  const name = enteredPresetName(presetDialogId);
  if (!name) return;
  let next, id;
  if (presetDialogMode === "rename") {
    if (!savedPresets.some(p => p.id === presetDialogId)) {
      presetError("Ese entorno ya no existe. Cancela y vuelve a seleccionarlo."); return;
    }
    id = presetDialogId; next = savedPresets.map(p => p.id === id ? {...p, name} : p);
  } else {
    id = globalThis.crypto?.randomUUID?.() || `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    next = [...savedPresets, {id, name, data: presetDraft}];
  }
  if (!persistPresets(next)) {presetError("No se ha podido guardar. Revisa el almacenamiento del navegador."); return;}
  activePresetId = id; $("preset-search").value = "";
  renderPresets();
  presetMessage((presetDialogMode === "rename" ? "Renombrado: " : "Guardado: ") + name);
  closePresetDialog();
};
$("preset-update").onclick = () => {
  if (!validPresetScene()) return;
  const current = savedPresets.find(p => p.id === activePresetId);
  if (!current) return;
  const data = capturePresetData();
  if (!persistPresets(savedPresets.map(p => p.id === current.id ? {...p, data} : p))) return;
  renderPresets(); presetMessage(`Actualizado: ${current.name}`);
};
$("preset-delete").onclick = () => {
  const current = savedPresets.find(p => p.id === activePresetId);
  if (!current || !persistPresets(savedPresets.filter(p => p.id !== current.id))) return;
  deletedPreset = current; activePresetId = null;
  renderPresets(); presetMessage(`Eliminado: ${current.name}`);
};
document.addEventListener("entorno:reset", () => {
  activePresetId = null;
  renderPresets(); presetMessage(deletedPreset ? "Entorno eliminado." : "");
});
renderPresets();
if (!presetsReadable) presetMessage("No se pudieron leer los entornos guardados. Los datos existentes no se han modificado.");

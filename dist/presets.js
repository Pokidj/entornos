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

function renderPresets() {
  const list = $("preset-list");
  list.replaceChildren();
  $("preset-count").textContent =
    `${savedPresets.length} guardada${savedPresets.length === 1 ? "" : "s"}`;
  $("preset-empty").hidden = savedPresets.length > 0;
  $("preset-actions").hidden = !savedPresets.some(
    (p) => p.id === activePresetId,
  );
  $("preset-save").disabled = !presetsReadable;
  savedPresets.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-shortcut";
    button.textContent = preset.name;
    button.title = `Cargar ${preset.name}`;
    button.setAttribute("aria-pressed", String(preset.id === activePresetId));
    button.onclick = () => {
      loadConfig(preset.data);
      activePresetId = preset.id;
      presetName.value = preset.name;
      renderPresets();
      presetMessage(`Cargada: ${preset.name}`);
      [...list.children]
        .find((b) => b.textContent === preset.name)
        ?.focus({ preventScroll: true });
    };
    list.append(button);
  });
}
function enteredPresetName(exceptId = null) {
  const name = presetName.value.trim().replace(/\s+/g, " ");
  if (!name || name.length > 40) {
    presetMessage("Escribe un nombre de 1 a 40 caracteres.");
    presetName.focus();
    return null;
  }
  if (
    savedPresets.some(
      (p) => p.id !== exceptId && presetNameKey(p.name) === presetNameKey(name),
    )
  ) {
    presetMessage(
      "Ese nombre ya existe. Carga su botón y usa Actualizar datos, o escribe otro nombre.",
    );
    presetName.focus();
    return null;
  }
  return name;
}
function validPresetScene() {
  if (
    !$("situation").value ||
    ($("manual-number").value &&
      !/^[1-9]\d{0,2}$/.test($("manual-number").value))
  ) {
    presetMessage(
      "Elige una situación y una cantidad válida antes de guardar.",
    );
    return false;
  }
  return true;
}
$("preset-save").onclick = () => {
  const name = enteredPresetName();
  if (!name || !validPresetScene()) return;
  const id =
    globalThis.crypto?.randomUUID?.() ||
    `preset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  if (!persistPresets([...savedPresets, { id, name, data: snapshot() }]))
    return;
  activePresetId = id;
  presetName.value = name;
  renderPresets();
  presetMessage(`Guardada: ${name}`);
};
presetName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    $("preset-save").click();
  }
});
$("preset-update").onclick = () => {
  if (!validPresetScene()) return;
  const current = savedPresets.find((p) => p.id === activePresetId);
  if (!current) return;
  if (
    !persistPresets(
      savedPresets.map((p) =>
        p.id === current.id ? { ...p, data: snapshot() } : p,
      ),
    )
  )
    return;
  presetName.value = current.name;
  presetMessage(`Datos actualizados: ${current.name}`);
};
$("preset-rename").onclick = () => {
  const current = savedPresets.find((p) => p.id === activePresetId);
  if (!current) return;
  const name = enteredPresetName(current.id);
  if (!name) return;
  if (
    !persistPresets(
      savedPresets.map((p) => (p.id === current.id ? { ...p, name } : p)),
    )
  )
    return;
  presetName.value = name;
  renderPresets();
  presetMessage(`Nuevo nombre: ${name}`);
};
$("preset-delete").onclick = () => {
  const current = savedPresets.find((p) => p.id === activePresetId);
  if (!current) return;
  if (!persistPresets(savedPresets.filter((p) => p.id !== current.id))) return;
  deletedPreset = current;
  activePresetId = null;
  presetName.value = "";
  renderPresets();
  presetMessage(`Eliminada: ${current.name}`);
};
document.addEventListener("entorno:reset", () => {
  activePresetId = null;
  presetName.value = "";
  renderPresets();
  presetMessage(deletedPreset ? "Configuración eliminada." : "");
});
renderPresets();
if (!presetsReadable)
  presetMessage(
    "No se pudieron leer las configuraciones. Los datos existentes no se han modificado.",
  );

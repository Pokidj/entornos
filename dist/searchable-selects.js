// Selectores con búsqueda: conservan los select originales para configuraciones y lógica.
const searchableSelects = new Map();
let nextSelectId = 0;
function enhanceSelect(select) {
  if (
    select.id === "situation" ||
    select.id === "travel" ||
    searchableSelects.has(select)
  )
    return;
  const lifecycle = new AbortController();
  const wrapper = document.createElement("div");
  wrapper.className = "unified-select";
  const entry = document.createElement("div");
  entry.className = "combo-entry";
  const input = document.createElement("input");
  input.type = "text";
  input.autocomplete = "off";
  input.placeholder = "Busca o selecciona…";
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-expanded", "false");
  const labelNode = select.labels?.[0];
  const label =
    labelNode?.textContent ||
    select.getAttribute("aria-label") ||
    "Seleccionar opción";
  input.setAttribute("aria-label", label.trim() + ": buscar y seleccionar");
  input.id = (select.id || "select-" + nextSelectId) + "-search-input";
  if (labelNode) labelNode.htmlFor = input.id;
  const popup = document.createElement("div");
  popup.className = "unified-popup";
  popup.hidden = true;
  const list = document.createElement("div");
  list.className = "unified-list";
  list.id = "unified-list-" + nextSelectId++;
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", label.trim());
  input.setAttribute("aria-controls", list.id);
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.tabIndex = -1;
  toggle.textContent = "⌄";
  toggle.setAttribute("aria-label", "Mostrar " + label.trim());
  entry.append(input, toggle);
  popup.append(list);
  select.before(wrapper);
  wrapper.append(entry, select, popup);
  select.hidden = true;
  let opened = false,
    active = -1,
    rows = [];
  function sync() {
    input.disabled = select.disabled;
    toggle.disabled = select.disabled;
    if (!opened) input.value = select.selectedOptions[0]?.textContent || "";
  }
  function draw() {
    const q = norm(input.value.trim());
    rows = [...select.options].filter(
      (o) => !o.disabled && (!q || norm(o.textContent).includes(q)),
    );
    list.replaceChildren();
    rows.forEach((o, i) => {
      const item = document.createElement("div");
      item.className = "situation-option" + (i === active ? " active" : "");
      item.id = list.id + "-" + i;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(select.value === o.value));
      item.textContent = o.textContent;
      item.onmousedown = (e) => e.preventDefault();
      item.onclick = () => choose(o);
      list.append(item);
    });
    if (!rows.length) {
      const empty = document.createElement("div");
      empty.className = "situation-option";
      empty.textContent = "Sin resultados";
      list.append(empty);
    }
    if (active >= 0)
      input.setAttribute("aria-activedescendant", list.id + "-" + active);
    else input.removeAttribute("aria-activedescendant");
  }
  function open() {
    document.dispatchEvent(
      new CustomEvent("close-unified-selects", { detail: wrapper }),
    );
    opened = true;
    active = -1;
    input.value = "";
    popup.hidden = false;
    input.setAttribute("aria-expanded", "true");
    draw();
  }
  function close() {
    opened = false;
    active = -1;
    popup.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    sync();
  }
  function choose(o) {
    select.value = o.value;
    close();
    select.dispatchEvent(new Event("change", { bubbles: true }));
    syncAllSelects();
  }
  input.onfocus = () => {
    if (!opened) open();
  };
  input.onclick = () => {
    if (!opened) open();
  };
  input.oninput = () => {
    if (!opened) {
      const query = input.value;
      open();
      input.value = query;
    }
    active = -1;
    draw();
  };
  input.onkeydown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") close();
    else if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!opened) open();
      if (rows.length) {
        active =
          active < 0
            ? e.key === "ArrowDown"
              ? 0
              : rows.length - 1
            : (active + (e.key === "ArrowDown" ? 1 : -1) + rows.length) %
              rows.length;
        draw();
        document
          .getElementById(list.id + "-" + active)
          ?.scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (!opened) open();
      else if (rows.length) choose(rows[Math.max(0, active)]);
    }
  };
  toggle.onmousedown = (e) => e.preventDefault();
  toggle.onclick = () => {
    if (opened) close();
    else {
      input.focus();
      if (!opened) open();
    }
  };
  document.addEventListener(
    "click",
    (e) => {
      if (!wrapper.contains(e.target)) close();
    },
    { signal: lifecycle.signal },
  );
  document.addEventListener(
    "close-unified-selects",
    (e) => {
      if (e.detail !== wrapper) close();
    },
    { signal: lifecycle.signal },
  );
  select.addEventListener("change", sync);
  searchableSelects.set(select, {
    sync,
    close,
    destroy: () => lifecycle.abort(),
  });
  sync();
}
function syncAllSelects() {
  for (const [select, api] of searchableSelects) {
    if (select.isConnected) api.sync();
    else {
      api.destroy();
      searchableSelects.delete(select);
    }
  }
}
function scanSelects() {
  document.querySelectorAll("select").forEach(enhanceSelect);
  syncAllSelects();
}
const originalClearAll = clearConfig;
clearConfig = function () {
  originalClearAll();
  for (const api of searchableSelects.values()) api.close();
  syncAllSelects();
};
$("reset").onclick = clearConfig;
const originalLoadAll = loadConfig;
loadConfig = function (data) {
  originalLoadAll(data);
  syncAllSelects();
};
scanSelects();
new MutationObserver((records) => {
  if (
    records.some((r) =>
      [...r.addedNodes].some(
        (n) =>
          n.nodeType === 1 &&
          (n.tagName === "SELECT" || n.querySelector?.("select")),
      ),
    )
  )
    scanSelects();
  else syncAllSelects();
}).observe(document.body, { childList: true, subtree: true });

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
// The assistant shares the existing form state; no separate draft or sending path.
let assistantStep = 0;
let assistantActive = false;
let assistantChanging = false;
function assistantChange(id, value) {
  assistantChanging = true;
  $(id).value = value;
  $(id).dispatchEvent(new Event("change", {bubbles:true}));
  assistantChanging = false;
}
function finishAssistant() {
  assistantActive = false;
  syncExperience();
  $("output").focus({preventScroll:true});
}
function renderAssistant(focus = false) {
  const titles = ["¿Qué has visto?", "¿Qué ocurre exactamente?", "¿Cuántas personas ves?", "¿Dónde ocurre?"];
  $("assistant-title").textContent = titles[assistantStep];
  $("assistant-progress").textContent = `Paso ${assistantStep+1} de 4`;
  $("assistant-help").textContent = assistantStep === 0
    ? "Elige una acción o escribe lo que ocurre para generar directamente."
    : "Selecciona una opción o salta este paso. Puedes completar lo demás en Selección rápida.";
  $("assistant-back").hidden = assistantStep === 0;
  $("assistant-skip").hidden = assistantStep === 0;
  $("assistant-finish").hidden = !selectedSceneAction();
  $("assistant-manual").hidden = assistantStep > 1;
  $("assistant-text").placeholder = assistantStep === 0 ? "O escríbelo a mano…" : "O escribe tu detalle…";
  const root = $("assistant-options"); root.replaceChildren();
  const add = (label, value, select) => {
    const button = document.createElement("button");
    button.type = "button"; button.textContent = label;
    if (assistantStep === 0) button.dataset.quickAction = value;
    button.onclick = () => {
      assistantActive = true; select(value);
      if (assistantStep === 3) finishAssistant();
      else { assistantStep++; renderAssistant(true); syncExperience(); }
    };
    root.append(button);
  };
  if (assistantStep === 0) sceneActions.forEach(a => add(a.label, a.id, v => assistantChange("scene-action",v)));
  if (assistantStep === 1 || assistantStep === 3) {
    const id = assistantStep === 1 ? "situation" : "place";
    // Reuse the filtered native catalog, including action/place compatibility.
    if (assistantStep === 1) { $("situation-search").value=""; renderSituations(); }
    const search = document.createElement("input");
    search.type="search"; search.placeholder="Buscar opción…";
    search.setAttribute("aria-label", assistantStep === 1 ? "Buscar detalle del asistente" : "Buscar lugar del asistente");
    root.append(search);
    const choices = document.createElement("div"); choices.className="assistant-choices"; root.append(choices);
    [...$(id).options].filter(o => o.value && o.value !== "custom" && !(assistantStep===1 && o.value===selectedSceneAction()?.index)).forEach(o => {
      add(o.textContent,o.value,v=>assistantChange(id,v)); choices.append(root.lastElementChild);
    });
    search.oninput=()=>{const query=norm(search.value); [...choices.children].forEach(b=>b.hidden=!norm(b.textContent).includes(query));};
  }
  if (assistantStep === 2) for (let i=1;i<=10;i++) add(String(i),String(i), v => {
    assistantChanging=true; $("numbers").children[Number(v)-1].click(); assistantChanging=false;
  });
  if (focus) $("assistant-title").focus({preventScroll:true});
}
$("assistant-back").onclick=()=>{assistantStep=Math.max(0,assistantStep-1);renderAssistant(true);};
$("assistant-skip").onclick=()=>{if(assistantStep===3)finishAssistant();else{assistantStep++;renderAssistant(true);}};
$("assistant-finish").onclick=finishAssistant;
$("assistant-manual").onsubmit=event=>{
  event.preventDefault();
  const text=cleanCustomSituation($("assistant-text").value);
  if(!text)return;
  assistantActive=false;
  if(!selectedSceneAction()) assistantChange("scene-action",sceneActionFor(text).id);
  $("situation-search").focus();
  $("situation-search").value=text; useCustomSituation();
  $("assistant-text").value=""; finishAssistant();
};
$("form").addEventListener("change",()=>{if(!assistantChanging){assistantActive=false;syncExperience();}});
document.addEventListener("entorno:reset",()=>{assistantStep=0;assistantActive=false;$("assistant-text").value="";renderAssistant();syncExperience();});
// Loading a saved environment or editing directly ends the assistant immediately.
const loadBeforeAssistant=loadConfig;
loadConfig=function(data){assistantActive=false;loadBeforeAssistant(data);syncExperience();};
$("output").addEventListener("focus",()=>{if(assistantActive){assistantActive=false;syncExperience();}});
renderAssistant();
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
  $("empty-guide").hidden = !assistantActive && Boolean($("output").textContent.trim());
  $("generate").disabled = !action || !validCount;
}
const countWithExperience = count;
count = function () {
  countWithExperience();
  syncExperience();
};
$("output").oninput = count;
syncExperience();

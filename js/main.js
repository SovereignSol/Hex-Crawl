import { loadFromStorage, saveToStorage } from "./storage.js";
import { makeNewCharacter } from "./state.js";
import { computeDerived } from "./engine/derived.js";
import { castSpell, shortRest, longRest } from "./engine/actions.js";
import { openLevelUpWizard } from "./ui/wizard.js";
import { renderCharacterSummary, renderResourcesAndActions, renderSpells, renderDebug } from "./ui/render.js";

const app = {
  state: null,
  data: null,
  toast(msg){
    console.log(msg);
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "18px";
    el.style.transform = "translateX(-50%)";
    el.style.background = "rgba(18,22,34,.95)";
    el.style.border = "1px solid #2a3550";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "12px";
    el.style.zIndex = "999";
    el.style.boxShadow = "0 12px 40px rgba(0,0,0,.6)";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  },
  commitFromWizard(newState){
    const d = computeDerived(newState);
    newState.resources.pactMagic.slotsCurrent = Math.min(newState.resources.pactMagic.slotsCurrent, d.pactSlotsMax);
    newState.hp.current = Math.min(newState.hp.current, d.hpMax);

    newState.log.push(`Leveled up to ${newState.class.level}.`);
    this.state = newState;
    saveToStorage(this.state);
    renderAll();
  }
};

async function loadData(){
  const [races, classes, subclasses, spells, warlockList] = await Promise.all([
    fetchJson("data/race.json"),
    fetchJson("data/class.json"),
    fetchJson("data/subclass.json"),
    fetchJson("data/spells.json"),
    fetchJson("data/warlock_spell_list.json")
  ]);

  const invocations = [
    { id:"agonizing_blast", name:"Agonizing Blast", desc:"Add CHA mod to Eldritch Blast damage." },
    { id:"devils_sight", name:"Devil’s Sight", desc:"See normally in darkness, magical or nonmagical, 120 ft." },
    { id:"eldritch_sight", name:"Eldritch Sight", desc:"Cast Detect Magic at will, without a slot." },
    { id:"mask_of_many_faces", name:"Mask of Many Faces", desc:"Cast Disguise Self at will, without a slot." },
    { id:"repelling_blast", name:"Repelling Blast", desc:"Push a creature hit by Eldritch Blast 10 ft." },
    { id:"fiendish_vigor", name:"Fiendish Vigor", desc:"Cast False Life at will as a 1st-level spell." }
  ];

  return { races, classes, subclasses, spells, warlockSpellList: warlockList, invocations };
}

function normalizeLoadedState(state){
  if(!state) return null;
  if(!state.class || state.class.name !== "Warlock"){
    state.class = { ...(state.class || {}), name:"Warlock" };
  }
  return state;
}

function wireEvents(){
  document.getElementById("btn-new").addEventListener("click", () => {
    app.state = makeNewCharacter();
    app.state.log.push("New character created.");
    saveToStorage(app.state);
    renderAll();
  });

  document.getElementById("btn-levelup").addEventListener("click", () => {
    openLevelUpWizard(app, app.state, app.data);
  });

  document.getElementById("btn-shortrest").addEventListener("click", () => {
    shortRest(app.state);
    saveToStorage(app.state);
    renderAll();
  });

  document.getElementById("btn-longrest").addEventListener("click", () => {
    longRest(app.state);
    saveToStorage(app.state);
    renderAll();
  });
}

function wireDynamicEvents(){
  const btnApply = document.getElementById("btn-apply-quick");
  if(btnApply){
    btnApply.addEventListener("click", () => {
      const d = computeDerived(app.state);
      const hpIn = document.getElementById("hp-current-input");
      const slIn = document.getElementById("slots-current-input");

      const hp = Number(hpIn.value);
      const sl = Number(slIn.value);

      if(Number.isFinite(hp)){
        app.state.hp.current = Math.max(0, Math.min(hp, d.hpMax));
      }
      if(Number.isFinite(sl)){
        app.state.resources.pactMagic.slotsCurrent = Math.max(0, Math.min(sl, d.pactSlotsMax));
      }

      app.state.log.push("Quick adjustments applied.");
      saveToStorage(app.state);
      renderAll();
    });
  }

  document.querySelectorAll("[data-cast-id]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-cast-id");
      const spell = app.data.spells.find(s => s.id === id);
      if(!spell) return;
      const res = castSpell(app.state, spell);
      app.toast(res.message);
      saveToStorage(app.state);
      renderAll();
    });
  });

  const btnCopy = document.getElementById("btn-copy-json");
  if(btnCopy){
    btnCopy.addEventListener("click", async () => {
      const area = document.getElementById("json-area");
      area.select();
      await navigator.clipboard.writeText(area.value);
      app.toast("Copied JSON.");
    });
  }

  const btnImport = document.getElementById("btn-import-json");
  if(btnImport){
    btnImport.addEventListener("click", () => {
      try{
        const raw = document.getElementById("json-area").value;
        const obj = JSON.parse(raw);
        const normalized = normalizeLoadedState(obj);
        if(!normalized) throw new Error("Invalid JSON.");
        app.state = normalized;
        saveToStorage(app.state);
        renderAll();
        app.toast("Imported JSON.");
      }catch(e){
        app.toast("Import failed: " + e.message);
      }
    });
  }

  const btnClearLog = document.getElementById("btn-clear-log");
  if(btnClearLog){
    btnClearLog.addEventListener("click", () => {
      app.state.log = [];
      saveToStorage(app.state);
      renderAll();
    });
  }
}

function renderAll(){
  renderCharacterSummary(document.getElementById("character-summary"), app.state);
  renderResourcesAndActions(document.getElementById("resources-and-actions"), app.state, app.data.spells);
  renderSpells(document.getElementById("spells-panel"), app.state, app.data.spells);
  renderDebug(document.getElementById("debug-panel"), app.state);

  wireDynamicEvents();
}

async function fetchJson(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return await res.json();
}

(async function boot(){
  app.data = await loadData();

  const saved = normalizeLoadedState(loadFromStorage());
  app.state = saved || makeNewCharacter();

  const d = computeDerived(app.state);
  app.state.resources.pactMagic.slotsCurrent = Math.min(app.state.resources.pactMagic.slotsCurrent, d.pactSlotsMax);
  app.state.hp.current = Math.min(app.state.hp.current, d.hpMax);

  saveToStorage(app.state);

  wireEvents();
  renderAll();
})();

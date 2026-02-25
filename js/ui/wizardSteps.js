import { uiTag } from "./uiCodes.js";
import { computeDerived } from "../engine/derived.js";
import { getWarlockFixedHpGain } from "../engine/warlockProgression.js";
import { filterSpells, spellRowHtml } from "./pickers.js";

export function buildHpStep({ state, body, rerender }){
  const lvl = state.draft.class.level;
  const die = 8;
  const fixed = getWarlockFixedHpGain();
  const key = String(lvl);

  const existing = state.draft.hp.rolls[key];
  const wasFullBefore = state.snapshot.hp.current >= computeDerived(state.snapshot).hpMax;

  body.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <div style="font-weight:800">${uiTag("UI-110")} HP Increase</div>
        <div class="badge">Roll d${die}</div>
      </div>

      <div class="small-note">
        Enter your hit die roll for level ${lvl}. The engine adds CON mod and applies Tough automatically.
        This stores rolls per level so HP can be recalculated cleanly forever.
      </div>

      <div class="field-row">
        <label>
          ${uiTag("UI-111")} Rolled Value (1–${die})
          <input id="hp-roll-input" type="number" min="1" max="${die}" value="${typeof existing === "number" ? existing : ""}" placeholder="${fixed} (fixed option available)" />
        </label>
        <label>
          ${uiTag("UI-112")} Use Fixed Value
          <button id="hp-use-fixed" class="btn"><span class="ui-tag">UI-113</span>Set to ${fixed}</button>
        </label>
      </div>

      <label class="chip" style="cursor:pointer;">
        <input id="hp-raise-current" type="checkbox" ${wasFullBefore ? "checked" : ""} />
        <div>
          <div class="strong">${uiTag("UI-114")} Increase current HP too</div>
          <div class="small">Recommended if you were at full HP before leveling</div>
        </div>
      </label>

      <div id="hp-preview" class="kv">
        <div class="k">${uiTag("UI-115")} Preview</div>
        <div class="v muted">Enter a roll to preview HP change.</div>
      </div>
    </div>
  `;

  const rollInput = body.querySelector("#hp-roll-input");
  const btnFixed = body.querySelector("#hp-use-fixed");
  const chk = body.querySelector("#hp-raise-current");
  const preview = body.querySelector("#hp-preview .v");

  function applyRoll(val){
    const num = Number(val);
    if(!Number.isFinite(num) || num < 1 || num > die){
      preview.innerHTML = `<span class="warn-text">Enter a valid roll 1–${die}.</span>`;
      return;
    }
    state.draft.hp.rolls[key] = num;

    const before = computeDerived(state.snapshot).hpMax;
    const after = computeDerived(state.draft).hpMax;
    const gain = after - before;
    preview.innerHTML = `${before} → ${after} (${gain >= 0 ? "+" : ""}${gain})`;

    if(chk.checked){
      const snapCurrent = state.snapshot.hp.current;
      state.draft.hp.current = Math.min(after, snapCurrent + gain);
    }
  }

  rollInput.addEventListener("input", () => applyRoll(rollInput.value));
  btnFixed.addEventListener("click", () => {
    rollInput.value = String(fixed);
    applyRoll(fixed);
    rerender();
  });
  chk.addEventListener("change", () => applyRoll(rollInput.value));

  if(typeof existing === "number"){
    applyRoll(existing);
  }
}

export function buildPatronStep({ state, body, allData, rerender }){
  const patrons = allData.subclasses.filter(s => s.class === "Warlock").map(s => s.name);
  const selected = state.draft.class.subclass;

  body.innerHTML = `
    <div class="card">
      <div style="font-weight:800">${uiTag("UI-120")} Choose Patron</div>
      <div class="small-note">Required. This is your Warlock subclass.</div>
      <div class="option-grid">
        ${patrons.map(p => `
          <div class="option ${selected === p ? "selected" : ""}" data-patron="${escapeHtmlAttr(p)}">
            <div class="name">${escapeHtml(p)}</div>
            <div class="desc">Select this patron. Subclass features can be extended later.</div>
            <div class="meta"><span class="badge">Warlock</span></div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  body.querySelectorAll("[data-patron]").forEach(el => {
    el.addEventListener("click", () => {
      state.draft.class.subclass = el.getAttribute("data-patron");
      rerender();
    });
  });
}

export function buildPactBoonStep({ state, body, rerender }){
  const options = [
    { id: "Pact of the Chain", desc: "You gain a familiar and related options." },
    { id: "Pact of the Blade", desc: "You can conjure or bind a pact weapon." },
    { id: "Pact of the Tome",  desc: "You gain a Book of Shadows and more cantrips." }
  ];
  const selected = state.draft.class.pactBoon;

  body.innerHTML = `
    <div class="card">
      <div style="font-weight:800">${uiTag("UI-130")} Choose Pact Boon</div>
      <div class="small-note">Required at level 3 or higher.</div>
      <div class="option-grid">
        ${options.map(o => `
          <div class="option ${selected === o.id ? "selected" : ""}" data-pact="${escapeHtmlAttr(o.id)}">
            <div class="name">${escapeHtml(o.id)}</div>
            <div class="desc">${escapeHtml(o.desc)}</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  body.querySelectorAll("[data-pact]").forEach(el => {
    el.addEventListener("click", () => {
      state.draft.class.pactBoon = el.getAttribute("data-pact");
      rerender();
    });
  });
}

export function buildSpellPickerStep({ state, body, allData, rerender }){
  const d = computeDerived(state.draft);
  const spellList = allData.warlockSpellList;
  const spells = allData.spells;

  const warlockCantripIds = new Set(spellList.cantrips);
  const warlockSpellIdsByLevel = spellList.spellsByLevel;

  const cantripOptions = spells.filter(s => s.level === 0 && warlockCantripIds.has(s.id));
  const spellOptions = spells.filter(s => s.level >= 1 && s.level <= 5 && (warlockSpellIdsByLevel[String(s.level)] || []).includes(s.id));

  const canTarget = d.cantripsKnownMax;
  const spTarget = d.spellsKnownMax;
  const cap = d.pactSlotLevel;

  const canSelected = new Set(state.draft.spells.cantrips);
  const spSelected = new Set(state.draft.spells.known);

  for(const id of Array.from(spSelected)){
    const sp = spells.find(x => x.id === id);
    if(sp && sp.level > cap){
      spSelected.delete(id);
    }
  }
  state.draft.spells.known = Array.from(spSelected);

  body.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-weight:800">${uiTag("UI-140")} Spells and Cantrips</div>
        <div class="badge">Slot cap: Lv ${cap}</div>
      </div>

      <div class="counter">
        <div>${uiTag("UI-141")} Cantrips Selected</div>
        <div><b>${canSelected.size}</b> / ${canTarget}</div>
      </div>

      <label>
        ${uiTag("UI-142")} Filter Cantrips
        <input id="can-filter" placeholder="Search cantrips..." />
      </label>

      <div id="can-list" style="display:grid; gap:10px;"></div>

      <hr class="sep" />

      <div class="counter">
        <div>${uiTag("UI-143")} Spells Selected</div>
        <div><b>${spSelected.size}</b> / ${spTarget}</div>
      </div>

      <div class="small-note">
        New known spells are limited by your current slot level cap (Lv ${cap}).
      </div>

      <label>
        ${uiTag("UI-144")} Filter Spells
        <input id="sp-filter" placeholder="Search spells..." />
      </label>

      <div id="sp-list" style="display:grid; gap:10px;"></div>
    </div>
  `;

  const canList = body.querySelector("#can-list");
  const spList = body.querySelector("#sp-list");
  const canFilter = body.querySelector("#can-filter");
  const spFilter = body.querySelector("#sp-filter");

  function renderCantrips(){
    const filtered = filterSpells(cantripOptions, canFilter.value);
    const reached = canSelected.size >= canTarget;

    canList.innerHTML = filtered.map(sp => {
      const selected = canSelected.has(sp.id);
      const disabled = !selected && reached;
      return spellRowHtml(sp, selected, disabled, false);
    }).join("");

    canList.querySelectorAll("input[type=checkbox][data-spell-id]").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-spell-id");
        if(chk.checked){
          if(canSelected.size >= canTarget){
            chk.checked = false;
            return;
          }
          canSelected.add(id);
        } else {
          canSelected.delete(id);
        }
        state.draft.spells.cantrips = Array.from(canSelected);
        rerender();
      });
    });
  }

  function renderSpells(){
    const filtered = filterSpells(spellOptions, spFilter.value)
      .filter(s => s.level <= cap);

    const reached = spSelected.size >= spTarget;

    spList.innerHTML = filtered.map(sp => {
      const selected = spSelected.has(sp.id);
      const disabled = !selected && reached;
      return spellRowHtml(sp, selected, disabled, true);
    }).join("");

    spList.querySelectorAll("input[type=checkbox][data-spell-id]").forEach(chk => {
      chk.addEventListener("change", () => {
        const id = chk.getAttribute("data-spell-id");
        if(chk.checked){
          if(spSelected.size >= spTarget){
            chk.checked = false;
            return;
          }
          spSelected.add(id);
        } else {
          spSelected.delete(id);
        }
        state.draft.spells.known = Array.from(spSelected);
        rerender();
      });
    });
  }

  canFilter.addEventListener("input", renderCantrips);
  spFilter.addEventListener("input", renderSpells);

  renderCantrips();
  renderSpells();
}

export function buildInvocationPickerStep({ state, body, allData, rerender }){
  const d = computeDerived(state.draft);
  const target = d.invocationsKnownMax;

  const INVOCATIONS = allData.invocations;
  const selected = new Set(state.draft.class.invocations);

  body.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-weight:800">${uiTag("UI-160")} Eldritch Invocations</div>
        <div class="badge">${selected.size} / ${target}</div>
      </div>
      <div class="small-note">This is a starter list. You can extend invocations later in data/invocations.</div>
      <div id="inv-list" style="display:grid; gap:10px;"></div>
    </div>
  `;

  const list = body.querySelector("#inv-list");
  const reached = selected.size >= target;

  list.innerHTML = INVOCATIONS.map(inv => {
    const isSel = selected.has(inv.id);
    const dis = !isSel && reached;
    return `
      <label class="kv" style="grid-template-columns:auto 1fr;">
        <input type="checkbox" data-inv-id="${escapeHtmlAttr(inv.id)}" ${isSel ? "checked" : ""} ${dis ? "disabled" : ""} />
        <div>
          <div style="font-weight:800">${escapeHtml(inv.name)}</div>
          <div class="small-note">${escapeHtml(inv.desc)}</div>
        </div>
      </label>
    `;
  }).join("");

  list.querySelectorAll("input[type=checkbox][data-inv-id]").forEach(chk => {
    chk.addEventListener("change", () => {
      const id = chk.getAttribute("data-inv-id");
      if(chk.checked){
        if(selected.size >= target){
          chk.checked = false;
          return;
        }
        selected.add(id);
      } else {
        selected.delete(id);
      }
      state.draft.class.invocations = Array.from(selected);
      rerender();
    });
  });
}

export function buildArcanumPickerStep({ state, body, allData, rerender }){
  const d = computeDerived(state.draft);
  const lvl = d.arcanumUnlock;
  const key = String(lvl);

  const spellOptions = allData.spells.filter(s => s.level === lvl);
  const selected = state.draft.class.arcanum[key];

  body.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-weight:800">${uiTag("UI-170")} Mystic Arcanum (${lvl}th)</div>
        <div class="badge">Pick 1</div>
      </div>
      <div class="small-note">Once per long rest usage is tracked automatically.</div>
      <div class="option-grid">
        ${spellOptions.map(sp => `
          <div class="option ${selected === sp.id ? "selected" : ""}" data-arcanum="${escapeHtmlAttr(sp.id)}">
            <div class="name">${escapeHtml(sp.name)}</div>
            <div class="desc">${escapeHtml(sp.school || "")} • ${escapeHtml(sp.castingTime || "")}</div>
            <div class="meta">
              <span class="badge">Lv ${sp.level}</span>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  body.querySelectorAll("[data-arcanum]").forEach(el => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-arcanum");
      state.draft.class.arcanum[key] = id;
      rerender();
    });
  });
}

export function buildAsiFeatStep({ state, body, rerender }){
  body.innerHTML = `
    <div class="card">
      <div style="font-weight:800">${uiTag("UI-180")} ASI or Feat</div>
      <div class="small-note">
        Minimal implementation to keep the atomic level-up architecture correct.
        Toggle Tough here. Ability scores can be adjusted in Character panel for now.
      </div>

      <div class="chips">
        <label class="chip" style="cursor:pointer;">
          <input id="tough-toggle" type="checkbox" ${state.draft.feats.tough ? "checked" : ""} />
          <div>
            <div class="strong">${uiTag("UI-181")} Tough</div>
            <div class="small">Adds +2 HP per level (derived)</div>
          </div>
        </label>
      </div>
    </div>
  `;

  body.querySelector("#tough-toggle").addEventListener("change", (e) => {
    state.draft.feats.tough = e.target.checked;
    rerender();
  });
}

export function buildSummaryStep({ state, body }){
  const snap = state.snapshot;
  const draft = state.draft;
  const sd = computeDerived(snap);
  const dd = computeDerived(draft);

  body.innerHTML = `
    <div class="card">
      <div style="font-weight:800">${uiTag("UI-200")} Summary</div>
      <div class="small-note">Confirm commits draft changes atomically. Cancel discards everything.</div>

      <table class="table">
        <thead><tr><th>Change</th><th>Before</th><th>After</th></tr></thead>
        <tbody>
          <tr><td>Level</td><td>${snap.class.level}</td><td>${draft.class.level}</td></tr>
          <tr><td>HP Max</td><td>${sd.hpMax}</td><td>${dd.hpMax}</td></tr>
          <tr><td>Pact Slots</td><td>${sd.pactSlotsMax} (Lv ${sd.pactSlotLevel})</td><td>${dd.pactSlotsMax} (Lv ${dd.pactSlotLevel})</td></tr>
          <tr><td>Patron</td><td>${snap.class.subclass || "None"}</td><td>${draft.class.subclass || "None"}</td></tr>
          <tr><td>Pact Boon</td><td>${snap.class.pactBoon || "None"}</td><td>${draft.class.pactBoon || "None"}</td></tr>
          <tr><td>Cantrips</td><td>${snap.spells.cantrips.length}</td><td>${draft.spells.cantrips.length}</td></tr>
          <tr><td>Known Spells</td><td>${snap.spells.known.length}</td><td>${draft.spells.known.length}</td></tr>
          <tr><td>Invocations</td><td>${snap.class.invocations.length}</td><td>${draft.class.invocations.length}</td></tr>
        </tbody>
      </table>

      <div class="small-note">
        If Confirm is disabled, check Validation panel on the left and complete missing steps.
      </div>
    </div>
  `;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function escapeHtmlAttr(str){
  return escapeHtml(str).replaceAll('"',"&quot;");
}

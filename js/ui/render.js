import { computeDerived } from "../engine/derived.js";
import { uiTag } from "./uiCodes.js";
import { normalizeCastingTime } from "../engine/actions.js";

export function renderCharacterSummary(root, state){
  const d = computeDerived(state);
  root.innerHTML = `
    <div class="grid2">
      <div class="kv"><div class="k">${uiTag("UI-021")} Name</div><div class="v">${escapeHtml(state.identity.name)}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-022")} Race</div><div class="v">${escapeHtml(state.identity.race)}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-023")} Class</div><div class="v">Warlock ${state.class.level}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-024")} Patron</div><div class="v">${state.class.subclass ? escapeHtml(state.class.subclass) : "<span class='warn-text'>Unchosen</span>"}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-025")} Pact Boon</div><div class="v">${state.class.pactBoon ? escapeHtml(state.class.pactBoon) : "<span class='muted'>None</span>"}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-026")} HP</div><div class="v">${state.hp.current} / ${d.hpMax}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-027")} Pact Slots</div><div class="v">${state.resources.pactMagic.slotsCurrent} / ${d.pactSlotsMax} (Lv ${d.pactSlotLevel})</div></div>
      <div class="kv"><div class="k">${uiTag("UI-028")} Spell Save DC</div><div class="v">${d.spellSaveDC}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-029")} Spell Attack</div><div class="v">+${d.spellAttack}</div></div>
    </div>

    <hr class="sep" />

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div style="font-weight:800">${uiTag("UI-019")} Ability Scores</div>
        <div class="small-note">Mods auto-compute from scores</div>
      </div>
      <table class="table">
        <thead><tr>
          <th>Ability</th><th>Score</th><th>Mod</th>
        </tr></thead>
        <tbody>
          ${["STR","DEX","CON","INT","WIS","CHA"].map(a => `
            <tr>
              <td>${a}</td>
              <td>${state.abilities[a]}</td>
              <td>${formatMod(Math.floor((state.abilities[a]-10)/2))}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <div class="small-note">${uiTag("UI-018")} Tough feat: ${state.feats.tough ? "<span class='ok-text'>ON</span>" : "<span class='muted'>OFF</span>"}</div>
    </div>
  `;
}

export function renderResourcesAndActions(root, state, allSpells){
  const d = computeDerived(state);
  const arcanumRows = ["6","7","8","9"].map(k => {
    const pickedId = state.class.arcanum[k];
    const picked = pickedId ? allSpells.find(s => s.id === pickedId) : null;
    const used = state.resources.mysticArcanumUsed[k];
    return `
      <div class="kv">
        <div class="k">${uiTag(`UI-06${k}`)} Arcanum ${k}th</div>
        <div class="v">
          ${picked ? escapeHtml(picked.name) : "<span class='muted'>None</span>"}
          ${picked ? ` • ${used ? "<span class='warn-text'>Used</span>" : "<span class='ok-text'>Ready</span>"}` : ""}
        </div>
      </div>
    `;
  }).join("");

  root.innerHTML = `
    <div class="grid2">
      <div class="kv"><div class="k">${uiTag("UI-031")} Pact Slots</div><div class="v">${state.resources.pactMagic.slotsCurrent} / ${d.pactSlotsMax} (Lv ${d.pactSlotLevel})</div></div>
      <div class="kv"><div class="k">${uiTag("UI-032")} Action clarity</div><div class="v"><span class="muted">Spells show Action, Bonus, Reaction from casting time</span></div></div>
    </div>

    <hr class="sep" />

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-033")} Mystic Arcanum</div>
      <div class="grid2">${arcanumRows}</div>
    </div>

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-034")} Quick Adjustments</div>
      <div class="field-row">
        <label>
          ${uiTag("UI-035")} Current HP
          <input id="hp-current-input" type="number" min="0" value="${state.hp.current}" />
        </label>
        <label>
          ${uiTag("UI-036")} Pact Slots Current
          <input id="slots-current-input" type="number" min="0" max="${d.pactSlotsMax}" value="${state.resources.pactMagic.slotsCurrent}" />
        </label>
      </div>
      <div class="small-note">These are manual overrides. Leveling and rests automate these normally.</div>
      <button id="btn-apply-quick" class="btn"><span class="ui-tag">UI-037</span>Apply</button>
    </div>
  `;
}

export function renderSpells(root, state, allSpells){
  const d = computeDerived(state);

  const cantrips = state.spells.cantrips.map(id => allSpells.find(s => s.id === id)).filter(Boolean);
  const known = state.spells.known.map(id => allSpells.find(s => s.id === id)).filter(Boolean);

  const makeSpellTable = (spells, uiCode) => `
    <table class="table">
      <thead><tr>
        <th>${uiTag(uiCode)} Spell</th>
        <th>Level</th>
        <th>Casting</th>
        <th>Action Type</th>
        <th>Cast</th>
      </tr></thead>
      <tbody>
        ${spells.map(s => `
          <tr>
            <td><b>${escapeHtml(s.name)}</b><div class="small-note">${escapeHtml(s.school || "")}</div></td>
            <td>${s.level}</td>
            <td>${escapeHtml(s.castingTime || "?")}</td>
            <td>${normalizeCastingTime(s.castingTime)}</td>
            <td><button class="mini-btn" data-cast-id="${s.id}">${uiTag("UI-049")}Cast</button></td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  root.innerHTML = `
    <div class="grid2">
      <div class="kv"><div class="k">${uiTag("UI-041")} Cantrips</div><div class="v">${cantrips.length} / ${d.cantripsKnownMax}</div></div>
      <div class="kv"><div class="k">${uiTag("UI-042")} Known Spells (1–5)</div><div class="v">${known.length} / ${d.spellsKnownMax}</div></div>
    </div>

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-043")} Cantrips</div>
      ${makeSpellTable(cantrips, "UI-044")}
    </div>

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-045")} Known Spells</div>
      ${makeSpellTable(known, "UI-046")}
    </div>

    <div class="small-note">
      Casting automation:
      1–5th spells spend Pact slots, arcanum spells (6–9) spend a once-per-long-rest use, cantrips spend nothing.
    </div>
  `;
}

export function renderDebug(root, state){
  const text = JSON.stringify(state, null, 2);
  root.innerHTML = `
    <div class="card">
      <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
        <div style="font-weight:800">${uiTag("UI-051")} State JSON</div>
        <button id="btn-copy-json" class="btn"><span class="ui-tag">UI-052</span>Copy JSON</button>
      </div>
      <textarea id="json-area" rows="14">${escapeHtml(text)}</textarea>
      <div class="small-note">You can paste JSON back in and press Import.</div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button id="btn-import-json" class="btn"><span class="ui-tag">UI-053</span>Import JSON</button>
        <button id="btn-clear-log" class="btn danger"><span class="ui-tag">UI-054</span>Clear Log</button>
      </div>
    </div>

    <div class="card">
      <div style="font-weight:800">${uiTag("UI-055")} Activity Log</div>
      <div style="display:grid; gap:8px;">
        ${(state.log || []).slice().reverse().slice(0, 50).map(line => `
          <div class="kv"><div class="k">${uiTag("UI-056")} Log</div><div class="v">${escapeHtml(line)}</div></div>
        `).join("") || `<div class="small-note muted">No log entries yet.</div>`}
      </div>
    </div>
  `;
}

function formatMod(n){
  return n >= 0 ? `+${n}` : `${n}`;
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

import { normalizeCastingTime } from "../engine/actions.js";

export function filterSpells(spells, query){
  const q = (query || "").trim().toLowerCase();
  if(!q) return spells;
  return spells.filter(s =>
    (s.name || "").toLowerCase().includes(q) ||
    (s.school || "").toLowerCase().includes(q)
  );
}

export function spellRowHtml(spell, isSelected, disabled, showLevel=true){
  const action = normalizeCastingTime(spell.castingTime);
  const lvl = showLevel ? `Lv ${spell.level}` : "";
  const dis = disabled ? "disabled" : "";
  const checked = isSelected ? "checked" : "";
  return `
    <label class="kv" style="grid-template-columns:auto 1fr auto; gap:12px;">
      <input type="checkbox" ${checked} ${dis} data-spell-id="${spell.id}" />
      <div>
        <div style="font-weight:800">${spell.name}</div>
        <div class="small-note">${lvl} • ${spell.school || "School?"} • ${action}</div>
      </div>
      <div class="badge">${spell.castingTime || "?"}</div>
    </label>
  `;
}

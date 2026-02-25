import { computeDerived } from "./derived.js";

export function normalizeCastingTime(castingTime){
  const t = (castingTime || "").toLowerCase();
  if(t.includes("bonus")) return "Bonus Action";
  if(t.includes("reaction")) return "Reaction";
  if(t.includes("action")) return "Action";
  return "Special";
}

export function canCastSpell(character, spell){
  const d = computeDerived(character);

  // Arcanum spells are stored on class.arcanum and can be used once per long rest.
  const isArcanum = spell.level >= 6;
  if(isArcanum){
    const key = String(spell.level);
    const picked = character.class.arcanum[key];
    if(!picked || picked !== spell.id) return { ok: false, reason: "Not your Arcanum spell." };
    if(character.resources.mysticArcanumUsed[key]) return { ok: false, reason: "Arcanum already used (long rest)." };
    return { ok: true, kind: "arcanum" };
  }

  // Cantrips cost nothing.
  if(spell.level === 0) return { ok: true, kind: "cantrip" };

  // Warlock pact slots for 1-5.
  if(spell.level > d.pactSlotLevel) return { ok: false, reason: `Slot level is ${d.pactSlotLevel}.` };
  if(character.resources.pactMagic.slotsCurrent <= 0) return { ok: false, reason: "No Pact slots remaining." };
  return { ok: true, kind: "pact" };
}

export function castSpell(character, spell){
  const check = canCastSpell(character, spell);
  if(!check.ok) return { ok: false, message: check.reason };

  const d = computeDerived(character);

  if(check.kind === "pact"){
    character.resources.pactMagic.slotsCurrent = Math.max(0, character.resources.pactMagic.slotsCurrent - 1);
    character.log.push(`Cast ${spell.name} (spent 1 Pact slot, ${character.resources.pactMagic.slotsCurrent}/${d.pactSlotsMax}).`);
    return { ok: true, message: "Cast spell (Pact slot spent)." };
  }

  if(check.kind === "arcanum"){
    const key = String(spell.level);
    character.resources.mysticArcanumUsed[key] = true;
    character.log.push(`Cast ${spell.name} (Mystic Arcanum ${key}th, used).`);
    return { ok: true, message: "Cast Arcanum (used)." };
  }

  character.log.push(`Cast ${spell.name}.`);
  return { ok: true, message: "Cast cantrip." };
}

export function shortRest(character){
  const d = computeDerived(character);
  character.resources.pactMagic.slotsCurrent = d.pactSlotsMax;
  character.log.push("Short Rest: Pact slots restored.");
}

export function longRest(character){
  const d = computeDerived(character);
  character.resources.pactMagic.slotsCurrent = d.pactSlotsMax;

  // Reset arcanum uses
  for(const k of ["6","7","8","9"]){
    character.resources.mysticArcanumUsed[k] = false;
  }

  // Heal to full
  character.hp.current = d.hpMax;

  character.log.push("Long Rest: HP restored, Pact slots restored, Arcanum reset.");
}

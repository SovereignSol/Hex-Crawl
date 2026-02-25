import { getProficiencyBonus, getAbilityMod } from "../state.js";
import { warlockProgressionByLevel, getWarlockHitDie } from "./warlockProgression.js";

export function computeDerived(character){
  const level = character.class.level;
  const prog = warlockProgressionByLevel(level);

  const conMod = getAbilityMod(character, "CON");
  const chaMod = getAbilityMod(character, "CHA");
  const pb = getProficiencyBonus(level);

  // HP derivation:
  // Level 1: full hit die + CON mod
  // Levels 2..level: sum(roll[lvl] + CON mod), each min 1
  // Tough: +2 per character level (standard digital interpretation)
  const hitDie = getWarlockHitDie();
  let hpMax = hitDie + conMod;

  for(let lvl = 2; lvl <= level; lvl++){
    const r = character.hp.rolls[String(lvl)];
    const rollVal = typeof r === "number" ? r : 0;
    const gain = Math.max(1, rollVal + conMod);
    hpMax += gain;
  }

  if(character.feats.tough){
    hpMax += 2 * level;
  }

  // Pact slots
  const pactSlotsMax = prog.pactSlots;
  const pactSlotLevel = prog.pactSlotLevel;

  // Spellcasting numbers
  const spellsKnownMax = prog.spellsKnown;
  const cantripsKnownMax = prog.cantrips;

  // Spell save DC, attack
  const spellSaveDC = 8 + pb + chaMod;
  const spellAttack = pb + chaMod;

  return {
    level,
    pb,
    conMod,
    chaMod,
    hpMax,
    pactSlotsMax,
    pactSlotLevel,
    spellsKnownMax,
    cantripsKnownMax,
    invocationsKnownMax: prog.invocations,
    arcanumUnlock: prog.arcanum,
    spellSaveDC,
    spellAttack
  };
}

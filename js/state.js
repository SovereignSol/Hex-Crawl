import { warlockProgressionByLevel } from "./engine/warlockProgression.js";
import { computeDerived } from "./engine/derived.js";

function abilityMod(score){
  return Math.floor((score - 10) / 2);
}

export function makeNewCharacter(){
  // Warlock-only, no class selector.
  const base = {
    version: 1,
    meta: {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    },
    identity: {
      name: "New Warlock",
      race: "Human"
    },
    class: {
      name: "Warlock",
      level: 1,
      subclass: null,        // Patron
      pactBoon: null,        // Pact at 3
      invocations: [],       // chosen invocations
      arcanum: { "6": null, "7": null, "8": null, "9": null } // chosen spells
    },
    abilities: {
      STR: 8,
      DEX: 14,
      CON: 14,
      INT: 10,
      WIS: 10,
      CHA: 16
    },
    feats: {
      tough: false
    },
    hp: {
      // Store per-level roll results for levels 2..20 (deterministic).
      // Level 1 uses full hit die = 8.
      rolls: {}, // { "2": 5, "3": 6, ... }
      current: 8 + abilityMod(14)
      // max is derived
    },
    resources: {
      pactMagic: {
        slotsCurrent: 1 // derived cap applies
      },
      mysticArcanumUsed: { "6": false, "7": false, "8": false, "9": false }
    },
    spells: {
      cantrips: [], // string ids
      known: []    // 1-5th spell ids
      // arcanum picks stored in class.arcanum
    },
    log: []
  };

  const derived = computeDerived(base);
  base.hp.current = derived.hpMax;
  base.resources.pactMagic.slotsCurrent = derived.pactSlotsMax;

  return base;
}

export function deepClone(obj){
  return JSON.parse(JSON.stringify(obj));
}

export function getAbilityMod(character, key){
  return abilityMod(character.abilities[key]);
}

export function getProficiencyBonus(totalLevel){
  if(totalLevel <= 4) return 2;
  if(totalLevel <= 8) return 3;
  if(totalLevel <= 12) return 4;
  if(totalLevel <= 16) return 5;
  return 6;
}

export function getWarlockTargets(level){
  return warlockProgressionByLevel(level);
}

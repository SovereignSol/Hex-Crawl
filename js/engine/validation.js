import { computeDerived } from "./derived.js";

export function validateDraft(snapshot, draft, context){
  const problems = [];

  const snapLvl = snapshot.class.level;
  const targetLvl = snapLvl + 1;

  if(draft.class.level !== targetLvl){
    problems.push(`Target level must be ${targetLvl}.`);
  }

  // Patron required
  if(!draft.class.subclass){
    problems.push("Patron (subclass) must be selected.");
  }

  // Pact boon required at 3+
  if(draft.class.level >= 3 && !draft.class.pactBoon){
    problems.push("Pact Boon must be selected at level 3 or higher.");
  }

  // HP roll required for target level (2..20)
  if(draft.class.level >= 2){
    const key = String(draft.class.level);
    const r = draft.hp.rolls[key];
    if(typeof r !== "number" || !Number.isFinite(r)){
      problems.push(`HP roll missing for level ${key}.`);
    } else {
      const die = 8;
      if(r < 1 || r > die){
        problems.push(`HP roll for level ${key} must be between 1 and ${die}.`);
      }
    }
  }

  const d = computeDerived(draft);

  // Spell totals
  if(draft.spells.cantrips.length !== d.cantripsKnownMax){
    problems.push(`Cantrips must be exactly ${d.cantripsKnownMax}.`);
  }
  if(draft.spells.known.length !== d.spellsKnownMax){
    problems.push(`Known spells must be exactly ${d.spellsKnownMax}.`);
  }

  // Invocations totals
  if(d.invocationsKnownMax > 0 && draft.class.invocations.length !== d.invocationsKnownMax){
    problems.push(`Invocations must be exactly ${d.invocationsKnownMax}.`);
  }

  // Arcanum selection when unlocked
  if(d.arcanumUnlock){
    const key = String(d.arcanumUnlock);
    if(!draft.class.arcanum[key]){
      problems.push(`Mystic Arcanum (${key}th) must be selected.`);
    }
  }

  // HP current clamp
  if(draft.hp.current > d.hpMax){
    problems.push("Current HP cannot exceed Max HP.");
  }
  if(draft.hp.current < 0){
    problems.push("Current HP cannot be negative.");
  }

  return problems;
}

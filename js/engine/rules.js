import { warlockProgressionByLevel, getWarlockHitDie, getWarlockFixedHpGain } from "./warlockProgression.js";

export function nextLevelSteps(snapshot){
  const fromLevel = snapshot.class.level;
  if(fromLevel >= 20) return [];

  const toLevel = fromLevel + 1;
  const toProg = warlockProgressionByLevel(toLevel);
  const steps = [];

  // HP step always required when leveling.
  steps.push({
    id: "hp",
    ui: "UI-110",
    title: "HP Increase",
    required: true,
    data: {
      hitDie: getWarlockHitDie(),
      fixed: getWarlockFixedHpGain(),
      fromLevel,
      toLevel
    }
  });

  // Patron at level 1, if missing (this can also be enforced on initial setup).
  if(!snapshot.class.subclass){
    steps.push({
      id: "patron",
      ui: "UI-120",
      title: "Choose Patron",
      required: true,
      data: { }
    });
  }

  // Pact boon at 3, if reaching 3 and not chosen.
  if(toLevel >= 3 && !snapshot.class.pactBoon){
    steps.push({
      id: "pactBoon",
      ui: "UI-130",
      title: "Choose Pact Boon",
      required: true,
      data: { }
    });
  }

  // Spell learning (cantrips and spells known totals).
  steps.push({
    id: "spells",
    ui: "UI-140",
    title: "Spells and Cantrips",
    required: true,
    data: {
      toLevel,
      cantripsTarget: toProg.cantrips,
      spellsTarget: toProg.spellsKnown,
      pactSlotLevelCap: toProg.pactSlotLevel
    }
  });

  // Invocations (starts at level 2).
  if(toProg.invocations > 0){
    steps.push({
      id: "invocations",
      ui: "UI-160",
      title: "Eldritch Invocations",
      required: true,
      data: { toLevel, invocationsTarget: toProg.invocations }
    });
  }

  // Mystic Arcanum picks
  if(toProg.arcanum){
    const ar = String(toProg.arcanum);
    steps.push({
      id: "arcanum",
      ui: "UI-170",
      title: `Mystic Arcanum (${ar}th)`,
      required: true,
      data: { arcanumLevel: toProg.arcanum }
    });
  }

  // ASI/Feat
  if(toProg.asi){
    steps.push({
      id: "asi",
      ui: "UI-180",
      title: "ASI or Feat",
      required: true,
      data: { }
    });
  }

  // Summary
  steps.push({
    id: "summary",
    ui: "UI-200",
    title: "Summary and Confirm",
    required: true,
    data: { fromLevel, toLevel }
  });

  return steps;
}

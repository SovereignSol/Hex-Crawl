// Warlock-only table-driven progression (SRD-style values).
// Source intent: cantrips known, spells known, pact slots, slot level, invocations known,
// ASI levels, Mystic Arcanum unlock levels.
// Adjust if your dataset differs, but keep this as single source of truth.

const TABLE = {
  1:  { cantrips: 2, spellsKnown: 2, pactSlots: 1, pactSlotLevel: 1, invocations: 0, asi: false, arcanum: null },
  2:  { cantrips: 2, spellsKnown: 3, pactSlots: 2, pactSlotLevel: 1, invocations: 2, asi: false, arcanum: null },
  3:  { cantrips: 2, spellsKnown: 4, pactSlots: 2, pactSlotLevel: 2, invocations: 2, asi: false, arcanum: null },
  4:  { cantrips: 2, spellsKnown: 5, pactSlots: 2, pactSlotLevel: 2, invocations: 2, asi: true,  arcanum: null },
  5:  { cantrips: 3, spellsKnown: 6, pactSlots: 2, pactSlotLevel: 3, invocations: 3, asi: false, arcanum: null },
  6:  { cantrips: 3, spellsKnown: 7, pactSlots: 2, pactSlotLevel: 3, invocations: 3, asi: false, arcanum: null },
  7:  { cantrips: 3, spellsKnown: 8, pactSlots: 2, pactSlotLevel: 4, invocations: 4, asi: false, arcanum: null },
  8:  { cantrips: 3, spellsKnown: 9, pactSlots: 2, pactSlotLevel: 4, invocations: 4, asi: true,  arcanum: null },
  9:  { cantrips: 3, spellsKnown:10, pactSlots: 2, pactSlotLevel: 5, invocations: 5, asi: false, arcanum: null },
  10: { cantrips: 4, spellsKnown:10, pactSlots: 2, pactSlotLevel: 5, invocations: 5, asi: false, arcanum: null },
  11: { cantrips: 4, spellsKnown:11, pactSlots: 3, pactSlotLevel: 5, invocations: 5, asi: false, arcanum: 6 },
  12: { cantrips: 4, spellsKnown:11, pactSlots: 3, pactSlotLevel: 5, invocations: 6, asi: true,  arcanum: null },
  13: { cantrips: 4, spellsKnown:12, pactSlots: 3, pactSlotLevel: 5, invocations: 6, asi: false, arcanum: 7 },
  14: { cantrips: 4, spellsKnown:12, pactSlots: 3, pactSlotLevel: 5, invocations: 6, asi: false, arcanum: null },
  15: { cantrips: 4, spellsKnown:13, pactSlots: 3, pactSlotLevel: 5, invocations: 7, asi: false, arcanum: 8 },
  16: { cantrips: 4, spellsKnown:13, pactSlots: 3, pactSlotLevel: 5, invocations: 7, asi: true,  arcanum: null },
  17: { cantrips: 4, spellsKnown:14, pactSlots: 4, pactSlotLevel: 5, invocations: 7, asi: false, arcanum: 9 },
  18: { cantrips: 4, spellsKnown:14, pactSlots: 4, pactSlotLevel: 5, invocations: 8, asi: false, arcanum: null },
  19: { cantrips: 4, spellsKnown:15, pactSlots: 4, pactSlotLevel: 5, invocations: 8, asi: true,  arcanum: null },
  20: { cantrips: 4, spellsKnown:15, pactSlots: 4, pactSlotLevel: 5, invocations: 8, asi: false, arcanum: null }
};

export function warlockProgressionByLevel(level){
  const row = TABLE[level];
  if(!row) throw new Error(`No warlock progression row for level ${level}`);
  return { level, ...row };
}

export function getWarlockHitDie(){
  return 8; // d8
}

export function getWarlockFixedHpGain(){
  // Average of d8 is 4.5, PHB uses 5 as fixed for d8.
  return 5;
}

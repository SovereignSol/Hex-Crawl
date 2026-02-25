class WarlockSpellManager {
    constructor() {
        this.availableSpells = this.loadWarlockSpells();
        this.availableCantrips = this.loadWarlockCantrips();
    }

    loadWarlockSpells() {
        // Filter to only include Warlock spells from provided data
        return [
            // 1st level
            'Armor of Agathys', 'Arms of Hadar', 'Charm Person', 'Comprehend Languages',
            'Expeditious Retreat', 'Hellish Rebuke', 'Hex', 'Illusory Script',
            'Protection from Evil and Good', 'Unseen Servant', 'Witch Bolt',
            // 2nd level
            'Darkness', 'Enthrall', 'Hold Person', 'Invisibility', 'Mirror Image',
            'Misty Step', 'Ray of Enfeeblement', 'Shatter', 'Spider Climb', 'Suggestion',
            // ... more levels
        ];
    }

    loadWarlockCantrips() {
        return [
            'Eldritch Blast', 'Blade Ward', 'Chill Touch', 'Friends', 
            'Mage Hand', 'Minor Illusion', 'Poison Spray', 'Prestidigitation',
            'True Strike'
        ];
    }

    getSpellsByLevel(level) {
        return this.availableSpells.filter(spell => {
            const spellLevel = this.getSpellLevel(spell);
            return spellLevel === level;
        });
    }

    canLearnSpell(character, spell) {
        const spellLevel = this.getSpellLevel(spell);
        const maxSpellLevel = Math.min(Math.floor(character.level / 2) + 1, 5);
        
        return spellLevel <= maxSpellLevel && 
               character.spellsKnown.length < character.spellsKnownCount;
    }

    getSpellLevel(spellName) {
        // Implementation to get spell level from data
        const spellLevels = {
            // 1st level
            'Armor of Agathys': 1, 'Hex': 1, 'Hellish Rebuke': 1,
            // 2nd level
            'Darkness': 2, 'Misty Step': 2,
            // ... etc
        };
        return spellLevels[spellName] || 0;
    }
}

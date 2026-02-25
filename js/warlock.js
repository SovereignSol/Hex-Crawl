class WarlockCharacter {
    constructor() {
        this.level = 1;
        this.subclass = 'fiend';
        this.abilities = {
            str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 16
        };
        this.hitPoints = { max: 8, current: 8, temp: 0 };
        this.invocations = [];
        this.pactBoon = '';
        this.spellsKnown = [];
        this.cantripsKnown = ['Eldritch Blast'];
    }

    get proficiencyBonus() {
        return Math.floor((this.level - 1) / 4) + 2;
    }

    get abilityModifiers() {
        return {
            str: Math.floor((this.abilities.str - 10) / 2),
            dex: Math.floor((this.abilities.dex - 10) / 2),
            con: Math.floor((this.abilities.con - 10) / 2),
            int: Math.floor((this.abilities.int - 10) / 2),
            wis: Math.floor((this.abilities.wis - 10) / 2),
            cha: Math.floor((this.abilities.cha - 10) / 2)
        };
    }

    get spellSlots() {
        // Warlocks have specific slot progression
        const slotsByLevel = {
            1: 1, 2: 2, 3: 2, 4: 2, 5: 2,
            6: 2, 7: 2, 8: 2, 9: 2, 10: 2,
            11: 3, 12: 3, 13: 3, 14: 3, 15: 3,
            16: 3, 17: 4, 18: 4, 19: 4, 20: 4
        };
        return {
            count: slotsByLevel[this.level] || 0,
            level: Math.min(Math.floor(this.level / 2) + 1, 5)
        };
    }

    get cantripsKnownCount() {
        // Warlock cantrip progression
        if (this.level < 4) return 2;
        if (this.level < 10) return 3;
        return 4;
    }

    get spellsKnownCount() {
        // Warlock spells known progression
        const knownByLevel = {
            1: 2, 2: 3, 3: 4, 4: 5, 5: 6,
            6: 7, 7: 8, 8: 9, 9: 10, 10: 10,
            11: 11, 12: 11, 13: 12, 14: 12, 15: 13,
            16: 13, 17: 14, 18: 14, 19: 15, 20: 15
        };
        return knownByLevel[this.level] || 0;
    }

    calculateHP() {
        const conMod = this.abilityModifiers.con;
        const hitDie = 8; // Warlock d8 hit die
        return 8 + conMod + ((this.level - 1) * (4 + conMod));
    }

    canLearnInvocation() {
        // Check invocation prerequisites based on level and other factors
        const knownCount = this.invocations.length;
        const maxInvocations = Math.floor(this.level / 2) + 1;
        return knownCount < maxInvocations;
    }

    addInvocation(invocation) {
        if (this.canLearnInvocation() && this.meetsPrerequisites(invocation)) {
            this.invocations.push(invocation);
            return true;
        }
        return false;
    }

    meetsPrerequisites(invocation) {
        // Check if character meets invocation prerequisites
        const prereqs = invocation.prerequisites || {};
        
        if (prereqs.level && this.level < prereqs.level) return false;
        if (prereqs.pact && this.pactBoon !== prereqs.pact) return false;
        if (prereqs.spell && !this.spellsKnown.includes(prereqs.spell)) return false;
        
        return true;
    }

    levelUp() {
        if (this.level >= 20) return false;
        
        this.level++;
        const newHP = this.calculateHP();
        this.hitPoints.max = newHP;
        this.hitPoints.current = newHP;
        
        // Handle level-specific gains
        this.handleLevelUpBenefits();
        
        return true;
    }

    handleLevelUpBenefits() {
        switch (this.level) {
            case 2:
                // Gain Eldritch Invocations
                break;
            case 3:
                // Gain Pact Boon
                break;
            case 11:
                // Mystic Arcanum (6th level)
                break;
            case 13:
                // Mystic Arcanum (7th level)
                break;
            case 15:
                // Mystic Arcanum (8th level)
                break;
            case 17:
                // Mystic Arcanum (9th level)
                break;
            case 20:
                // Eldritch Master
                break;
        }
    }
}

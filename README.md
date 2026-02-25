# Warlock Sheet (Automated)

This is a Warlock-only, automation-first DnD 5e sheet designed around a BG3-style leveling model:

- Press **Level Up** (UI-011)
- A modal wizard opens (UI-100)
- The wizard creates snapshot + draft
- You complete required steps
- Confirm stays disabled until valid
- Confirm commits atomically, then UI refreshes

## Run locally (Windows)
Use a local server (ES modules do not reliably load via file://):
- `python -m http.server 5173`
- open `http://localhost:5173`

## Data files
- `data/race.json`
- `data/class.json` (Warlock only)
- `data/subclass.json` (Warlock subclasses only)
- `data/spells.json` (small seed list, extend freely)
- `data/warlock_spell_list.json`

## Where Warlock progression lives
- `js/engine/warlockProgression.js` is the single source of truth for levels 1–20.

## UI numbering
Every major UI control shows a visible `UI-###` tag.

## Extending later
- Add more spells to `data/spells.json` and include ids in `data/warlock_spell_list.json`.
- Expand invocations in `js/main.js` (invocations seed array).
- Add subclass feature documents in `data/subclass.json` and render them in the UI.

This repo intentionally focuses on correctness and automation foundations first.

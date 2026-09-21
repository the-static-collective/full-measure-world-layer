# GRACE-001 — AN ORDINARY TUESDAY

**Status:** experimental Full Measure campaign specimen  
**Seal:** `ONE THING, MANY FUTURES`

This is the first bounded game-shaped landing for the Grace Under Pressure / WORLDSEED thread.

It composes existing Full Measure authority rules rather than introducing a second quest ledger. The Dungeon Master may propose. Dice may select among declared possibilities. Only attributable acts and existing witness/admission rules can change constituted history.

## What is executable

`kernel.ts` implements a tiny deterministic mechanics surface:

- one OTAAT foreground thread at a time;
- interruption with an explicit return address;
- Practice cards for prayer, hydration and rest;
- Relation cards for bounded attempts and help requests;
- MADDcl0wn Wild Cards that may alter declared presentation/grammar without fabricating external facts;
- a d20-style deterministic Dungeon Master proposal draw;
- explicit claims and non-claims on every receipt.

Run:

```bash
npm install
npm run grace -- status
npm run grace -- draw 42
npm run grace -- cards
npm run grace -- play practice.pray
npm run grace -- play relation.make-call
npm run grace -- play wild.no-optimize
npm test
```

Each command currently begins from the same fresh Tuesday seed. Persistent save/replay is deliberately outside this first slice.

## Why prayer is a real recharge mechanic

`practice.pray` changes Grace's attention/resilience projections and formation trace. A kernel invariant prevents Practice cards from changing external facts.

The receipt explicitly refuses:

- prayer == guaranteed external result;
- attention change == landlord/case outcome;
- spiritual practice == spendable supernatural mana.

Prayer therefore matters mechanically without making the engine adjudicate theology.

## OTAAT

The world may carry many active needs. The interface carries one foreground aperture.

Changing focus suspends the prior focused thread, preserves `resume:<thread-id>`, and leaves its residual need intact.

This is ergonomics, not ontology: foreground focus does not declare that the chosen thread is objectively more important than everything else.

## Culture under scarcity\n\nThe first culture-economy specimen starts with 4 time blocks, $18, 1 ready food serving, 1 transport use, and 3 attention while home dinner, a client callback, vehicle trouble, rest, and a neighbor meal are all live demands.\n\nEvery economy action emits an opportunity-cost receipt. If Grace shares the only ready meal, Make Dinner at Home was affordable before the choice and is no longer affordable afterward; the home-dinner demand remains explicit.\n\nGrocery Run converts 2 time + $18 + 1 transport + 1 attention into 4 additional food servings. That is investment under scarcity, not a free resource spawn.\n\nRepeated attributable choices build culture traces for hospitality, stewardship, discipleship, rest, and mutual aid. Discipleship means formation/apprenticeship here: it never creates ownership, obedience, or guaranteed future labor.\n\nThe intended Age-of-Empires pressure is therefore: finite supply -> hard choice -> receipted opportunity cost -> residual demand -> repeated practice -> visible culture -> new future possibilities.\n\nCLI: npm run grace -- economy ; npm run grace -- choices ; npm run grace -- choose share-meal\n\n## MADDcl0wn

Wild Cards are permission to bend declared game grammar under receipt.

Current specimen:

- **YOU MAY NOT OPTIMIZE THIS** hides numeric projections for three turns;
- **THE WRONG DOOR OPENS** allows an unresolved thread to be offered as a candidate focus.

Neither card may fabricate an occurrence, consent, truth, divine instruction, or external outcome.

## Dogram handoff

This module does not import Dogram yet. Instead it emits a deliberately small mechanics shape suitable for a later `GRACE-DOGRAM-001` adapter:

```text
exact state
+ OTAAT focus
+ declared cards
+ formation trace
+ declared resource budget
    ↓
legal / refused move
successor state
receipt
residual need
```

Candidate Dogram checks:

1. **DESCEND** — does a visible state category erase a mechanics distinction?
2. **SUCCESSOR-DESCENT** — do apparently equivalent states really expose the same next moves?
3. **COMMUTE** — does `PRAY → CALL` differ from `CALL → PRAY`, even when coarse meters agree?
4. **MARKOV RESIDUAL** — can small daily penalties compound into an accidental unrecoverable burnout loop?
5. **BUDGET ROUNDING RESIDUAL** — when time/action units are indivisible, which rounding constitution produced the allocation?

Dogram calculates. It does not choose the morally correct move.

## WORLDSEED / Bandcamp

`worldseed.json` admits only candidate motifs from the supplied Bandcamp corpus: open E, lemons, tables, roots/seeds/fruit, porch/room/door, weather/static/road, and the kept light.

A lyric is artistic source material, not automatic campaign canon. Full Measure-local admission remains separate.

## Persistence and replay

The inhabited React surface now stores only the append-only `full-measure.grace-session.v1` event log in local browser storage.

On reload, the current story state, culture economy, DM proposal, dream witnesses, Upper Room returns, and remembered cards are reconstructed by deterministic replay from the seed state.

A malformed or unaffordable event sequence fails replay rather than borrowing supply from nowhere.

## Dream → Upper Room → remembered card

The first MADDJack path is executable:

```text
RED DOOR DREAM
  ↓ attributable dream witness
interpretation: unresolved
  ↓
UPPER ROOM RETURN
text anchor: Psalm 46:10
practice: prayer
  ↓
REMEMBERED WORD
generation: 1
```

The return preserves the text anchor and prayer occurrence while explicitly refusing the claims that the dream was prophetic, that one interpretation has been proven, or that prayer guarantees an external outcome.

This follows Upper Room's existing `continuity without captivity` boundary: preserve enough provenance for honest re-entry without forcing one pose or interpretation.

## Dogram-compatible mechanics witnesses

`dogramBridge.ts` now provides two bounded exact receipts:

- `GRACE-OPPORTUNITY-COST-001` compares the before/after lawful action sets and receipts foreclosed, newly available, and retained successors.
- `BUDGET-ROUNDING-RESIDUAL-001` mirrors Dogram's merged largest-fractional-remainder integer-budget specimen for declared finite game budgets.

The frozen `5:4:1` / budget `7` control reproduces:

```text
exact      7/2 : 14/5 : 7/10
allocation   3 :    3 :    1
residual  -1/2 :  1/5 : 3/10
```

These are mechanics calculations with `authority: none`. Successor availability does not mean occurrence, and numerical allocation does not decide the right human choice.

## Next frontier

Make this *inhabited*:

- add a phone-shaped React encounter surface;
- let the player pick party + current location;
- persist append-only receipts;
- add one Upper Room return witness;
- add one dream/MADDJack encounter;
- feed exact state declarations through a Dogram adapter;
- export resulting world residue to WORLDSEED.

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

## MADDcl0wn

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

## Next frontier

Make this *inhabited*:

- add a phone-shaped React encounter surface;
- let the player pick party + current location;
- persist append-only receipts;
- add one Upper Room return witness;
- add one dream/MADDJack encounter;
- feed exact state declarations through a Dogram adapter;
- export resulting world residue to WORLDSEED.

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

## Party, flashback, and possible-world apertures

The inhabited campaign now exposes three explicit world/meaning apertures without creating a second authority system.

### Choose your party

Grace remains the player-character. Heaven and Paula can be included or left out of the active party.

Party membership contributes **lenses and prompts**, not fungible labor, stat bonuses, obedience, or automatic agreement.

### Flashback

A flashback points to an earlier append-only campaign event.

The player may spend:

```text
1 time
1 attention
```

to add a present-day reflection.

Replay refuses a flashback that has no earlier source event or that lacks the immediately preceding `reflection-block`. The source event is never edited.

```text
earlier event
  != later memory
  != present interpretation
```

### Grace's Possible House

The seeded hypothetical world can currently hold:

- food without proving worth;
- a huge art room for Heaven;
- a porch around the whole house;
- a community kitchen;
- garden everywhere.

Returning from the possible world costs `1 time + 1 attention` and receipts both the selected principles and the tensions they still require: supply, maintenance, cleanup, land, water, seasonality, boundaries, accessibility, and rest.

The aperture therefore allows fantasy/utopia to become **design material without becoming fake present-world supply**.

## Bandcamp archaeology / Novelist material seeds

The first content-archaeology layer follows Novelist's material discipline:

```text
artistic source
  ↓
status: seed
canonical: false
  ↓
paid Storyship visit
  ↓
campaign witness
  ↓
candidate relations
```

A visit costs:

```text
1 time
1 attention
```

and is valid in replay only when immediately preceded by `storyship-block`.

The first three sites are:

1. **After the Feast, Seeds in the Dirt** — sourced from *Forty-Two Lemon Seeds*. Porch cleanup, residue, cables, lemon seeds, roots and the future stranger become candidate material.
2. **The Witness Seat Leaves the Porch** — sourced from *Static Knows the Road*. Road, static, fence wire, power lines and portable witness become candidate material.
3. **The Room After the Spark** — sourced from *The Door Learns the Morning*. Chair, table, lemon, open E, ordinary morning labor, aftermath and rest become candidate material.

Party composition changes the questions exposed by a visit while the source facts remain identical.

The witness explicitly refuses:

- source lyric == campaign history;
- candidate relation == admitted world fact;
- artistic resemblance == external occurrence;
- party prompt == interpretive authority.

Day Receipt replay/checksum includes archaeology visits.

## GRACE-PLAY-002 / THE DAY MOVES WITHOUT YOU

The focused play loop now has a deterministic day rhythm without adding a second clock resource.

### Day phases

The existing finite `time` supply drives presentation:

```text
4 time      → morning
2-3 time    → midday
1 time      → evening
0 time      → night
```

Earlier choices can change later scene copy. A grocery run, for example, can make evening explicitly acknowledge that food made it home while the vehicle remains unresolved.

### Delayed world response

After Grace attempts the housing-resource call, the coordinator callback becomes eligible only after **two later ordinary turns**.

The callback interrupts the normal hand with three dispositions:

- **Answer** — an appointment can become offered; housing remains unresolved.
- **Let it ring** — the callback occurrence is still retained; unanswered does not mean refused.
- **Hold it for tomorrow** — a return address is preserved instead of forcing the remainder into tonight.

The delay law is enforced during deterministic replay as well as in the UI, so an imported session cannot inject the callback early.

### The House Takes Attendance

When ordinary time reaches zero, the focused surface becomes:

```text
THE HOUSE TAKES ATTENDANCE
```

It reports:

- completed local demand scopes;
- demands still open;
- culture actually practiced;
- declared state changes;
- strange/dream/Storyship residue carried by the day.

The screen explicitly refuses `unfinished == failed` and does not silently close any residual need.

Incoming world responses and bounded MADDJack/MADDcl0wn encounters may surface before attendance, so the end of the day can still be interrupted by something that actually returned.

## Live Dogram donor

Full Measure can now use Dogram itself as an optional local mechanics donor.

Set only the local repository root:

```bash
GRACE_DOGRAM_REPO=/path/to/Dogram
```

Full Measure fixes the executable and argv in code:

```text
python3 -m dogram.game_mechanics_stdio
```

The browser never spawns Python directly. It calls the Full Measure server, which uses the existing bounded no-shell process membrane and rejects any Dogram response whose declared authority is not exactly `none`.

When Dogram is unavailable, the UI explicitly falls back to the local TypeScript mirror and labels that fallback rather than claiming the donor ran.

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

## Portable Day Receipt

The inhabited campaign can now export and import `full-measure.grace-day-receipt.v1`.

The artifact contains the append-only session log plus a deterministic replay checksum. Import replays the event sequence and refuses a receipt whose replay result no longer matches its checksum.

The current checksum is explicitly a corruption/replay witness, not a cryptographic signature and not an authority upgrade.

## Upper Room selection and card lineage

The first dream return no longer forces one seeded passage. The player may choose among declared text anchors:

- Psalm 46:10;
- Matthew 11:28;
- James 1:5.

Selection is retained as provenance, not as proof that the selected passage is the one correct interpretation or divine instruction.

A `REMEMBERED WORD` card can now be exported as a `full-measure.portable-card.v1` envelope. Another campaign can receive that envelope and seed a descendant card:

```text
Generation 1 parent
      ↓ portable lineage envelope
Generation 2 descendant
```

The descendant preserves the parent card id and complete lineage while explicitly refusing to claim physical custody transfer or inherited interpretive authority.

## GRACE-PLAY-003 / TOMORROW HAS A MEMORY

Campfire now exposes an explicit **Begin Wednesday** button when Tuesday reaches its House Takes Attendance screen. Wednesday is a separate, locally persisted append-only day, not a replay of Tuesday's starting supply.

The handoff freezes Tuesday's Day Receipt and its exact event log. Wednesday replay checks both the prior-day replay witness and that inherited event sequence before admitting new Wednesday actions. This is local integrity checking, **not** cryptographic authorship or independent evidence about real events.

Wednesday receives **four new game-time blocks** and retains Tuesday's actual cash, food, transport, and attention. Its own dinner is a new declared need. Unmet Tuesday demands stay visible as carried residuals, but a meal cooked on Wednesday never retroactively completes Tuesday's dinner.

The compact Wednesday hand may offer:
- **Make Wednesday dinner** using surviving food, not respawned groceries.
- **Follow up on housing** only where a prior attributable housing attempt/offer exists; follow-up != housing secured.
- **Offer a shared-table invitation** when Tuesday included a shared meal. The invitation creates neither acceptance nor food.
- **Check the vehicle**, pray, or rest subject to the actual carried supply.
- **Return to the porch with both receipts** only when Tuesday contains the specific *Door Learns the Morning* archaeology choice **and** an attributable later reflection targeting that exact visit. The player must express a relation using the Wednesday interaction. The result opens a local fictional archive, not a real-world door or a verified theological interpretation.

Two different Tuesdays can end with identical resource totals yet produce different Wednesday hands because the **attributable actions** were different. The porch mystery is optional; it never blocks dinner, rest, stopping play, or reviewing Tuesday.

Wednesday's scene, four-card hand, selected-card commit, consequence beat, attendance, and local save are executable in Campfire. The Tuesday inspector is hidden once Wednesday begins, preventing edits to the source day through normal play. Tuesday's sealed Day Receipt remains reviewable/exportable.

**Current boundary:** This is a two-day local playable specimen, not full multi-user synchronization, a canonical WORLDSEED crossing, or a general infinite-calendar simulator.

## Next frontier

Next measurable scope: review the two-day source/receipt boundary, export an explicitly versioned Wednesday Day Receipt, and field-test one human-played Tuesday → Wednesday run before considering a third day or shared-play transport.

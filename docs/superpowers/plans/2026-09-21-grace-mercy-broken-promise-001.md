# GRACE-MERCY-BROKEN-PROMISE-001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first executable Grace ⇄ Mercy dual-sheet encounter to Full Measure: one ordinary Broken Promise rupture where the same character can turn from Grace to Mercy, distinguish evidence from unknown motive, choose Y/HOLD/REFUSE, preserve boundaries and consequences, and emit a bounded Mercy encounter receipt without altering Full Measure's existing factual measures.

**Architecture:** Implement Grace/Mercy as a derived projection over existing Full Measure character data plus a new stream of `DomainEvent` encounter traces. The first Broken Promise specimen is fixture-backed and deterministic at the kernel level; the Express server persists only attributable encounter actions, while the React surface renders the same character on two sides of one sheet. No Mercy event creates a Deed, Witness, Harvest, moral score, diagnosis, or inferred motive.

**Tech Stack:** Existing Full Measure stack: TypeScript 5.8; React 19; Express 4; Vite 6; Node 22+; Node built-in `node:test`; `tsx`; Lucide React; existing JSON datastore and `DomainEvent` history. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-09-21-grace-mercy-dual-sheet-001-design.md`

## Global Constraints

- Grace and Mercy are two projections of one particular character, never separate identities.
- Turning the sheet may change available verbs and encounter posture; it may not clear history, duplicate inventory, erase consequences, create a new identity, silently revoke a boundary, fabricate witness, manufacture evidence, or restore a relationship by UI transition alone.
- Grace asks: **What good can live here?**
- Mercy asks: **What actually happened, what must remain protected, and what lawful relationship is still possible now?**
- Mercy preserves truthful possibility after rupture without deleting the receipt.
- `MERCY != DELETE CONSEQUENCE`.
- `FORGIVEN != AUTOMATICALLY RESTORED TO PRIOR ACCESS`.
- The game prefers **ENEMY OCCURRENCE** over automatically creating an enemy-person ontology.
- A rupture does not itself prove motive.
- The runtime must preserve `KNOWN`, `REPORTED`, `DERIVED`, `CONTESTED`, and `UNKNOWN` distinctions.
- Unknown motive does not require unknown harm.
- The player chooses `TURN THE SHEET`; the system may surface `MERCY AVAILABLE` but may not declare the player's emotion, another person's motive, guilt, spiritual meaning, or required punishment.
- Y is scoped admission, not universal approval.
- HOLD is a successful discernment outcome.
- REFUSE rejects one proposed crossing; it does not delete the carrier or person.
- Returning to Grace does not forgive, reconcile, reopen access, restore a role, remove a consequence, or clear a Mercy boundary.
- Low capacity is not moral failure.
- Mercy events must not increment Full Measure Gifts, Quests, Deeds, Seeds, Witness, Harvests, witnessed progress, or chapter progression.
- Models may propose or summarize; they do not manufacture witness, motive, consent, legal authority, diagnosis, or theological interpretation.
- The first specimen is ordinary: no combat loop, enemy HP, alignment, sin score, karma score, forgiveness points, punishment generator, lie detector, or automatic reconciliation.
- Real-world imminent danger is outside the specimen; the UI must not present Mercy as emergency, legal, medical, mental-health, or clergy authority.
- The first fixture must preserve: `promise_made`, `promise_missed_1`, `promise_missed_2`, `consequence_absorbed_by_other`, `warning_status_contested`, and `intent_unknown`.

## Review Focus

1. **Hidden XP leakage** — Mercy encounter events must not change any existing Full Measure measure, chapter, witnessed progress, capacity count, or role. Task 2 pins this with before/after sheet equality.
2. **Motive fabrication** — repeated misses may establish harm/risk but must leave intent `UNKNOWN` unless direct evidence is explicitly supplied. Tasks 3 and 4 pin this.
3. **Boundary loss on sheet return** — turning back to Grace after REFUSE/BOUND must preserve the active boundary and receipt. Tasks 4 and 7 pin this.
4. **REFUSE overreach** — REFUSE must apply to the proposed commitment crossing only; it must not emit `person.enemy`, `relationship.deleted`, or equivalent permanent-person classification. Tasks 4 and 5 pin this.
5. **Duplicate/replayed encounter actions** — repeating a previously accepted action ID or reopening the browser must not duplicate sheet turns, evidence, boundaries, or receipts. Tasks 5 and 6 pin this.

---

## Repository file map

```text
src/
  types.ts
  lib/
    fullMeasure.ts
    api.ts
    graceMercy/
      types.ts
      fixtures.ts
      projection.ts
      brokenPromise.ts
      receipt.ts
      index.ts
  components/
    FullMeasureView.tsx
    GraceMercyDualSheet.tsx
server.ts

tests/
  fullMeasure.test.ts
  grace-mercy-projection.test.ts
  grace-mercy-broken-promise.test.ts
  grace-mercy-receipt.test.ts
  grace-mercy-http.test.ts
  grace-mercy-panel.test.ts

scripts/
  grace-mercy-broken-promise-001.ts

examples/
  grace-mercy-broken-promise-001/
    README.md
    expected-receipt.json

docs/
  protocol/
    grace-mercy-dual-sheet-v01.md
    grace-mercy-broken-promise-001.md
```

The first crater does **not** create a new database collection. Encounter state is reconstructed from `DomainEvent[]` scoped by `aggregateType: 'mercy_encounter'` and one encounter aggregate ID. This keeps the current datastore model intact and makes replay/inspection possible through the existing event history.

---

### Task 1: Grace/Mercy domain types and fixture facts

**Files:**
- Modify: `src/types.ts`
- Create: `src/lib/graceMercy/types.ts`
- Create: `src/lib/graceMercy/fixtures.ts`
- Create: `src/lib/graceMercy/index.ts`
- Test: `tests/grace-mercy-projection.test.ts`

**Interfaces:**
- Consumes: existing `DomainEvent`, `Profile`.
- Produces:
  - `SheetSide = 'GRACE' | 'MERCY'`
  - `EvidenceState = 'KNOWN' | 'REPORTED' | 'DERIVED' | 'CONTESTED' | 'UNKNOWN'`
  - `Discernment = 'Y' | 'HOLD' | 'REFUSE'`
  - `MercyDisposition`
  - `BrokenPromiseFact`
  - `RuptureProjection`
  - `MercyEncounterProjection`
  - `BROKEN_PROMISE_FIXTURE`
  - new `AggregateType` member `'mercy_encounter'`

- [ ] **Step 1: Write the failing type/fixture behavior test**

Create `tests/grace-mercy-projection.test.ts` with a runtime assertion over the fixture:

```ts
import test from 'node:test';
import assert from 'node:assert/strict';
import { BROKEN_PROMISE_FIXTURE } from '../src/lib/graceMercy/fixtures.js';

test('broken promise fixture preserves known harm separately from unknown intent', () => {
  const byKey = new Map(BROKEN_PROMISE_FIXTURE.facts.map((fact) => [fact.key, fact]));

  assert.equal(byKey.get('promise_made')?.state, 'KNOWN');
  assert.equal(byKey.get('promise_missed_1')?.state, 'KNOWN');
  assert.equal(byKey.get('promise_missed_2')?.state, 'KNOWN');
  assert.equal(byKey.get('consequence_absorbed_by_other')?.state, 'KNOWN');
  assert.equal(byKey.get('warning_status_contested')?.state, 'CONTESTED');
  assert.equal(byKey.get('intent_unknown')?.state, 'UNKNOWN');
});
```

- [ ] **Step 2: Run RED**

Run:

```bash
npm test -- tests/grace-mercy-projection.test.ts
```

Expected: FAIL because the Grace/Mercy fixture module does not exist.

- [ ] **Step 3: Add `mercy_encounter` to `AggregateType`**

In `src/types.ts`, extend the existing union without changing other aggregate meanings.

- [ ] **Step 4: Implement the domain types**

Use these exact unions:

```ts
export type SheetSide = 'GRACE' | 'MERCY';

export type EvidenceState =
  | 'KNOWN'
  | 'REPORTED'
  | 'DERIVED'
  | 'CONTESTED'
  | 'UNKNOWN';

export type Discernment = 'Y' | 'HOLD' | 'REFUSE';

export type MercyDisposition =
  | 'RECONCILED'
  | 'REPAIRED_BUT_DIFFERENT'
  | 'BOUNDED'
  | 'SEPARATED'
  | 'RELEASED'
  | 'REFERRED'
  | 'UNRESOLVED';
```

`BrokenPromiseFact` must include `key`, `state`, `summary`, and `evidenceRefs`.

- [ ] **Step 5: Implement the fixture**

The fixture ID is:

```text
grace-mercy:broken-promise-001
```

It must include exactly the six required fact keys from Global Constraints and no inferred motive.

- [ ] **Step 6: Run suite and typecheck**

```bash
npm test
npm run lint
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/lib/graceMercy tests/grace-mercy-projection.test.ts
git commit -m "feat: define Grace Mercy encounter vocabulary"
```

---

### Task 2: Derived dual-sheet projection with zero measure leakage

**Files:**
- Create: `src/lib/graceMercy/projection.ts`
- Modify: `tests/grace-mercy-projection.test.ts`
- Modify: `tests/fullMeasure.test.ts`

**Interfaces:**
- Consumes:
  - `DomainEvent[]`
  - `buildFullMeasureSheet(...)`
  - `BROKEN_PROMISE_FIXTURE`
- Produces:
  - `buildGraceMercyProjection(characterRef, encounterId, events): MercyEncounterProjection`
  - `getAvailableGraceVerbs(projection): readonly string[]`
  - `getAvailableMercyVerbs(projection): readonly string[]`

- [ ] **Step 1: Add failing same-character projection test**

Assert an empty encounter projects:

```ts
{
  characterRef: 'user_grace',
  encounterId: 'grace-mercy:broken-promise-001:user_grace',
  currentSheet: 'GRACE',
  ruptureStatus: 'candidate',
  mercyAvailable: false,
  discernment: null,
  disposition: 'UNRESOLVED'
}
```

The projection must not contain a second character ID.

- [ ] **Step 2: Add failing hidden-XP regression test**

In `tests/fullMeasure.test.ts`, build one baseline `FullMeasureSheet`, append several `mercy.*` `DomainEvent` values, rebuild, and assert deep equality for:

- `measures`
- `chapter`
- `role`
- `witnessedProgress`
- `chapterProgress`
- `nextChapterAt`
- `capacitiesUnlocked`

- [ ] **Step 3: Run RED**

```bash
npm test -- tests/grace-mercy-projection.test.ts tests/fullMeasure.test.ts
```

Expected: projection function missing and/or hidden-XP regression not yet supported by the new event kind.

- [ ] **Step 4: Implement the derived projection**

Projection rules:
- default side is GRACE;
- only explicit `mercy.sheet_turned` changes side;
- only accepted encounter events affect Mercy projection;
- existing Full Measure measures ignore `mercy_encounter` events;
- latest valid boundary remains active across later sheet turns;
- unknown motive remains unknown unless an explicit fact event replaces it with attributable evidence.

- [ ] **Step 5: Implement verb availability**

Grace verbs:

```text
WELCOME ENCOURAGE GIVE CONNECT PLANT FEED PLAY PRAY BUILD INVITE TEACH RECEIVE BLESS CELEBRATE POUR
```

Mercy verbs:

```text
NOTICE NAME TEST HOLD WITNESS BOUND INTERRUPT REFUSE SEPARATE REPAIR RESTITUTE RECONCILE RELEASE RETURN
```

The first specimen does not implement all verbs as actions; availability is descriptive capability for the UI.

- [ ] **Step 6: Run full suite/lint and commit**

```bash
npm test
npm run lint
git add src/lib/graceMercy/projection.ts tests/grace-mercy-projection.test.ts tests/fullMeasure.test.ts
git commit -m "feat: project Grace and Mercy from one character history"
```

---

### Task 3: Rupture derivation without motive inference

**Files:**
- Create: `src/lib/graceMercy/brokenPromise.ts`
- Modify: `tests/grace-mercy-broken-promise.test.ts`

**Interfaces:**
- Consumes: fixture facts, current projection.
- Produces:
  - `deriveBrokenPromiseRupture(facts): RuptureProjection`
  - `isMercyAvailable(rupture): boolean`
  - `BrokenPromiseAction`
  - `validateBrokenPromiseAction(projection, action): void`

- [ ] **Step 1: Write failing rupture test**

Create `tests/grace-mercy-broken-promise.test.ts`.

Assert:
- one missed promise alone leaves rupture `candidate`;
- two known misses plus known absorbed consequence establish rupture;
- contested warning status remains contested;
- intent remains unknown;
- Mercy may become available from established effect/risk without motive evidence.

- [ ] **Step 2: Add failing “no motive fabrication” test**

Given the complete first fixture, assert:

```ts
assert.equal(rupture.intentState, 'UNKNOWN');
assert.equal(rupture.motiveClaim, null);
assert.equal(rupture.status, 'established');
```

- [ ] **Step 3: Run RED**

```bash
npm test -- tests/grace-mercy-broken-promise.test.ts
```

Expected: FAIL because rupture derivation is missing.

- [ ] **Step 4: Implement minimal rupture derivation**

The v0.1 fixture establishes rupture when all are true:
- `promise_made` known;
- `promise_missed_1` known;
- `promise_missed_2` known;
- `consequence_absorbed_by_other` known.

Neither contested warning status nor unknown intent blocks establishing the effects.

Do not generalize this into an automatic human-behavior classifier.

- [ ] **Step 5: Implement action validation skeleton**

Supported specimen actions:

```text
NOTICE_RUPTURE
TURN_TO_MERCY
NAME_OCCURRENCE
TEST_PATTERN
WITNESS_CONSEQUENCE
BOUND_COMMITMENT
DISCERN_Y
DISCERN_HOLD
DISCERN_REFUSE
TURN_TO_GRACE
CLOSE_ENCOUNTER
```

Reject impossible ordering with typed errors.

- [ ] **Step 6: Run suite/lint and commit**

```bash
npm test
npm run lint
git add src/lib/graceMercy/brokenPromise.ts tests/grace-mercy-broken-promise.test.ts
git commit -m "feat: derive Broken Promise rupture without motive inference"
```

---

### Task 4: Executable sheet-turn and discernment state machine

**Files:**
- Modify: `src/lib/graceMercy/brokenPromise.ts`
- Modify: `src/lib/graceMercy/projection.ts`
- Modify: `tests/grace-mercy-broken-promise.test.ts`

**Interfaces:**
- Consumes: `BrokenPromiseAction`, current encounter event history.
- Produces:
  - `applyBrokenPromiseAction(input): DomainEvent`
  - typed error codes for illegal transition
  - state transitions for GRACE ⇄ MERCY, boundary, Y/HOLD/REFUSE, closure.

- [ ] **Step 1: Write failing mainline REFUSE test**

Use this exact action sequence:

```text
NOTICE_RUPTURE
TURN_TO_MERCY
NAME_OCCURRENCE
TEST_PATTERN
WITNESS_CONSEQUENCE
BOUND_COMMITMENT
DISCERN_REFUSE
CLOSE_ENCOUNTER
```

Assert:
- starting side GRACE;
- `TURN_TO_MERCY` creates one explicit sheet-turn event;
- boundary scope is `commitment:renew-under-same-conditions`;
- discernment is REFUSE;
- disposition is BOUNDED for the first specimen;
- person/relationship is not deleted;
- ending side may remain MERCY;
- intent remains UNKNOWN.

- [ ] **Step 2: Write failing HOLD path**

Sequence ends with `DISCERN_HOLD`.

Assert:
- HOLD closes successfully;
- disposition remains UNRESOLVED;
- no failure status is emitted;
- no reconciliation event is fabricated.

- [ ] **Step 3: Write failing Y scope test**

For `DISCERN_Y`, require a narrowed proposed crossing from the fixture:

```text
commitment:one-retry-with-explicit-check-in
```

Assert Y applies only to that proposal and does not clear previous evidence or consequences.

- [ ] **Step 4: Write failing return-to-Grace boundary test**

After REFUSE, append `TURN_TO_GRACE`.

Assert:
- current sheet becomes GRACE;
- active boundary remains;
- discernment receipt remains in history;
- no event equivalent to `relationship.restored`, `access.restored`, or `forgiven` is produced.

- [ ] **Step 5: Run RED**

```bash
npm test -- tests/grace-mercy-broken-promise.test.ts
```

- [ ] **Step 6: Implement minimal state machine**

Each accepted action emits exactly one `DomainEvent` with:
- `aggregateType: 'mercy_encounter'`;
- encounter aggregate ID;
- actor ID;
- explicit payload;
- no hidden mutation.

Use event types:

```text
mercy.rupture_noticed
mercy.sheet_turned
mercy.occurrence_named
mercy.pattern_tested
mercy.consequence_witnessed
mercy.boundary_set
mercy.discerned
mercy.encounter_closed
```

- [ ] **Step 7: Run full suite/lint and commit**

```bash
npm test
npm run lint
git add src/lib/graceMercy tests/grace-mercy-broken-promise.test.ts
git commit -m "feat: execute Grace Mercy discernment loop"
```

---

### Task 5: Canonical MercyEncounterReceipt and replay safety

**Files:**
- Create: `src/lib/graceMercy/receipt.ts`
- Create: `tests/grace-mercy-receipt.test.ts`
- Modify: `src/lib/graceMercy/index.ts`

**Interfaces:**
- Consumes: closed encounter projection and scoped `DomainEvent[]`.
- Produces:
  - `MercyEncounterReceipt`
  - `buildMercyEncounterReceipt(...)`
  - `canonicalMercyReceiptHash(receiptWithoutHash): string`
  - `validateMercyReceipt(receipt): MercyReceiptValidation`

- [ ] **Step 1: Write failing receipt test**

The REFUSE fixture receipt must contain:
- encounter ID;
- character ref;
- rupture ref;
- `startingSheet: 'GRACE'`;
- sheet turns;
- evidence refs;
- unknowns including intent;
- boundary refs;
- `discernment: 'REFUSE'`;
- `disposition: 'BOUNDED'`;
- consequences;
- ending sheet;
- nonClaims;
- canonical SHA-256 receipt hash.

- [ ] **Step 2: Add required non-claim test**

Assert exact required non-claims are present:

```text
does_not_establish_motive
does_not_diagnose_person
does_not_establish_moral_worth
does_not_establish_divine_interpretation
does_not_restore_relationship
does_not_remove_consequence
```

- [ ] **Step 3: Add replay/duplicate tests**

Assert:
- same ordered accepted event history produces same receipt hash;
- duplicate event ID is rejected;
- two distinct occurrence IDs with otherwise identical payloads remain distinct histories;
- an attempted duplicate action event cannot create a second boundary or second discernment receipt.

- [ ] **Step 4: Run RED**

```bash
npm test -- tests/grace-mercy-receipt.test.ts
```

- [ ] **Step 5: Implement canonical JSON hashing locally**

Use Node `crypto.createHash('sha256')` and recursively sorted object keys. Keep this helper scoped inside `graceMercy/receipt.ts` unless an existing canonical helper is discovered during execution and is demonstrably equivalent.

Arrays remain order-sensitive.

- [ ] **Step 6: Implement validation**

Validation checks structure and bounded claims only.

It must not claim:
- motive truth;
- moral truth;
- legal validity;
- clinical meaning;
- theological authority.

- [ ] **Step 7: Run suite/lint and commit**

```bash
npm test
npm run lint
git add src/lib/graceMercy/receipt.ts src/lib/graceMercy/index.ts tests/grace-mercy-receipt.test.ts
git commit -m "feat: seal bounded Mercy encounter receipts"
```

---

### Task 6: Persist encounter actions through the existing Full Measure server rail

**Files:**
- Modify: `server.ts`
- Modify: `src/lib/api.ts`
- Create: `tests/grace-mercy-http.test.ts`

**Interfaces:**
- Consumes: encounter kernel functions.
- Produces:
  - `GET /api/grace-mercy/broken-promise/:userId`
  - `POST /api/grace-mercy/broken-promise/:userId/action`
  - client methods `api.getGraceMercyEncounter(userId)`
  - `api.postGraceMercyAction(userId, action, actionId)`

- [ ] **Step 1: Write failing HTTP-contract test**

The test must prove:
- initial GET derives GRACE state from existing event history;
- POST accepts only a named `BrokenPromiseAction`;
- actor comes from existing `x-user-id` behavior and must match route user for v0.1;
- client cannot submit arbitrary event type, event ID, receipt hash, motive claim, diagnosis, or disposition payload;
- illegal transition returns HTTP 409;
- duplicate `actionId` returns the existing result or 409 without creating another event;
- prior events cannot be edited or deleted through this surface.

- [ ] **Step 2: Run RED**

```bash
npm test -- tests/grace-mercy-http.test.ts
```

Expected: route not found.

- [ ] **Step 3: Add route-scoped event reconstruction**

Encounter ID:

```text
grace-mercy:broken-promise-001:<userId>
```

Read relevant events from `store.domainEvents`, sort into chronological order for projection, and never treat array storage order as semantic history.

- [ ] **Step 4: Add action endpoint**

The route:
1. authenticates current simulated actor through existing header convention;
2. validates action/actionId;
3. reconstructs projection;
4. validates transition;
5. records one `DomainEvent`;
6. saves datastore;
7. returns new projection and receipt if closed.

Do not add a second mutable encounter object to `JubileeDataStore`.

- [ ] **Step 5: Add API client methods**

Client request body:

```json
{
  "actionId": "ui-action-001",
  "action": "TURN_TO_MERCY"
}
```

No client-computed evidence or receipt payload is accepted.

- [ ] **Step 6: Run suite/lint and commit**

```bash
npm test
npm run lint
git add server.ts src/lib/api.ts tests/grace-mercy-http.test.ts
git commit -m "feat: persist Mercy actions as Full Measure traces"
```

---

### Task 7: Dual-sided character-sheet UI

**Files:**
- Create: `src/components/GraceMercyDualSheet.tsx`
- Modify: `src/components/FullMeasureView.tsx`
- Modify: `src/App.tsx`
- Create: `tests/grace-mercy-panel.test.ts`

**Interfaces:**
- Consumes: active `currentUser`, existing `FullMeasureSheet`, Grace/Mercy API projection.
- Produces:
  - visible GRACE face;
  - explicit `TURN THE SHEET` control only when Mercy is available;
  - MERCY face with evidence/unknowns/boundary/discernment;
  - preserved shared character header.

- [ ] **Step 1: Write failing static panel contract test**

Following existing component-source tests, assert source contains:
- `GRACE`;
- `MERCY`;
- `TURN THE SHEET`;
- `What good can live here?`;
- `What actually happened`;
- `Y`;
- `HOLD`;
- `REFUSE`;
- no copy saying `evil form`, `dark side`, `enemy person`, `forgiven = restored`, or equivalent.

- [ ] **Step 2: Add failing shared-character presentation test**

Assert the component receives one `characterRef` / current profile and does not render a second avatar identity for Mercy.

- [ ] **Step 3: Run RED**

```bash
npm test -- tests/grace-mercy-panel.test.ts
```

- [ ] **Step 4: Implement the Grace face**

Grace face shows:
- existing character name/avatar;
- question: `What good can live here?`;
- initial objective: `HELP THEM SUCCEED`;
- fixture evidence summary;
- `MERCY AVAILABLE` only after rupture is established;
- explicit sheet-turn button.

It does not relabel the existing Full Measure measures as Grace points.

- [ ] **Step 5: Implement the Mercy face**

Mercy face shows:
- same character identity;
- question: `What actually happened, what must remain protected, and what lawful relationship is still possible now?`;
- columns/sections for KNOWN / CONTESTED / UNKNOWN;
- current boundary;
- available next actions;
- Y / HOLD / REFUSE only when state machine permits them;
- receipt/non-claim summary after closure.

Use restrained visual transformation: same parchment/character body, different orientation and protective stillness. Do not use monstrous/corrupted styling.

- [ ] **Step 6: Preserve boundary on return**

After `TURN_TO_GRACE`, Grace face must visibly retain a compact `Boundary still active` notice when applicable.

- [ ] **Step 7: Integrate into FullMeasureView**

Place the dual sheet adjacent to the current Character card, not inside the measure grid. Pass existing character identity; do not create a separate profile.

- [ ] **Step 8: Run tests/lint/build and commit**

```bash
npm test
npm run lint
npm run build
git add src/components/GraceMercyDualSheet.tsx src/components/FullMeasureView.tsx src/App.tsx tests/grace-mercy-panel.test.ts
git commit -m "feat: turn the Full Measure character sheet toward Mercy"
```

---

### Task 8: Deterministic Broken Promise specimen and docs

**Files:**
- Create: `scripts/grace-mercy-broken-promise-001.ts`
- Create: `examples/grace-mercy-broken-promise-001/README.md`
- Create: `examples/grace-mercy-broken-promise-001/expected-receipt.json`
- Create: `docs/protocol/grace-mercy-dual-sheet-v01.md`
- Create: `docs/protocol/grace-mercy-broken-promise-001.md`
- Modify: `package.json`
- Modify: `README.md`

**Interfaces:**
- Consumes: same kernel used by HTTP/UI.
- Produces:
  - `npm run grace-mercy:001`
  - one deterministic REFUSE-path receipt;
  - one human-readable trace.

- [ ] **Step 1: Add npm script**

```json
"grace-mercy:001": "node --import tsx scripts/grace-mercy-broken-promise-001.ts"
```

- [ ] **Step 2: Implement deterministic script**

Use fixed:
- character ref: `specimen:grace`;
- encounter ID: `grace-mercy:broken-promise-001:specimen-grace`;
- actor ref: `specimen:grace`;
- timestamps;
- action IDs.

Execute the main REFUSE sequence from Task 4.

Print:
- each event type;
- final side;
- discernment;
- disposition;
- active boundary;
- unknown motive status;
- receipt hash.

- [ ] **Step 3: Freeze expected receipt**

Run the script and write the resulting receipt to `examples/grace-mercy-broken-promise-001/expected-receipt.json`.

The expected receipt must preserve:
- `discernment: "REFUSE"`;
- `disposition: "BOUNDED"`;
- `endingSheet: "MERCY"`;
- unknown intent;
- no person-enemy claim.

- [ ] **Step 4: Write protocol docs**

`grace-mercy-dual-sheet-v01.md` documents:
- same-character projection;
- shared body/history;
- sheet turn semantics;
- evidence states;
- Y/HOLD/REFUSE;
- dispositions;
- non-claims.

`grace-mercy-broken-promise-001.md` documents:
- fixture facts;
- Grace opening objective;
- rupture;
- Mercy sequence;
- successful REFUSE;
- valid HOLD;
- boundary persistence;
- why the specimen does not establish motive.

- [ ] **Step 5: Update README**

Add a bounded current-frontier section with command:

```bash
npm run grace-mercy:001
```

State clearly that the specimen is not:
- combat;
- diagnosis;
- legal/emergency advice;
- a moral score;
- automatic reconciliation.

- [ ] **Step 6: Run specimen twice**

```bash
npm run grace-mercy:001 > /tmp/grace-mercy-a.txt
npm run grace-mercy:001 > /tmp/grace-mercy-b.txt
diff -u /tmp/grace-mercy-a.txt /tmp/grace-mercy-b.txt
```

Expected: no diff.

- [ ] **Step 7: Run full check and commit**

```bash
npm run check
git add package.json README.md scripts examples/grace-mercy-broken-promise-001 docs/protocol
git commit -m "feat: close GRACE-MERCY-BROKEN-PROMISE-001"
```

---

### Task 9: Constitutional audit

**Files:**
- Modify only files required by verified findings.
- Test: full suite and specimen.

**Interfaces:**
- Consumes: complete crater.
- Produces: no new gameplay feature.

- [ ] **Step 1: Search for prohibited identity/morality collapse**

Run:

```bash
grep -RniE 'evil form|dark side|enemy person|sin score|karma score|forgiveness points|moral score|diagnos|lie detector' src server.ts scripts docs/protocol README.md || true
```

Review every match. Documentation that explicitly says a thing is not implemented is acceptable; gameplay/runtime promotion is not.

- [ ] **Step 2: Search for automatic restoration/promotion language**

```bash
grep -RniE 'automatic.*reconcil|automatic.*restore|forgiven.*restored|refuse.*delete|intent.*guilty|divine approval' src server.ts scripts docs/protocol README.md || true
```

Review every match.

- [ ] **Step 3: Verify Full Measure measure isolation**

Run:

```bash
npm test -- tests/fullMeasure.test.ts tests/grace-mercy-projection.test.ts
```

Expected: Mercy traces leave existing measures unchanged.

- [ ] **Step 4: Verify all three discernment outcomes**

Run:

```bash
npm test -- tests/grace-mercy-broken-promise.test.ts tests/grace-mercy-receipt.test.ts
```

Expected: Y, HOLD, REFUSE paths all pass and remain scoped.

- [ ] **Step 5: Verify HTTP replay/idempotence**

```bash
npm test -- tests/grace-mercy-http.test.ts
```

Expected: duplicate action IDs do not create duplicate encounter events.

- [ ] **Step 6: Run complete repository check**

```bash
npm run check
npm run grace-mercy:001
```

Expected: all commands exit 0.

- [ ] **Step 7: Manually verify constitutional invariants**

Confirm:
1. same person on both sides;
2. no history erased on flip;
3. Mercy does not read as evil combat form;
4. motive is not required for boundary;
5. REFUSE does not delete person/carrier;
6. HOLD is successful;
7. forgiveness/access are not collapsed;
8. reconciliation is optional;
9. separation is not automatically punishment;
10. low capacity is not moral failure;
11. no diagnosis;
12. no fabricated witness;
13. Grace return preserves boundary;
14. fixture has no required villain;
15. specimen can end in Mercy;
16. repair does not imply prior-state restoration;
17. neither sheet is ranked as morally superior.

- [ ] **Step 8: Commit audit corrections only if required**

```bash
git add -A
git commit -m "fix: preserve Grace Mercy constitutional boundaries"
```

Do not create an empty commit when no corrections are necessary.

---

## Plan self-review result

### Spec coverage

Implemented in this crater:
- one particular character with two sheet projections;
- Grace and Mercy verb vocabularies;
- explicit TURN THE SHEET event;
- EnemyOccurrence-compatible occurrence focus without permanent enemy-person label;
- rupture representation;
- evidence-state separation;
- Mercy availability from established harm without motive inference;
- Y / HOLD / REFUSE;
- first set of Mercy dispositions;
- boundary persistence;
- low-capacity-compatible HOLD/REFUSE semantics at contract level;
- bounded MercyEncounterReceipt;
- existing Full Measure measure isolation;
- persisted encounter actions as DomainEvents;
- dual-sided React character surface;
- Broken Promise deterministic specimen;
- Full Measure integration and future STATIC FIELD seam documentation.

Intentionally not generalized in this crater:
- arbitrary rupture detection from live user behavior;
- combat;
- automatic intent inference;
- legal consequence evaluation;
- clinical or spiritual judgment;
- generalized forgiveness workflow;
- multiplayer conflict adjudication;
- world-spanning Mercy progression;
- STATIC FIELD runtime adapter;
- Paula-world runtime adapter.

### Type consistency

The plan consistently uses:
- `SheetSide` for GRACE/MERCY;
- `EvidenceState` for epistemic state;
- `Discernment` for Y/HOLD/REFUSE;
- `MercyDisposition` for encounter disposition;
- `RuptureProjection` for rupture state;
- `MercyEncounterProjection` for current derived state;
- `DomainEvent` with `aggregateType: 'mercy_encounter'` for persisted actions;
- `MercyEncounterReceipt` for closed bounded receipt.

The UI never owns canonical encounter state.

### Review Focus coverage

- Hidden XP leakage → Task 2 regression.
- Motive fabrication → Tasks 3 and 4.
- Boundary loss on Grace return → Tasks 4 and 7.
- REFUSE overreach → Tasks 4 and 5.
- Duplicate action replay → Tasks 5 and 6.

### Dependency and scope check

No new runtime dependency is required.

The existing Full Measure datastore remains the only persistence plane.

The first specimen is fixture-backed by design so the system proves discernment mechanics without inferring real human hostility from production data.

### Execution recommendation

Use **native execution** if no true subagent-spawn interface is exposed. The nine tasks share a tight event/projection interface and the repository already has a coherent Node/React test harness; TDD plus the final constitutional audit is efficient here. If real subagents are available at execution time, subagent-driven is preferable for Tasks 3–7 because motive/evidence boundaries and server persistence carry the highest semantic risk.

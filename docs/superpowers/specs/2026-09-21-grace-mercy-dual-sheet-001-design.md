# GRACE-MERCY-DUAL-SHEET-001 — Design Constitution

**Status:** design constitution / review gate  
**Date:** 2026-09-21  
**Repository:** `the-static-collective/full-measure-world-layer`  
**Scope:** first advanced dual-sheet mutation for the Grace game-world / Full Measure character surface  
**Extraction rule:** this file lives in Full Measure because Full Measure currently owns the character-sheet/world-runtime surface. If Grace later receives a dedicated repository, this design may move by reference without changing its receipt history.

> **Grace makes room for life.**  
> **Mercy keeps rupture from becoming terminal.**  
> **Mercy does not erase the receipt.**  
> **Grace does not require reopening a door Mercy lawfully closed.**

## 0. Intent

GRACE-MERCY-DUAL-SHEET-001 adds a second advanced character projection for situations in which ordinary cultivation, generosity, encouragement, or connection are insufficient because a genuine rupture has occurred.

This is not:
- a combat class;
- a dark/evil transformation;
- a personality split;
- a morality meter;
- a diagnosis engine;
- a punishment mode;
- a replacement for Grace.

It is one character viewed through two lawful action grammars.

```text
                 ONE PARTICULAR CHARACTER
                          │
               shared history / body
               relationships / receipts
                 consequences / memory
                          │
            ┌─────────────┴─────────────┐
            │                           │
         GRACE                        MERCY
      cultivation                 discernment
      possibility                  protection
      invitation                    boundary
      connection                  consequence
      giving                         repair
```

The theatrical feeling may evoke a Jekyll/Hyde-style flip, but the ontology must not.

The person does not become someone else.

The person **turns the same sheet over**.

## 1. Ancestral formation seam

Two earlier formation artifacts are relevant but not self-promoting authority.

### 1.1 “Now the sheet has two sides”

The protected Sept. 2 formation witness described a negative sheet of non-collapse laws and a positive sheet of lawful connection. It also exposed a three-way discernment operation:

```text
Y
HOLD
REFUSE
```

Its own protection rule marks it as a creative formation witness, not runtime canon.

This design does not silently promote that artifact wholesale.

It adopts only the parts explicitly re-specified here.

### 1.2 “Mercy keeps rupture from becoming terminal”

The Aug. 26 Mercy formation note proposed:

> **RECONSTITUTED CONTINUITY ≠ UNBROKEN CONTINUITY.**

and:

> **MERCY MAY BE THE PRESERVATION OF RELATIONAL POSSIBILITY WITHOUT DELETING THE RECEIPT.**

Again, this design does not treat that reading as a universal lexical or theological definition.

It adopts the structural kernel as a game-mechanic design rule.

## 2. Founding distinction

Grace and Mercy operate on the same character history.

They ask different questions.

### GRACE

> **What good can live here?**

Grace is the posture of cultivation, invitation, provision, encouragement, connection, play, care, creation, and outward possibility.

### MERCY

> **What actually happened, what must remain protected, and what lawful relationship is still possible now?**

Mercy is the posture of discernment, boundary, consequence, interruption, repair, restitution, separation, release, and truthful continuity after rupture.

Mercy is not anti-Grace.

Mercy protects the conditions under which Grace can remain truthful.

## 3. Shared character body

The following fields belong to the character, not to one side of the sheet:

```text
identity
body
capacity
history
relationships
inventory
cards
ancestry
promises
open_threads
witnessed_occurrences
consequences
commitments
boundaries
current_world
current_party
```

A sheet flip may change:
- available verbs;
- current objective language;
- encounter interpretation affordances;
- which derived risks are visible;
- which dispositions can be selected.

A sheet flip may not:
- clear history;
- duplicate inventory;
- erase consequences;
- create a new identity;
- silently revoke a boundary;
- fabricate a witness;
- manufacture evidence;
- restore a relationship by UI transition alone.

## 4. Grace sheet contract

Grace remains the default cultivation posture when no rupture requires advanced discernment.

### 4.1 Native Grace verbs

Initial vocabulary:

```text
WELCOME
ENCOURAGE
GIVE
CONNECT
PLANT
FEED
PLAY
PRAY
BUILD
INVITE
TEACH
RECEIVE
BLESS
CELEBRATE
POUR
```

This list is extensible through explicit versioning.

### 4.2 Grace risks

Grace can become structurally distorted if connection or giving outruns protection, capacity, evidence, or consent.

Possible derived risks:

- OVEREXTENSION
- ENABLING
- FALSE_PEACE
- SELF_ERASURE
- UNBOUNDED_GIVING
- ASSUMED_CONSENT
- PREMATURE_RECONCILIATION

These are game-system conditions.

They are not psychiatric, moral, or spiritual diagnoses of real people.

### 4.3 Grace success

Grace does not score “goodness.”

A successful Grace act produces attributable changes such as:
- someone received food;
- a participant was invited;
- a relationship gained an available next step;
- a room became more usable;
- a promise was kept;
- rest occurred;
- a new creation was made;
- a person explicitly accepted help.

## 5. Mercy sheet contract

Mercy becomes available when a rupture, hostile occurrence, active risk, unresolved harm, or repeated failed crossing requires a different action grammar.

### 5.1 Native Mercy verbs

```text
NOTICE
NAME
TEST
HOLD
WITNESS
BOUND
INTERRUPT
REFUSE
SEPARATE
REPAIR
RESTITUTE
RECONCILE
RELEASE
RETURN
```

### 5.2 Mercy founding law

> **Mercy preserves truthful possibility after rupture without deleting the receipt.**

Mercy therefore rejects:

```text
MERCY = DELETE CONSEQUENCE
```

and rejects:

```text
FORGIVEN = AUTOMATICALLY RESTORED TO PRIOR ACCESS
```

### 5.3 Mercy risks

Mercy may itself become structurally distorted if protection loses connection, faithfulness, or future possibility.

Possible derived risks:

- HARDENING
- ISOLATION
- PERMANENT_DEFENSE
- UNIVERSAL_REFUSAL
- RETALIATION_AS_REPAIR
- CONSEQUENCE_WITHOUT_REVIEW
- BOUNDARY_WITHOUT_SCOPE

Again: these are game states, not diagnoses.

## 6. Enemy occurrence contract

The game should prefer **ENEMY OCCURRENCE** over automatically creating an enemy-person ontology.

```ts
interface EnemyOccurrence {
  occurrenceId: string;
  participantRefs: readonly string[];
  knownHarmRefs: readonly string[];
  evidenceRefs: readonly string[];
  contestedClaimRefs: readonly string[];
  unknowns: readonly string[];
  activeRiskRefs: readonly string[];
  affectedRelationshipRefs: readonly string[];
  priorAttemptRefs: readonly string[];
}
```

An EnemyOccurrence may absolutely include intentional hostility.

The system does not have to soften or deny malicious action.

It must still distinguish:

```text
PERSON PARTICIPATED IN HARM
```

from:

```text
PERSON = PERMANENT ENEMY ONTOLOGY
```

unless a particular fictional world explicitly defines some non-human adversarial ontology under its own rules.

## 7. Rupture

A **Rupture** is a typed relation between an occurrence and one or more previously available continuities.

Examples:
- promise broken;
- consent withdrawn;
- trust materially damaged;
- repeated unsafe behavior;
- deception established;
- responsibility abandoned;
- resource misused;
- active coercion;
- system overload;
- false urgency causing harm;
- boundary crossed;
- repair attempt failed;
- relationship terms become mutually incompatible.

A rupture does not itself prove motive.

```ts
interface Rupture {
  ruptureId: string;
  occurrenceRef: string;
  affectedContinuityRefs: readonly string[];
  evidenceRefs: readonly string[];
  knownEffects: readonly string[];
  unknowns: readonly string[];
  status: "candidate" | "established" | "contested";
}
```

## 8. The flip — TURN THE SHEET

The transition command is:

> **TURN THE SHEET**

The UI may render this as a physical/digital card or sheet flip.

The runtime event should be explicit:

```ts
interface SheetTurnEvent {
  from: "GRACE" | "MERCY";
  to: "GRACE" | "MERCY";
  reasonRef?: string;
  actorRef: string;
  occurredAt: string;
}
```

### 8.1 Entering Mercy

The game may surface:

> **RUPTURE DETECTED**  
> **MERCY AVAILABLE**

It must not automatically declare:
- the player's emotion;
- another person's motive;
- guilt;
- spiritual meaning;
- required punishment.

The player chooses the posture when choice is available.

World-specific emergency mechanics may temporarily constrain available actions, but those constraints must be explicit and independently receipted.

### 8.2 Returning to Grace

Returning to Grace is not equivalent to:
- forgiving;
- reconciling;
- reopening access;
- restoring a prior role;
- removing a consequence.

Grace becomes available again when enough truthful possibility exists for cultivation.

Some encounters validly end in Mercy.

Some remain in HOLD.

Some relationships remain separated.

## 9. Discernment operator — Y / HOLD / REFUSE

Mercy's core decision operator is:

```text
candidate relation
       │
       ▼
    DISCERN
   /   |    \
  Y   HOLD  REFUSE
```

### Y

The specific proposed crossing may continue under current evidence, boundaries, capacity, and authority.

Y is local and scoped.

It is not universal approval.

### HOLD

The relation remains unresolved because:
- evidence is insufficient;
- capacity is insufficient;
- witness is missing;
- timing is unsafe;
- necessary authority is absent;
- the parties are not ready;
- the condition is genuinely undecidable at present.

HOLD is a successful discernment outcome.

### REFUSE

The specific crossing is not admitted under current conditions.

REFUSE:
- does not delete the carrier;
- does not erase the person;
- does not falsify prior relationship;
- does not imply every future relationship is impossible;
- does preserve why this crossing did not pass.

A REFUSE receipt must retain:
- proposed crossing;
- scope;
- evidence available;
- boundary invoked;
- disposition;
- unresolved unknowns.

## 10. Mercy dispositions

After a rupture, a relationship or obligation may reach one of these initial dispositions:

```text
RECONCILED
REPAIRED_BUT_DIFFERENT
BOUNDED
SEPARATED
RELEASED
REFERRED
UNRESOLVED
```

### RECONCILED

Relationship continues with mutually established terms.

This may require repair/restitution and cannot be selected merely because one participant desires reconciliation.

### REPAIRED_BUT_DIFFERENT

A consequence has been repaired enough to create a viable relationship, but the former state is not restored.

### BOUNDED

Relationship continues under explicit limits.

### SEPARATED

No active relational crossing continues.

Separation may be protective rather than punitive.

### RELEASED

A participant is no longer responsible for carrying a particular obligation, task, or attempted repair.

### REFERRED

The occurrence requires another person, role, institution, authority, or specialist.

### UNRESOLVED

No disposition can truthfully be established yet.

## 11. Forgiveness / reconciliation / access separation

The runtime must not collapse these concepts.

At minimum:

```text
FORGIVENESS ≠ RECONCILIATION
RECONCILIATION ≠ RESTORED ACCESS
RESTORED ACCESS ≠ RESTORED ROLE
REPAIR ≠ RETURN TO PREVIOUS STATE
BOUNDARY ≠ PUNISHMENT
SEPARATION ≠ ERASURE
MERCY ≠ ABSENCE OF CONSEQUENCE
```

These distinctions may be used even when a world does not explicitly model forgiveness as a mechanic.

## 12. Capacity

Mercy consumes and protects capacity differently from Grace.

A participant with low capacity may have:

```text
available:
  NOTICE
  HOLD
  REFUSE
  ASK_FOR_HELP
  LEAVE

unavailable:
  REPAIR
  RECONCILE
  RESTITUTE
```

The system must never imply that insufficient capacity is moral failure.

Mercy toward self may include:
- resting;
- leaving;
- refusing another turn;
- asking for witness;
- delegating;
- releasing responsibility;
- separating.

## 13. Evidence and unknowns

Mercy must visibly preserve:

```text
KNOWN
REPORTED
DERIVED
CONTESTED
UNKNOWN
```

A hostile occurrence often arrives with incomplete motive information.

Mercy acts on established effects and present risk without requiring fabricated certainty about motive.

Example:

```text
KNOWN:
  commitment was not fulfilled

KNOWN:
  another participant absorbed the consequence

UNKNOWN:
  intent

CONTESTED:
  whether warning was communicated
```

The system may still establish a boundary.

Unknown motive does not require unknown harm.

## 14. The first Mercy specimen — THE BROKEN PROMISE

The first executable proof should be deliberately ordinary.

No boss.

No violence.

No supernatural enemy.

A meaningful promise was made.

It was not fulfilled.

The initial Grace posture presents:

> **HELP THEM SUCCEED**

New evidence reveals:
- this is not the first miss;
- another participant has repeatedly absorbed the consequences;
- continuing under identical assumptions creates active risk.

The game surfaces:

> **RUPTURE DETECTED**  
> **MERCY AVAILABLE**

The player may:

> **TURN THE SHEET**

Objective becomes:

> **ESTABLISH WHAT ACTUALLY HAPPENED**

### 14.1 Required Mercy actions

The specimen must support:

```text
NAME
TEST
WITNESS
BOUND
HOLD
DISCERN
```

### 14.2 Required facts

The fixture should distinguish:

```text
promise_made
promise_missed_1
promise_missed_2
consequence_absorbed_by_other
warning_status_contested
intent_unknown
```

### 14.3 Required successful outcome

At minimum one valid path must close:

```text
REFUSE:
do not renew this exact commitment
under the same conditions
```

This is a successful Mercy result.

It does not require:
- declaring the person evil;
- ending every relationship;
- assigning motive;
- restoring trust;
- reopening Grace immediately.

### 14.4 Alternate valid outcomes

Depending on evidence or chosen boundaries:

- HOLD pending witness;
- BOUND the commitment;
- REFER the responsibility;
- RELEASE the affected participant from carrying it;
- REPAIRED_BUT_DIFFERENT after restitution.

The first specimen need not implement every disposition, but the contract must leave room for them.

## 15. First Mercy receipt

A bounded `MercyEncounterReceipt` should include:

```ts
interface MercyEncounterReceipt {
  encounterId: string;
  characterRef: string;
  ruptureRef: string;
  startingSheet: "GRACE";
  sheetTurns: readonly SheetTurnEvent[];
  evidenceRefs: readonly string[];
  unknowns: readonly string[];
  boundaries: readonly string[];
  discernment: "Y" | "HOLD" | "REFUSE";
  disposition:
    | "RECONCILED"
    | "REPAIRED_BUT_DIFFERENT"
    | "BOUNDED"
    | "SEPARATED"
    | "RELEASED"
    | "REFERRED"
    | "UNRESOLVED";
  consequences: readonly string[];
  endingSheet: "GRACE" | "MERCY";
  nonClaims: readonly string[];
}
```

Required non-claims include:

- no claim of motive unless directly established;
- no diagnosis;
- no claim of moral worth;
- no automatic theological interpretation;
- no automatic restoration of relationship;
- no automatic removal of consequence.

## 16. Character-sheet presentation

The visual design should make the same-character continuity obvious.

### Grace face

Possible visual posture:
- open;
- outward;
- growing;
- relational;
- inviting;
- generative.

### Mercy face

Possible visual posture:
- still;
- attentive;
- one hand protecting;
- one hand examining or holding the rupture;
- not monstrous;
- not corrupted;
- not visually coded as evil.

The flip should feel consequential.

The identity should feel continuous.

A viewer should be able to understand:

> **Same person. Different lawful posture.**

## 17. Full Measure integration

Full Measure currently exposes factual character measures and witnessed participation.

GRACE-MERCY-DUAL-SHEET-001 must not replace those measures with a morality system.

Grace/Mercy is a **projection over the character state**, not a second source of truth.

Full Measure remains responsible for its existing evidence and witness boundaries.

Mercy may consume:
- attributable occurrences;
- witness;
- commitments;
- consequences;
- unresolved status.

Mercy may emit:
- sheet-turn events;
- named rupture;
- explicit boundaries;
- discernment disposition;
- repair/release/referral consequences.

It may not manufacture:
- witnessed deeds;
- canonical motive;
- consent;
- external legal authority;
- mental-health diagnosis.

## 18. STATIC FIELD Crossing seam

STATIC FIELD may later recognize Mercy capability without owning it.

Example:

```text
STATIC FIELD phenomenon:
  FEEDBACK

party state:
  Grace/Mercy-capable character present

available:
  MERCY POSTURE
```

STATIC FIELD may present an occurrence requiring:
- boundary;
- interruption;
- separation;
- repair;
- HOLD;
- REFUSE.

The resulting Mercy receipt remains attributable to the character/world contract that produced it.

STATIC FIELD does not redefine what Mercy means.

## 19. Paula-world seam

The dual sheet is particularly relevant to a world containing:
- single-parent decisions;
- caregiving;
- dream/fantasy material;
- rebuilding;
- hostile or unsafe occurrences;
- interrupted plans;
- relationships that may need repair or separation;
- personal utopia/meaning building.

The system must preserve that:
- care is not infinite capacity;
- mercy toward another does not require self-erasure;
- mercy toward self may require boundary or exit;
- reconciliation is one possible outcome, not the mandatory ending.

## 20. Safety boundary

GRACE-MERCY-DUAL-SHEET-001 is a game/system mechanic.

It must not present itself as:
- legal advice;
- medical advice;
- mental-health diagnosis;
- domestic-violence risk assessment;
- clergy authority;
- divine command;
- emergency decision automation.

Real-world high-risk situations should route outward to appropriate human/emergency/professional support rather than gamifying imminent danger.

## 21. Non-goals for v0.1

Do not build yet:

- combat damage;
- enemy HP;
- alignment;
- sin score;
- karma score;
- forgiveness points;
- generalized personality typing;
- automatic intent inference;
- AI lie detector;
- automatic reconciliation;
- punishment generator;
- legal consequence engine;
- theological truth engine;
- persistent opponent labels;
- world-spanning Mercy progression tree.

The first proof is one ordinary rupture handled truthfully.

## 22. Required invariants

The implementation is wrong if:

1. Grace and Mercy become separate people.
2. Turning the sheet erases history.
3. Mercy becomes a dark/evil combat form.
4. Mercy requires assigning motive before setting a boundary.
5. REFUSE deletes the person or carrier.
6. HOLD is treated as failure.
7. Forgiveness silently restores access.
8. Reconciliation becomes mandatory.
9. Separation is treated automatically as punishment.
10. Low capacity becomes moral failure.
11. The runtime diagnoses a real person.
12. The game invents witness.
13. Returning to Grace removes a Mercy boundary automatically.
14. The first specimen requires a villain.
15. The Broken Promise cannot validly end in Mercy.
16. Repair is forced to reproduce the pre-rupture state.
17. Grace is framed as naive and Mercy as superior.
18. Mercy is framed as cynical and Grace as superior.

## 23. First implementation crater

After this design is approved and planned, the first implementation should be:

> **GRACE-MERCY-BROKEN-PROMISE-001**

It must prove:

```text
GRACE
  ↓
HELP THEM SUCCEED
  ↓
new attributable evidence
  ↓
RUPTURE DETECTED
  ↓
MERCY AVAILABLE
  ↓
TURN THE SHEET
  ↓
NAME
  ↓
TEST
  ↓
WITNESS
  ↓
BOUND
  ↓
DISCERN
  ↓
REFUSE / HOLD / bounded alternative
  ↓
receipt
  ↓
history preserved
  ↓
Grace may or may not become available again
```

No combat loop is required.

## 24. Constitutional inscription

> **Grace opens the hand.  
> Mercy keeps the hand from being consumed.  
> Grace makes another relation possible.  
> Mercy asks whether this relation may continue truthfully.  
> HOLD is not cowardice.  
> REFUSE is not erasure.  
> Repair does not counterfeit what was broken.  
> The same person turns the sheet.**

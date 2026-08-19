# STRIDE Specimen 001 — Two-Step Witnessed Locomotion Design

## Status

Approved Full Measure-local experiment for issue #23.

## Design sentence

> A stride contains no future authority.

Full Measure may take one witnessed crossing, derive a fresh stance from what actually happened, and then take one separately authorized second crossing. The first confirmation never authorizes the second.

## Existing floor

Current `main` already separates:

```text
WorldFieldProjection / WorldDoorProjection
  -> traversal evidence
  -> explicit human confirmation
  -> Project0 encounter verification
  -> Corpus OS destination-local disposition
  -> WorldEncounterResidue
```

STRIDE does not replace or widen that crossing membrane. It adds a local, deterministic projection over completed encounter outcomes so Full Measure can prove re-orientation between two attempts.

## Local objects

### `StrideStance`

Represents where the session may presently claim to stand.

It contains:

- a stable local stance ref;
- current constituted field/position ref;
- ordered residue refs already accumulated in the specimen session;
- the fresh door refs exposed by the declared local orientation fixture;
- the orientation policy version;
- `authority: "none"`.

A stance is a projection. It never grants crossing authority.

### `StrideFootprint`

Represents what one completed attempted crossing actually left behind.

It contains:

- a stable local footprint ref;
- source stance ref;
- selected door ref and destination ref;
- crossing ref;
- explicit confirmation ref used for this exact attempt;
- disposition class;
- residue ref;
- constituted refs added by this attempt, which must be empty unless admitted;
- `authority: "none"`.

A footprint exists for admitted, refused, indeterminate, failed, and validation-failed outcomes. Historical failure is not erased merely because no destination was constituted.

### `StrideWitness`

Binds exactly one transition:

```text
stanceBefore -> footprint -> stanceAfter
```

It contains no route to later destinations and grants no authority.

## Orientation fixture

Specimen 001 uses a pinned Full Measure-local map. This is deliberately not Founder Node live discovery.

```text
A -> B, C, D
B -> C, E, F
E -> A, F
```

Only declared positions and doors are legal. Fresh orientation always resolves from the current constituted position after the prior footprint.

The fixture is not a universal world graph. It is test material for the locomotion invariant.

## Step law

A step request must supply:

- current stance ref;
- one currently exposed door ref;
- one explicit confirmation ref unique to that attempted step;
- one completed `WorldEncounterResidue` whose source field, door, crossing, outcome, and constituted refs are consistent with the request.

The local evaluator must fail closed when:

- the stance is stale;
- the door is not exposed from the current stance;
- the residue belongs to another source/door/crossing;
- a non-admitted outcome claims constituted destination refs;
- an admitted outcome does not constitute the selected destination ref;
- a confirmation ref is reused;
- a third attempted step is requested.

## Admitted step

For `outcomeClass: "admitted"`:

```text
position_after = selected destination
```

Fresh orientation is then derived from the destination's fixture entry.

No other prior door ordering survives as current truth.

## Refused / indeterminate / failed step

For every non-admitted outcome:

```text
position_after = position_before
```

The footprint and residue remain part of history.

Specimen 001 does not implement residue-sensitive door ranking. The fresh stance records the new residue ref but derives doors only from the same current constituted position. This keeps the first locomotion proof separate from Collision Specimen #21/#22.

## Two-step ceiling

`maxAttemptedSteps = 2` is fixed in v0.1.

A third attempt must return/refuse with a stable local error code rather than executing.

This artificial ceiling is constitutional evidence that STRIDE is not autonomous gait.

## Determinism

All local refs are derived from normalized declared inputs using a small Full Measure-local deterministic serializer and SHA-256 helper scoped only to this module. This helper is not a Project0 canonical address and must use a `stride-local:` prefix so it cannot be confused with shared identity authority.

Array ordering is semantically significant for residue/footprint history and must be preserved. Fixture door arrays are emitted in declared order.

## Invariants

1. A stride contains no future authority.
2. Every attempted step has its own explicit confirmation ref.
3. Reusing a confirmation ref fails closed.
4. Only `admitted` may change constituted position.
5. Refused/indeterminate/failed/validation-failed attempts leave a footprint without constituting the destination.
6. Fresh orientation is derived from the post-footprint constituted position.
7. Previous door ranking is not current orientation truth.
8. Exactly two attempted steps are possible in v0.1.
9. No donor contract changes are required.
10. No automatic retry or route continuation exists.

## Non-goals

- no autonomous traversal;
- no route planner;
- no universal stance/footprint schema;
- no Founder Node live discovery;
- no destination-body retrieval;
- no residue-sensitive ranking in this slice;
- no UI changes;
- no Project0, TranchNode, Corpus OS, or world-runtime type changes;
- no third step;
- no portable STRIDE law claim from one specimen.

## Acceptance specimens

### Positive

```text
STANCE A exposes B/C/D
A -> B admitted using confirmation-1
FOOTPRINT 1
STANCE B exposes C/E/F
B -> E admitted using confirmation-2
FOOTPRINT 2
STANCE E
```

### Refusal

```text
STANCE A
A -> B refused
FOOTPRINT exists
STANCE A remains constituted
residue history grows
```

### Indeterminate

Same as refusal for constituted position, with `indeterminate` preserved as its own outcome.

### Shortcut attack

A prior route suggestion containing `A -> B -> E` grants no second-step authority. The evaluator only accepts the second attempt when a distinct explicit confirmation ref and a matching completed residue are supplied.

### Third-step attack

After two footprints, any third attempt refuses with `STRIDE_STEP_LIMIT_REACHED`.

## Stop condition

Stop when tests prove two-step locomotion and the negative controls above while all existing repository checks remain green.

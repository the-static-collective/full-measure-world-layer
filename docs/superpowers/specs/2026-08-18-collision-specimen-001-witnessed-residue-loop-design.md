# Collision Specimen 001 — Witnessed Residue Loop

**Status:** design-only experimental slice; implementation requires separate approval

**Tracking:** #21

## Design sentence

> Prove that a refused or indeterminate Full Measure encounter may leave deterministic, attributable residue that influences a later projection and may seed one explicitly declared neighboring proposal, while changing neither constituted state nor authority.

## Why this belongs in Full Measure

Full Measure already owns the inhabited world projection and the application-level composition seam around Boot the House:

```text
human
  -> Garden / Human Terminal
  -> Full Measure world runtime
  -> TranchNode traversal decoding
  -> explicit human confirmation
  -> Project0 encounter verification
  -> Corpus OS destination-local disposition
  -> Full Measure residue / changed projection
```

That existing runtime already preserves the distinctions this specimen needs:

- validation failure is not destination refusal;
- refusal is not indeterminate;
- host/donor failure is not refusal;
- only an admitted encounter may carry constituted destination refs;
- residue is inspectable after an encounter without becoming destination authority;
- Human Terminal is already a read-only/operator projection over Full Measure contracts rather than a second execution plane.

The experiment therefore belongs next to the existing world-runtime and operator projections. Creating another repository, global memory layer, or shared primitive package would make the experiment less trustworthy because it would introduce a new authority surface before the local law has been proven.

## Question under test

The current runtime proves that failed or refused history can be remembered without being constituted as destination state.

This specimen tests the stronger claim:

> **Can remembered non-success affect what becomes visible or thinkable next without becoming permission, truth, reachability, or authority?**

A successful specimen must make that claim mechanically falsifiable.

## Primitive collision

The experiment deliberately places several incubating ideas in one bounded field without declaring them equivalent:

### Refusal Topology / Influence Without Authority

A refused or indeterminate encounter may remain queryable and may shape later attention. Its residue cannot mutate constituted state, grant a capability, or inherit the authority of the constitutional boundary that produced it.

### Ghost

The residue is historical presence after the attempted crossing is no longer occurring. It may remain perceptible. It must not counterfeit current presence or current authority.

### Witness Session

The experiment preserves multiple lifecycle claims rather than flattening them into one result. Attempt, confirmation, destination disposition, residue, later projection, and optional descendant proposal remain separately attributable stages.

### Declared-Freedom Descendant

A later neighboring proposal may cite residue as ancestry or pressure only when generation is explicitly invoked under a declared policy. The proposal must name what dimensions were allowed to vary and what changed. It remains a proposal requiring ordinary admission.

### World Re-entry Memory

A compact re-entry seed should preserve enough truthful relation to reconstruct the specimen's navigable local projection in a fresh run. Re-entry is reconstruction from declared surviving relation, not a claim that the original encounter occurred again.

## Approaches considered

### A. Extend `WorldEncounterResidue` into a universal residue object

This would add influence, generation, witness, and re-entry fields directly to the existing world-runtime residue model.

**Rejected for the first specimen.** It would make an experimental projection look constitutional merely because it sits inside an established runtime type. It would also overload one object with persistence, evidence, projection, generation, and reconstruction semantics.

### B. Create a new cross-repository witness/residue package

This would attempt to define a shared Static Collective protocol immediately and have Full Measure consume it.

**Rejected.** The incubator explicitly has not earned a shared schema yet. A universal package would collapse domain-specific triggers and authority meanings before two materially different specimens prove a common contract.

### C. Add a Full Measure-local experimental projection layer over existing residue

This approach leaves `WorldEncounterResidue` and donor contracts unchanged. A small local module consumes existing residue by reference and derives experimental, non-authoritative projections and receipts.

**Selected.** It creates the smallest falsifiable collision while preserving the current constitutional floor. If the experiment fails, the existing world runtime remains intact. If it succeeds, later domains can test the same law independently before any shared abstraction is considered.

## Architectural boundary

The specimen is downstream of the existing encounter and upstream of human-facing explanation only:

```text
existing constitutional path

prepare
  -> explicit confirmation
  -> Project0 verification
  -> Corpus disposition
  -> WorldEncounterResidue

                         immutable input boundary
                                  |
                                  v
                    Collision Specimen 001
                     /       |        \
                    /        |         \
          influence view   witness    optional
              projection    session    descendant
                    \        |         /
                     \       |        /
                      compact re-entry seed
                                  |
                                  v
                     read-only explanation
                    Garden / Human Terminal
```

The collision layer has no port capable of calling Corpus OS, Project0, TranchNode, a shell, or a crossing confirmation endpoint. It receives already-produced evidence and returns projection/evidence objects only.

That absence is intentional. The easiest way to prove residue cannot authorize is to give the residue-processing module no execution capability to begin with.

## Proposed module boundary

Use one Full Measure-local experimental module, initially:

```text
src/lib/collisionSpecimen/
  types.ts
  identity.ts
  influence.ts
  descendant.ts
  witnessSession.ts
  reentry.ts
  index.ts
```

The exact file split may be simplified during implementation if individual files would be trivial. The important boundary is one importable module with pure deterministic transforms and no donor/process dependencies.

Tests should live beside the repository's existing Node test suite, for example:

```text
tests/collision-specimen.test.ts
```

No new persistence service is required for v0.1. The input residue is already persistent for the lifetime of the current Full Measure runtime; derived specimen artifacts may be computed deterministically and returned/read through the existing application surface.

## Input eligibility

Collision Specimen 001 accepts only an existing `WorldEncounterResidue` whose outcome is:

```text
refused | indeterminate
```

It deliberately excludes:

- `admitted` — constituted destination output belongs to the normal successful-world path;
- `validation-failed` — the destination was not lawfully invoked, so treating it as a destination refusal would lie;
- `failed` — transport/donor failure does not establish a constitutional refusal or unresolved destination disposition.

This distinction is part of the test, not incidental validation.

## Local identity rule

The experiment needs deterministic local identities so replay can be tested. It does **not** need a second global canonical identity system.

Derived refs should be computed from a stable, explicitly ordered local input envelope containing only declared specimen fields and a versioned local identity profile.

Example conceptual input:

```ts
{
  profile: 'full-measure.collision-specimen/v0.1',
  kind: 'residual-influence',
  residueRef: 'world-residue:000004',
  outcomeClass: 'refused',
  sourceFieldRef: '...',
  doorRef: '...',
  crossingRef: '...',
  evidenceRefs: ['...'],
  unresolvedRefs: ['...']
}
```

The local helper may use a stable JSON serialization owned by this experimental module and SHA-256 to derive a deterministic ref such as:

```text
collision-influence:sha256:<digest>
```

This identity means only "same declared local specimen input under the same versioned profile." It is not a Project0 canonical address and must not be presented as one.

If a later implementation needs globally interoperable identity, that is a separate boundary and should defer to Project0 rather than widening this helper.

## Residual influence projection

A refused or indeterminate residue may generate a read-only `ResidualInfluence` projection.

Conceptual shape:

```ts
interface ResidualInfluence {
  profile: 'full-measure.residual-influence/v0.1';
  influenceRef: string;
  residueRef: string;
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  outcomeClass: 'refused' | 'indeterminate';
  evidenceRefs: string[];
  unresolvedRefs: string[];
  effect: {
    kind: 'attention-cue' | 'unresolved-frontier';
    targetRef: string;
    reasonRefs: string[];
  };
  authority: 'none';
  mutation: 'forbidden';
}
```

### Refused mapping

A refused residue may produce:

```text
effect.kind = attention-cue
```

The cue means only that a declared attempt previously encountered a refusal at this relation. It may make the relation more explainable or visible in a later read-only projection.

It does **not** mean:

- the door is now reachable;
- the refusal is universally true outside the witnessed cut;
- the reason is current forever;
- a retry is authorized;
- the system should hide or demote contrary evidence.

### Indeterminate mapping

An indeterminate residue must produce:

```text
effect.kind = unresolved-frontier
```

It cannot be silently converted into a refusal cue. The projection should preserve unresolved reason/evidence refs and state that the prior destination disposition was unresolved.

This distinction is a negative control against narrative neatness.

## Projection effect boundary

The first specimen allows influence to affect only **read-only presentation**.

Permitted examples:

- Human Terminal can explain that a nearby relation has prior refused residue;
- residue inspection can surface an unresolved frontier;
- a later local view may include a weak `historical pressure` / `prior encounter` cue;
- a human may explicitly choose to inspect or generate a neighboring proposal from that cue.

Forbidden effects:

- changing `WorldDoorProjection.reachability`;
- changing `WorldDoorProjection.authority`;
- selecting a door;
- calling `prepare` or `confirm`;
- manufacturing a confirmation receipt;
- altering a destination adapter request;
- adding `constitutedDestinationRefs`;
- mutating the original residue;
- auto-generating a descendant merely because residue exists.

The first implementation should prefer a new read-only response field or operator explanation object rather than rewriting the canonical door projection shape.

## Declared-freedom descendant

A descendant is optional and human- or caller-invoked. Residual influence may make the option visible, but it cannot invoke it automatically.

Conceptual request:

```ts
interface DeclaredFreedomRequest {
  parentResidueRef: string;
  invocationReason: string;
  policyVersion: string;
  allowedDimensions: string[];
  seed: string;
}
```

Conceptual result:

```ts
interface DeclaredFreedomProposal {
  profile: 'full-measure.declared-freedom-proposal/v0.1';
  proposalRef: string;
  parentResidueRef: string;
  invocationReason: string;
  policyVersion: string;
  allowedDimensions: string[];
  changedDimensions: string[];
  seed: string;
  proposal: unknown;
  authority: 'none';
  admission: 'required';
}
```

### Generation law

The generator must be deterministic for the same:

```text
parent residue
+ invocation reason
+ policy version
+ allowed dimensions
+ seed
+ declared input
```

It may alter only declared dimensions. `changedDimensions` must be a subset of `allowedDimensions`.

The parent residue and refused/indeterminate history remain unchanged and independently addressable.

### No trigger flattening

The local caller must declare why generation was invoked. This generic specimen must not invent that reason from the residue.

Examples such as `explore-neighbor-after-refusal` or `human-requested-alternative` are calling-layer claims. A future Toaster STOMP invocation or TranchNode lawful bloom may use materially different triggers and should not be relabeled to fit this specimen.

## Witness Session

The Witness Session is an evidence envelope over lifecycle stages, not a new adjudicator.

Conceptual shape:

```ts
type CollisionWitnessStage =
  | 'attempted'
  | 'confirmed'
  | 'disposed'
  | 'residue-recorded'
  | 'projection-derived'
  | 'descendant-proposed'
  | 'reentry-derived';

interface CollisionWitnessEntry {
  stage: CollisionWitnessStage;
  ref: string;
  evidenceRefs: string[];
  claimClass: 'evidence' | 'uncertainty' | 'proposal';
  authority: 'source-owned' | 'none';
}

interface CollisionWitnessSession {
  profile: 'full-measure.collision-witness-session/v0.1';
  sessionRef: string;
  entries: CollisionWitnessEntry[];
}
```

The exact enum names may tighten, but two axes must remain orthogonal:

```text
lifecycle stage
!=
claim/provenance class
```

A proposal does not become evidence because it appears late in the lifecycle. A refused disposition does not become authority because it produced a durable residue. Re-entry does not become occurrence because it happens after the original session.

The session should preserve order and refs; it should not rewrite earlier entries when later evidence appears.

## Re-entry seed

The first re-entry seed is a compact relation-preserving artifact, not a narrative summary and not a full event archive.

Conceptual shape:

```ts
interface CollisionReentrySeed {
  profile: 'full-measure.collision-reentry/v0.1';
  reentryRef: string;
  sourceSessionRef: string;
  sourceResidueRef: string;
  relationRefs: {
    sourceFieldRef: string;
    doorRef: string;
    crossingRef: string;
    influenceRef: string;
    descendantProposalRef?: string;
  };
  evidenceRefs: string[];
  decoderProfile: 'full-measure.collision-reentry/v0.1';
  reconstructionClaim: 'reentry-not-occurrence';
}
```

A fresh local reconstruction consumes the seed and resolves only the declared relational projection that the seed actually carries.

The re-entry test passes when a fresh process can reconstruct the same specimen relation graph and deterministic derived refs from the seed's declared inputs.

The test fails if reconstruction requires hidden ambient state, if it silently invents missing historical detail, or if the UI says/implies that the original encounter happened again.

## Read-only application exposure

Prefer the existing Human Terminal / residue-inspection path because it already exists to explain evidence without creating authority.

A minimal application-facing result could extend residue inspection with an optional experimental block:

```ts
{
  residue: WorldEncounterResidue,
  collisionSpecimen?: {
    influence: ResidualInfluence,
    witnessSession: CollisionWitnessSession,
    reentrySeed: CollisionReentrySeed,
    descendantProposal?: DeclaredFreedomProposal
  }
}
```

If modifying the existing response shape creates unnecessary compatibility risk, expose a new **read-only** Full Measure route or operator intent scoped explicitly to the specimen. Either choice must reuse existing residue lookup and must not duplicate the crossing execution path.

The product wording should make the epistemic status visible. For example:

```text
Prior encounter: refused
Effect here: historical attention cue
Authority: none
Current reachability: unchanged
```

For an indeterminate specimen:

```text
Prior encounter: unresolved
Effect here: unresolved frontier
Authority: none
Current reachability: unchanged
```

## Error handling

The collision module should fail closed and explicitly for malformed or ineligible input.

Required local errors include distinguishable cases for:

- ineligible outcome (`admitted`, `validation-failed`, `failed`);
- missing residue lineage required by the projection;
- descendant changed dimension outside `allowedDimensions`;
- empty/unknown policy version;
- re-entry profile mismatch;
- re-entry seed missing required relation refs;
- deterministic identity input containing unsupported/non-stable values.

These are local contract errors. They must not be reclassified as destination refusal or Project0 validation failure.

## Testing strategy

Implementation follows RED -> observed failure -> minimal GREEN -> broader verification.

### 1. Refused specimen

Given one stable refused `WorldEncounterResidue`:

- derives a deterministic `attention-cue` influence;
- preserves source/door/crossing/evidence refs;
- has `authority: none`;
- leaves original residue deeply unchanged;
- leaves door reachability and authority unchanged;
- produces no constituted destination refs.

### 2. Indeterminate specimen

Given one stable indeterminate residue:

- derives `unresolved-frontier`;
- preserves unresolved refs;
- never labels the outcome refused;
- does not invent a reason beyond the residue evidence.

### 3. Deterministic replay

Same declared input under the same profile produces byte-equivalent derived projection data and identical local refs.

A changed seed/policy/allowed-dimension declaration changes the descendant identity where appropriate.

### 4. Descendant freedom accounting

- `changedDimensions` is a subset of `allowedDimensions`;
- same parent/policy/seed/input reproduces the same proposal;
- parent residue is unchanged;
- proposal carries `authority: none` and `admission: required`;
- proposal is not inserted into constituted state.

### 5. No-authority negative control

Attempt to feed `ResidualInfluence`, `DeclaredFreedomProposal`, or `CollisionReentrySeed` into any helper as if it were confirmation or destination authority.

The collision module must expose no such capability. Application integration must still require the existing prepare/explicit-confirm path for any later crossing.

### 6. Witness-stage orthogonality

A session with a refused disposition plus a later descendant proposal must retain:

```text
disposed        -> evidence
residue-recorded -> evidence
projection-derived -> evidence/projection
proposal         -> proposal
reentry-derived  -> evidence of reconstruction, not occurrence
```

No later stage may rewrite the earlier claim class.

### 7. Re-entry reconstruction

Serialize one compact seed, construct a fresh local collision reader, and reconstruct the same relation projection and refs without access to mutable prior process state.

Assert `reconstructionClaim === 'reentry-not-occurrence'` in both stored and reconstructed output.

### 8. Regression gate

Run the repository's existing tests plus:

```bash
npm run check
```

The existing world-runtime, Garden, and Human Terminal tests must remain green.

## Riqor evidence plan

Implementation should run under one repository-scoped Riqor evidence run with a specific goal such as:

```text
Prove Collision Specimen 001 can derive deterministic non-authoritative influence, witness, descendant, and re-entry artifacts from refused/indeterminate Full Measure residue without mutating constituted state or authority.
```

After every final mutation, verification must be fresh. A successful earlier test run does not remain completion evidence after later source changes.

Riqor is evidence orchestration for the repository state; it does not become part of the runtime contract or a source of application authority.

## GitBook evidence boundary

GitBook should receive a project-backed **evidence specimen only after** the repository implementation and verification exist.

The published note should record:

- exact Full Measure PR/merge commit;
- exact verification command/result;
- one refused specimen and one indeterminate specimen;
- what influence changed in presentation;
- proof that reachability/authority/constituted state did not change;
- descendant freedom accounting if exercised;
- re-entry reconstruction result;
- residual fog and failed hypotheses.

Passing one Full Measure specimen does not automatically graduate Ghost, Witness Session, Declared Witness Channels, Declared-Freedom Descendant, Refusal Topology, or World Re-entry into shared law.

## Google Drive role

Google Drive is **not** canonical for the experiment.

If used, it should serve only as a human lab notebook or collection point for screenshots, informal observations, exported receipts, or external human annotations that do not belong in Git or GitBook yet.

Rules:

- GitHub remains canonical for executable source, tests, issue, spec, and PR state;
- GitBook remains the public bounded projection/evidence layer after proof;
- Drive material must not silently become runtime input or authority merely because it exists;
- any Drive artifact promoted into project evidence must be explicitly cited/ingested with provenance rather than assumed current.

No new Drive document is required for v0.1 unless a human witness produces material that benefits from a loose notebook.

## Success condition

Collision Specimen 001 succeeds only if one repository-backed proof demonstrates all of the following at once:

```text
refusal / indeterminate history remains true
original constituted state remains unchanged
original authority remains unchanged
residue remains inspectable
residue changes a later read-only projection in a bounded way
optional descendant declares exactly what freedom it spent
witness session preserves stage/provenance differences
re-entry reconstructs navigable relation without impersonating occurrence
```

If any one of those requires authority leakage, hidden state, semantic flattening, or a new master graph, the collision has exposed a real incompatibility and the specimen should fail rather than broaden its definitions.

## What comes after a successful specimen

Do not immediately generalize the implementation.

The next lawful sequence is:

1. preserve the Full Measure specimen as evidence;
2. name only the invariant(s) that actually survived;
3. test one materially different domain independently — Upper Room is a strong candidate for shared attention/witness boundaries;
4. separately use TranchNOSE as a destructive continuity/falsification chamber when its software harness is ready;
5. compare contracts across domains;
6. only then decide whether any local type deserves a shared primitive boundary.

The experiment is valuable even if the answer is that some primitives do **not** compose cleanly. The goal is not architectural elegance. The goal is to discover which laws survive contact.
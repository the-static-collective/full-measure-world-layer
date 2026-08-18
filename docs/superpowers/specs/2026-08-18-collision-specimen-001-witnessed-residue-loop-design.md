# Collision Specimen 001 — Witnessed Residue Loop

**Status:** approved design; implementation under review in PR #22

**Tracking:** #21

## Design sentence

> Prove that a refused or indeterminate Full Measure encounter may leave deterministic, attributable residue that influences a later read-only projection and may seed one explicitly declared neighboring proposal, while changing neither constituted state nor authority.

## Existing floor

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

The current runtime already preserves the distinctions this specimen needs:

- validation failure is not destination refusal;
- refusal is not indeterminate;
- host/donor failure is not refusal;
- only an admitted encounter may carry constituted destination refs;
- residue is inspectable after an encounter without becoming destination authority;
- Human Terminal is a projection over existing Full Measure contracts rather than a second execution plane.

The experiment therefore belongs downstream of existing `WorldEncounterResidue` and upstream of read-only explanation. No donor contract needs to change.

## Question under test

The current runtime proves that non-success can be remembered without being constituted as destination state.

Collision Specimen 001 tests the stronger claim:

> **Can remembered non-success affect what becomes visible or thinkable next without becoming permission, truth, reachability, or authority?**

The claim must be mechanically falsifiable.

## Primitive collision

The specimen places several incubating ideas in one bounded field without declaring them equivalent.

### Refusal Topology / Influence Without Authority

A refused or indeterminate encounter may remain queryable and shape later attention. Its residue cannot mutate constituted state, grant capability, or inherit the authority of the boundary that produced it.

### Ghost

Residue is historical presence after the attempted crossing is no longer occurring. It may remain perceptible without counterfeiting current presence or current authority.

### Witness Session

Attempt, confirmation, destination disposition, residue, later projection, optional descendant proposal, and re-entry remain separate lifecycle stages. Later stages do not rewrite earlier claims.

### Declared-Freedom Descendant

A neighboring proposal may cite residue as causal pressure only when generation is explicitly invoked against an explicitly declared ancestor proposal. The result must declare which dimensions were permitted to vary and which changed. It remains a proposal requiring ordinary admission elsewhere.

### World Re-entry Memory

A compact re-entry seed preserves enough truthful relation to reconstruct the specimen's **navigable relation graph** in a fresh local reader. It does not recreate vanished event bodies and does not claim the original encounter occurred again.

## Approaches considered

### A. Extend `WorldEncounterResidue` into a universal residue object

Add influence, generation, witness, and re-entry fields directly to the existing world-runtime residue type.

**Rejected.** It would make an experimental projection look constitutional merely because it lives inside an established runtime type and would overload persistence with projection/generation semantics.

### B. Create a cross-repository witness/residue package now

Define a shared Static Collective protocol and make Full Measure its first consumer.

**Rejected.** The incubating concepts have not earned a shared schema. A universal package would flatten domain-specific triggers and authority semantics before independent specimens exist.

### C. Add a Full Measure-local projection layer over existing residue

Leave `WorldEncounterResidue` and donor contracts unchanged. A small local module consumes existing residue by reference and derives experimental, non-authoritative artifacts.

**Selected.** It creates the smallest falsifiable collision while preserving the current constitutional floor. Failure leaves Boot the House intact; success can later be tested independently in another domain.

## Architectural boundary

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
          influence view   witness    optional fixture
              projection    session    descendant proof
                    \        |         /
                     \       |        /
                      compact re-entry seed
                                  |
                                  v
                     read-only explanation
                    Garden / Human Terminal
```

The collision layer has **no port** capable of calling Corpus OS, Project0, TranchNode, shell/process execution, or a crossing confirmation endpoint. It receives already-produced evidence and returns projection/evidence objects only.

That absence is part of the proof. Residue cannot authorize through a module that possesses no execution capability.

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

The exact file split may collapse during implementation if smaller is clearer. The invariant is one module of pure deterministic transforms with no donor/process dependencies.

Tests belong in the existing Node suite, for example:

```text
tests/collision-specimen.test.ts
```

No new persistence service is required in v0.1.

## Input eligibility

Collision Specimen 001 accepts only an existing `WorldEncounterResidue` whose outcome is:

```text
refused | indeterminate
```

It deliberately excludes:

- `admitted` — successful destination state belongs to the normal constituted-world path;
- `validation-failed` — the destination was not lawfully invoked, so treating this as destination refusal would lie;
- `failed` — transport/donor failure does not establish either constitutional refusal or unresolved destination disposition.

Eligibility is part of the semantic test, not incidental validation.

## Local deterministic identity

The specimen needs deterministic **local** refs for replay testing. It does not need another global canonicalizer.

Implementation should derive each local ref from an explicitly constructed fixed-order tuple rather than introducing a generic canonical JSON system. Set-like lists used in identities must be normalized by the local contract (deduplicated and lexically sorted) before tuple construction.

Conceptually:

```ts
const tuple = [
  'full-measure.residual-influence/v0.1',
  residue.residueRef,
  residue.outcomeClass,
  residue.sourceFieldRef,
  residue.doorRef,
  residue.crossingRef,
  normalizedEvidenceRefs,
  normalizedUnresolvedRefs,
] as const;
```

SHA-256 over the fixed serialized tuple may yield a ref such as:

```text
collision-influence:sha256:<digest>
```

The meaning is intentionally narrow: **same declared Full Measure-local specimen input under the same versioned profile**. It is not a Project0 canonical address and must not be presented as one.

Because the read-only influence projection is consumed by the browser-bundled Human Terminal, the implementation uses a small synchronous browser-safe SHA-256 helper rather than Node-only `node:crypto`. Standard UTF-8 SHA-256 vectors are pinned in repository tests. This changes transport compatibility only; the identity profile and digest algorithm remain SHA-256.

## Residual influence projection

A refused or indeterminate residue may generate one read-only `ResidualInfluence`.

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

A refused residue produces:

```text
effect.kind = attention-cue
```

The cue means only that a declared attempt previously encountered a refusal at this relation. It may make that historical relation more visible or explainable.

It does **not** mean:

- the door is now reachable or unreachable;
- the refusal is universal outside the witnessed cut;
- the refusal reason is eternally current;
- a retry is authorized;
- the cue may suppress contrary evidence.

### Indeterminate mapping

An indeterminate residue produces:

```text
effect.kind = unresolved-frontier
```

It cannot be silently converted to refusal. The projection preserves unresolved/evidence refs and states that the prior destination disposition was unresolved.

This is a deliberate negative control against narrative neatness.

## Projection effect boundary

The first specimen permits influence to affect **read-only presentation only**.

Permitted:

- Human Terminal may explain that a relation has prior refused residue;
- residue inspection may surface an unresolved frontier;
- a local view may show `prior encounter` / `historical attention` metadata;
- a human may choose to inspect the residue or explicitly invoke the fixture-only descendant experiment.

Forbidden:

- changing `WorldDoorProjection.reachability`;
- changing `WorldDoorProjection.authority`;
- selecting a door;
- calling `prepare` or `confirm`;
- manufacturing a confirmation receipt;
- altering a destination adapter request;
- adding `constitutedDestinationRefs`;
- mutating the original residue;
- automatically generating a descendant because residue exists.

Prefer an additive read-only explanation/specimen block rather than rewriting canonical door projection fields.

## Declared-freedom descendant sub-proof

The descendant portion is deliberately **fixture-local in v0.1**. It proves freedom accounting and composability; it does not introduce a new product-level proposal generator.

Residue alone does not contain the content of the attempted proposal. Therefore descendant generation must never pretend to reconstruct an ancestor from residue.

The caller supplies an explicit bounded synthetic ancestor fixture alongside the causal residue reference.

Conceptual request:

```ts
interface DeclaredFreedomRequest {
  parentResidueRef: string;
  ancestor: {
    proposalRef: string;
    body: Readonly<Record<string, string | number | boolean>>;
  };
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
  ancestorProposalRef: string;
  invocationReason: string;
  policyVersion: string;
  allowedDimensions: string[];
  changedDimensions: string[];
  seed: string;
  proposal: Readonly<Record<string, string | number | boolean>>;
  authority: 'none';
  admission: 'required';
}
```

### Generation law

The same:

```text
parent residue ref
+ ancestor proposal ref/body
+ invocation reason
+ policy version
+ allowed dimensions
+ seed
```

must produce the same proposal and local identity.

Only keys named in `allowedDimensions` may differ from the ancestor body. `changedDimensions` must equal the actual changed-key set and be a subset of `allowedDimensions`.

The ancestor fixture and the refused/indeterminate residue remain unchanged and independently addressable.

### Trigger boundary

The caller declares `invocationReason`. The generic helper must not infer why generation happened from the residue.

This prevents the fixture from erasing distinctions among future domain triggers such as human exploration, Toaster STOMP pressure, or a TranchNode refusal-conditioned bloom.

No descendant output is inserted into Garden state, door state, world residue, or constituted state in v0.1.

## Witness Session

The Witness Session is an evidence envelope over lifecycle stages, not an adjudicator.

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

Two axes remain orthogonal:

```text
lifecycle stage
!=
claim/provenance class
```

A proposal does not become evidence because it appears later. A refused disposition does not become authority because it produced durable residue. Re-entry does not become occurrence because it happened after the original session.

The session is append-like: later entries do not rewrite earlier entries.

For a projection-derived entry, `claimClass: 'evidence'` means **evidence that the projection was deterministically derived from declared residue**. It does not make the projection itself authoritative; the projection retains `authority: 'none'`.

For an indeterminate destination disposition, the corresponding entry uses `claimClass: 'uncertainty'` rather than laundering the unresolved result into evidence of refusal.

## Re-entry seed

The first re-entry seed is a compact relation-preserving artifact, not a narrative summary, full event archive, or resurrection mechanism.

Conceptual shape:

```ts
interface CollisionReentrySeed {
  profile: 'full-measure.collision-reentry/v0.1';
  reentryRef: string;
  sourceSessionRef: string;
  sourceResidueRef: string;
  outcomeClass: 'refused' | 'indeterminate';
  relationRefs: {
    sourceFieldRef: string;
    doorRef: string;
    crossingRef: string;
    influenceRef: string;
    descendantProposalRef?: string;
  };
  evidenceRefs: string[];
  unresolvedRefs: string[];
  decoderProfile: 'full-measure.collision-reentry/v0.1';
  reconstructionClaim: 'reentry-not-occurrence';
}
```

A fresh local reader consumes the seed and reconstructs a bounded **relation projection** such as:

```text
source field
  -> door
  -> attempted crossing
  -> refused | indeterminate residue
  -> influence projection
  -> optional descendant proposal ref
```

The fresh reader is not required or permitted to recreate vanished proposal bodies, donor responses, human testimony text, or destination state that the seed does not carry. Missing bodies remain missing.

The re-entry test passes when the seed alone reconstructs the same relation/ref graph and preserves the same epistemic labels without mutable prior-process state.

The test fails if reconstruction invents missing detail, requires undeclared ambient state, or says/implies the original encounter happened again.

## Read-only application exposure

Prefer the existing Human Terminal / residue-inspection seam because it already explains evidence without creating authority.

A minimal application-facing result may add an optional experimental block:

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

If changing the existing response creates unnecessary compatibility risk, a new **read-only** Full Measure route/operator intent scoped to the specimen is acceptable. It must reuse existing residue lookup and must not duplicate the crossing execution path.

Human-facing status should remain explicit:

```text
Prior encounter: refused
Effect here: historical attention cue
Authority: none
Current reachability: unchanged
```

or:

```text
Prior encounter: unresolved
Effect here: unresolved frontier
Authority: none
Current reachability: unchanged
```

## Error handling

The collision module fails closed for malformed or ineligible input.

Required distinguishable local errors:

- ineligible outcome (`admitted`, `validation-failed`, `failed`);
- missing residue lineage required by the projection;
- missing/invalid ancestor fixture for descendant generation;
- descendant change outside `allowedDimensions`;
- mismatch between declared and actual `changedDimensions`;
- empty/unknown policy version;
- re-entry profile mismatch;
- re-entry seed missing required relation refs;
- unsupported value type in a deterministic identity tuple.

These are local contract errors. They must not be reclassified as destination refusal or Project0 validation failure.

## Testing strategy

Implementation follows RED -> observed failure -> minimal GREEN -> broader verification.

### 1. Refused specimen

Given one stable refused `WorldEncounterResidue`:

- derives deterministic `attention-cue` influence;
- preserves source/door/crossing/evidence refs;
- has `authority: none`;
- leaves the original residue deeply unchanged;
- leaves door reachability/authority unchanged;
- produces no constituted destination refs.

### 2. Indeterminate specimen

Given one stable indeterminate residue:

- derives `unresolved-frontier`;
- preserves unresolved refs;
- never labels the outcome refused;
- does not invent a reason beyond source evidence.

### 3. Deterministic replay

Same declared input under the same profile produces byte-equivalent derived projection data and identical local refs.

Set-like input order differences that normalize to the same set produce the same identity.

### 4. Descendant freedom accounting

Using a bounded synthetic ancestor fixture:

- same residue/ancestor/reason/policy/allowed dimensions/seed reproduces the same proposal;
- only allowed keys change;
- `changedDimensions` exactly matches actual changed keys;
- ancestor and residue remain unchanged;
- proposal carries `authority: none` and `admission: required`;
- proposal is not inserted into constituted or Garden state.

### 5. No-authority negative control

The collision module exposes no execution/confirmation port. Application integration must still require the existing prepare -> explicit-confirm path for any later crossing.

Tests should prove collision artifacts cannot be accepted where confirmation/capability/destination authority is expected merely because their object shape is available.

### 6. Witness-stage orthogonality

A refused session with a later fixture descendant retains:

```text
disposed             -> evidence
residue-recorded     -> evidence
projection-derived   -> evidence of derivation; projection authority none
descendant-proposed  -> proposal
reentry-derived      -> evidence of reconstruction, not occurrence
```

An indeterminate disposition remains `uncertainty`.

No later stage rewrites an earlier claim class.

### 7. Re-entry reconstruction

Serialize one compact seed, create a fresh local re-entry reader, and reconstruct the same relation/ref graph using only the seed.

Assert:

```text
reconstructionClaim = reentry-not-occurrence
```

Missing event/proposal bodies remain absent rather than being fabricated.

### 8. Regression gate

Run the existing repository checks plus:

```bash
npm run check
```

Existing world-runtime, Garden, and Human Terminal tests must remain green.

## Riqor evidence plan

Implementation should run under one repository-scoped Riqor evidence run with the goal:

```text
Prove Collision Specimen 001 derives deterministic non-authoritative influence, witness, fixture-descendant, and re-entry artifacts from refused/indeterminate Full Measure residue without mutating constituted state or authority.
```

After the final mutation, verification must be fresh. Earlier passing tests do not remain completion evidence after later source changes.

Riqor is evidence orchestration for repository state; it is not part of the application runtime contract and acquires no application authority.

## GitBook boundary

GitBook should receive a project-backed **evidence specimen only after** repository implementation and verification exist.

The published evidence should record:

- exact Full Measure PR and merge commit;
- exact verification command/result;
- one refused specimen and one indeterminate specimen;
- the precise read-only projection effect;
- proof that reachability, authority, and constituted state did not change;
- fixture descendant freedom accounting, if exercised;
- re-entry relation reconstruction result;
- residual fog and failed hypotheses.

Passing one Full Measure specimen does not automatically graduate Ghost, Witness Session, Declared Witness Channels, Declared-Freedom Descendant, Refusal Topology, or World Re-entry into shared law.

A design-only GitBook projection before implementation, if created, must remain explicitly marked as frontier/design and point back to the repository-owned spec rather than claiming evidence.

## Google Drive role

Google Drive is **not canonical** for the experiment.

The current Drive search did not reveal an existing canonical Full Measure collision notebook. Drive is therefore optional and should be used only if human field work creates loose material that benefits from a notebook: screenshots, informal observations, exported receipts, or external annotations not ready for Git/GitBook.

Rules:

- GitHub remains canonical for executable source, tests, issue, spec, and PR state;
- GitBook remains the bounded public projection/evidence layer after proof;
- Drive material does not silently become runtime input or authority because it exists;
- any Drive artifact promoted into project evidence must be explicitly ingested/cited with provenance.

No new Drive document is required for v0.1 today.

## Success condition

The specimen succeeds only if one repository-backed proof demonstrates all of these at once:

```text
refusal / indeterminate history remains true
original constituted state remains unchanged
original authority remains unchanged
residue remains inspectable
residue changes a later read-only projection in a bounded way
optional fixture descendant declares exactly what freedom it spent
witness session preserves lifecycle/provenance differences
re-entry reconstructs navigable relation without impersonating occurrence
```

If any part requires authority leakage, hidden state, semantic flattening, or a new master graph, the collision has revealed a real incompatibility and should fail rather than broaden its definitions.

## After a successful specimen

Do not immediately generalize the implementation.

The next lawful sequence is:

1. preserve the Full Measure specimen as project evidence;
2. name only the invariant(s) that actually survived;
3. test one materially different domain independently — Upper Room is a strong candidate for shared-attention/witness boundaries;
4. separately use TranchNOSE as a destructive continuity/falsification chamber when its software harness is ready;
5. compare the contracts across domains;
6. only then decide whether any local type deserves a shared primitive boundary.

The specimen remains valuable if some primitives fail to compose. The target is not architectural neatness. The target is discovering which laws survive contact.
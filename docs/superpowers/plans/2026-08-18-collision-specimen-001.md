# Collision Specimen 001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Full Measure-local proof that refused/indeterminate world residue can deterministically influence read-only presentation, support one bounded fixture descendant, preserve a multi-stage witness record, and reconstruct a relation graph without changing constituted state or authority.

**Architecture:** Add one pure `src/lib/collisionSpecimen/index.ts` module downstream of `WorldEncounterResidue`; it has no donor/process/crossing ports. Keep the implementation compact until the specimen proves it needs further file decomposition. Human Terminal `inspect-residue` consumes only the read-only influence projection; descendant, witness-session, and re-entry behavior remain explicit pure APIs exercised by repository tests.

**Tech Stack:** TypeScript 5.8, Node.js `node:test`, Node `crypto` SHA-256, existing Full Measure world-runtime and Human Terminal modules.

**Spec:** `docs/superpowers/specs/2026-08-18-collision-specimen-001-witnessed-residue-loop-design.md`

## Global Constraints

- Accept only `refused | indeterminate` residue as collision input.
- Never mutate `WorldEncounterResidue`, `WorldDoorProjection`, Garden state, or `constitutedDestinationRefs`.
- Collision code has no Project0, Corpus OS, TranchNode, shell/process, prepare, or confirm capability.
- `refused` maps to `attention-cue`; `indeterminate` maps to `unresolved-frontier` and must not be coerced to refusal.
- Derived refs are Full Measure-local deterministic identities, not Project0 canonical addresses.
- Descendant generation is fixture-local, requires an explicit ancestor body, changes only allowed dimensions, has `authority: 'none'`, and remains `admission: 'required'`.
- Re-entry reconstructs only the declared relation/ref graph and always states `reentry-not-occurrence`.
- TDD is mandatory: each production behavior begins with a failing test whose failure is observed in CI before implementation.
- Final completion requires a fresh `npm run check` result after the final mutation.

---

### Task 1: Residual influence and deterministic local identity

**Files:**
- Create: `tests/collision-specimen.test.ts`
- Create: `src/lib/collisionSpecimen/index.ts`

**Interfaces:**
- Consumes: `WorldEncounterResidue` from `src/lib/worldRuntime/types.ts`.
- Produces:
  - `deriveResidualInfluence(residue: WorldEncounterResidue): ResidualInfluence`
  - `CollisionSpecimenError`
  - exported `ResidualInfluence` type.

- [ ] **Step 1: Write the failing refused/indeterminate tests**

Create `tests/collision-specimen.test.ts` with imports from the not-yet-existing collision module and fixtures shaped exactly like `WorldEncounterResidue`.

Required assertions:

```ts
const refused = deriveResidualInfluence(refusedResidue);
assert.equal(refused.effect.kind, 'attention-cue');
assert.equal(refused.authority, 'none');
assert.equal(refused.mutation, 'forbidden');
assert.deepEqual(refusedResidue, refusedSnapshot);

const unresolved = deriveResidualInfluence(indeterminateResidue);
assert.equal(unresolved.effect.kind, 'unresolved-frontier');
assert.equal(unresolved.outcomeClass, 'indeterminate');
```

Also test:

```ts
assert.equal(
  deriveResidualInfluence(refusedWithEvidenceOrderA).influenceRef,
  deriveResidualInfluence(refusedWithEvidenceOrderB).influenceRef,
);
assert.throws(() => deriveResidualInfluence(admittedResidue), /ineligible collision outcome/);
assert.throws(() => deriveResidualInfluence(validationFailedResidue), /ineligible collision outcome/);
assert.throws(() => deriveResidualInfluence(failedResidue), /ineligible collision outcome/);
```

- [ ] **Step 2: Push RED and observe CI failure**

Expected failure: TypeScript/test resolution cannot import `../src/lib/collisionSpecimen/index.js` because the module does not exist yet.

- [ ] **Step 3: Implement the minimal influence module**

Create `src/lib/collisionSpecimen/index.ts` with:

```ts
import { createHash } from 'node:crypto';
import type { WorldEncounterResidue } from '../worldRuntime/types.js';

export class CollisionSpecimenError extends Error {}

export interface ResidualInfluence {
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

Use a private `stableRef(prefix, tuple)` helper that JSON-serializes a fixed tuple and hashes it with SHA-256. Normalize set-like evidence/unresolved refs with dedupe + lexical sort before identity construction and returned output.

`deriveResidualInfluence` must throw `CollisionSpecimenError('ineligible collision outcome: ...')` for every outcome other than `refused | indeterminate`.

- [ ] **Step 4: Push GREEN and observe focused + repository CI pass**

Expected: new collision tests pass and existing tests stay green.

---

### Task 2: Fixture-local declared-freedom descendant

**Files:**
- Modify: `tests/collision-specimen.test.ts`
- Modify: `src/lib/collisionSpecimen/index.ts`

**Interfaces:**
- Consumes: eligible residue, bounded primitive ancestor body, invocation reason, policy version, allowed dimensions, seed.
- Produces:
  - `createDeclaredFreedomProposal(request: DeclaredFreedomRequest): DeclaredFreedomProposal`
  - exported request/result types.

- [ ] **Step 1: Add failing descendant freedom-accounting tests**

Use this only supported v0.1 policy literal:

```text
full-measure.fixture-one-step/v0.1
```

Use a fixture ancestor such as:

```ts
{
  proposalRef: 'proposal:ancestor:001',
  body: { tone: 'quiet', count: 2, enabled: false },
}
```

Assert:

```ts
const proposal = createDeclaredFreedomProposal({
  parentResidueRef: refusedResidue.residueRef,
  ancestor,
  invocationReason: 'human-requested-alternative',
  policyVersion: 'full-measure.fixture-one-step/v0.1',
  allowedDimensions: ['tone', 'enabled'],
  seed: 'seed-001',
});

assert.equal(proposal.authority, 'none');
assert.equal(proposal.admission, 'required');
assert.ok(proposal.changedDimensions.length === 1);
assert.ok(proposal.allowedDimensions.includes(proposal.changedDimensions[0]));
assert.deepEqual(ancestor, ancestorSnapshot);
```

Run twice and assert the same `proposalRef`, `proposal`, and `changedDimensions`.

Add negative tests for empty allowed dimensions, unknown policy version, and a requested allowed dimension missing from the ancestor.

- [ ] **Step 2: Push RED and observe CI fail because the API is missing**

- [ ] **Step 3: Implement the minimal deterministic one-step policy**

Behavior:

1. normalize/dedupe/sort `allowedDimensions`;
2. reject empty sets or keys absent from ancestor body;
3. choose exactly one allowed dimension using the first 8 hex digits of `sha256(seed + policyVersion + ancestorProposalRef + parentResidueRef)` modulo the allowed count;
4. mutate only that primitive value:
   - boolean -> logical negation;
   - finite number -> `value + 1`;
   - string -> `${value}~${sha256(seed + key).slice(0, 6)}`;
5. compute `changedDimensions` from actual ancestor/result comparison;
6. derive local `proposalRef` from the full declared request + resulting bounded body;
7. return a new frozen-by-convention object without mutating request/ancestor.

Reject unsupported/non-finite ancestor values with `CollisionSpecimenError`.

- [ ] **Step 4: Push GREEN and observe CI pass**

---

### Task 3: Witness session and relation-only re-entry

**Files:**
- Modify: `tests/collision-specimen.test.ts`
- Modify: `src/lib/collisionSpecimen/index.ts`

**Interfaces:**
- Produces:
  - `createCollisionWitnessSession(input: CollisionWitnessSessionInput): CollisionWitnessSession`
  - `createCollisionReentrySeed(input: CollisionReentryInput): CollisionReentrySeed`
  - `reconstructCollisionRelation(seed: CollisionReentrySeed): CollisionRelationProjection`

- [ ] **Step 1: Add failing witness/re-entry tests**

Create a refused session containing explicit refs:

```ts
attemptRef: 'attempt:001'
confirmationRef: 'confirmation:001'
dispositionRef: 'disposition:001'
```

Assert stage order exactly:

```text
attempted
confirmed
disposed
residue-recorded
projection-derived
descendant-proposed (only when supplied)
```

For refused, `disposed` is `claimClass: 'evidence'`; for indeterminate, `disposed` is `claimClass: 'uncertainty'`.

Assert descendant stage remains `proposal` and every projection/proposal stage has `authority: 'none'`.

Create a re-entry seed and reconstruct it. Assert the reconstructed graph contains only refs/labels:

```ts
assert.equal(reconstructed.reconstructionClaim, 'reentry-not-occurrence');
assert.deepEqual(reconstructed.relationRefs, seed.relationRefs);
assert.equal('proposalBody' in reconstructed, false);
assert.equal('destinationBody' in reconstructed, false);
```

- [ ] **Step 2: Push RED and observe CI fail because witness/re-entry APIs are missing**

- [ ] **Step 3: Implement the minimal witness/re-entry APIs**

Witness entries carry:

```ts
stage
ref
evidenceRefs
claimClass: 'evidence' | 'uncertainty' | 'proposal'
authority: 'source-owned' | 'none'
```

Use explicit refs supplied by the caller; do not infer confirmation or disposition refs from arbitrary residue evidence arrays.

`createCollisionReentrySeed` copies only source session/residue/outcome, relation refs, evidence refs, unresolved refs, decoder profile, and `reentry-not-occurrence`. `reconstructCollisionRelation` validates the profile and returns only the relation/ref graph plus epistemic labels.

- [ ] **Step 4: Push GREEN and observe CI pass**

---

### Task 4: Human Terminal read-only influence exposure and final gate

**Files:**
- Modify: `tests/human-terminal-operator.test.ts`
- Modify: `src/lib/humanTerminal/operator.ts`
- Modify: `docs/superpowers/plans/2026-08-18-collision-specimen-001.md` only to check completed boxes if useful; no semantic changes.

**Interfaces:**
- Consumes: `deriveResidualInfluence` only.
- Produces: no new crossing or mutation interface; only additional `inspect-residue` explanatory lines for eligible residue.

- [ ] **Step 1: Add failing Human Terminal tests**

For `inspect-residue` over refused residue, require lines containing:

```text
Residual influence: historical attention cue.
Authority: none; current reachability is unchanged.
```

For indeterminate residue, require:

```text
Residual influence: unresolved frontier.
Authority: none; current reachability is unchanged.
```

For admitted/validation-failed/failed residue, assert no `Residual influence:` line exists.

- [ ] **Step 2: Push RED and observe the focused Terminal tests fail on missing lines**

- [ ] **Step 3: Implement minimal read-only exposure**

Import `deriveResidualInfluence` into `src/lib/humanTerminal/operator.ts`. In `inspect-residue`, only for `refused | indeterminate`, derive influence and append exactly the two bounded explanatory lines. Do not alter `moves`, reachability, authority, residue, or evidence refs.

- [ ] **Step 4: Push GREEN and observe CI pass**

- [ ] **Step 5: Run final repository gate on the final head**

Required GitHub Actions/CI command-equivalent evidence:

```bash
npm run check
```

Expected: TypeScript lint pass, all Node tests pass, Vite/server build pass.

- [ ] **Step 6: Review the PR diff against #21 and the design spec**

Confirm:

- no donor/runtime execution imports in `collisionSpecimen`;
- no changes to `WorldDoorProjection.reachability` or authority;
- no `constitutedDestinationRefs` mutation;
- no automatic descendant invocation;
- indeterminate remains distinct;
- re-entry contains no hidden event bodies;
- implementation remains Full Measure-local.

- [ ] **Step 7: Mark PR ready only after fresh verification**

Update PR #22 title/body from design-only to implementation scope, request review, and proceed through PR Completion readiness. Landing remains separately confirmation-gated for the exact verified head SHA.
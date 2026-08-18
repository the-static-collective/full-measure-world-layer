# Collision Specimen 001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Full Measure-local proof that refused/indeterminate world residue can deterministically influence read-only presentation, support one bounded fixture descendant, preserve a multi-stage witness record, and reconstruct a relation graph without changing constituted state or authority.

**Architecture:** Add one pure `src/lib/collisionSpecimen/` module downstream of `WorldEncounterResidue`; it has no donor/process/crossing ports. Human Terminal `inspect-residue` consumes only the read-only influence projection; descendant, witness-session, and re-entry behavior remain explicit pure APIs exercised by repository tests.

**Tech Stack:** TypeScript 5.8, Node.js `node:test`, browser-safe synchronous SHA-256 for deterministic local identity, existing Full Measure world-runtime and Human Terminal modules.

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
- Create as required by browser bundling: `src/lib/collisionSpecimen/sha256.ts`

**Interfaces:**
- Consumes: `WorldEncounterResidue` from `src/lib/worldRuntime/types.ts`.
- Produces:
  - `deriveResidualInfluence(residue: WorldEncounterResidue): ResidualInfluence`
  - `CollisionSpecimenError`
  - exported `ResidualInfluence` type.

- [x] **Step 1: Write the failing refused/indeterminate tests**

Required assertions cover refused attention cues, indeterminate unresolved frontiers, normalized evidence-order identity, input immutability, and ineligible outcomes.

- [x] **Step 2: Push RED and observe CI failure**

Observed: TypeScript/test resolution could not import `../src/lib/collisionSpecimen/index.js` because the module did not exist.

- [x] **Step 3: Implement the minimal influence module**

The initial synchronous SHA-256 implementation used Node `crypto`; final application wiring revealed that Human Terminal is browser-bundled, so the identity helper was moved to a small browser-safe synchronous SHA-256 implementation while preserving the same SHA-256 profile. Standard UTF-8 hash vectors are pinned in `tests/collision-sha256.test.ts`.

- [x] **Step 4: Push GREEN and observe focused + repository CI pass**

---

### Task 2: Fixture-local declared-freedom descendant

**Files:**
- Modify: `tests/collision-specimen.test.ts`
- Modify: `src/lib/collisionSpecimen/index.ts`

**Interfaces:**
- Consumes: eligible residue lineage, bounded primitive ancestor body, invocation reason, policy version, allowed dimensions, seed.
- Produces:
  - `createDeclaredFreedomProposal(request: DeclaredFreedomRequest): DeclaredFreedomProposal`
  - exported request/result types.

- [x] **Step 1: Add failing descendant freedom-accounting tests**

Only supported v0.1 policy literal:

```text
full-measure.fixture-one-step/v0.1
```

Assertions cover deterministic replay, exact one-dimension mutation, ancestor immutability, `authority: none`, and `admission: required`.

- [x] **Step 2: Push RED and observe CI fail because the API is missing**

- [x] **Step 3: Implement the minimal deterministic one-step policy**

Behavior:

1. normalize/dedupe/sort `allowedDimensions`;
2. reject empty sets or keys absent from ancestor body;
3. choose exactly one allowed dimension using SHA-256 over seed/policy/ancestor/residue lineage;
4. mutate only that primitive value;
5. compute `changedDimensions` from actual ancestor/result comparison;
6. derive local `proposalRef` from the full declared request + result;
7. return a new object without mutating request/ancestor.

- [x] **Step 4: Push GREEN and observe CI pass**

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

- [x] **Step 1: Add failing witness/re-entry tests**

The source witness session preserves exactly:

```text
attempted
confirmed
disposed
residue-recorded
projection-derived
descendant-proposed (only when supplied)
```

For refused, `disposed` is `claimClass: evidence`; for indeterminate it is `claimClass: uncertainty`. Descendant remains `proposal`; projection/proposal authority remains `none`.

Re-entry is a separate artifact citing the finalized source session, avoiding circular identity. It reconstructs refs/labels only and asserts `reentry-not-occurrence`.

- [x] **Step 2: Push RED and observe CI fail because witness/re-entry APIs are missing**

- [x] **Step 3: Implement the minimal witness/re-entry APIs**

Explicit attempt/confirmation/disposition refs are supplied by the caller; confirmation or disposition is never inferred from arbitrary residue evidence arrays.

- [x] **Step 4: Push GREEN and observe CI pass**

---

### Task 4: Human Terminal read-only influence exposure and final gate

**Files:**
- Modify: `tests/human-terminal-operator.test.ts`
- Modify: `src/lib/humanTerminal/operator.ts`

**Interfaces:**
- Consumes: `deriveResidualInfluence` only.
- Produces: no new crossing or mutation interface; only additional `inspect-residue` explanatory lines for eligible residue.

- [x] **Step 1: Add failing Human Terminal tests**

Refused residue requires:

```text
Residual influence: historical attention cue.
Authority: none; current reachability is unchanged.
```

Indeterminate requires:

```text
Residual influence: unresolved frontier.
Authority: none; current reachability is unchanged.
```

Validation-failed remains without a residual-influence line.

- [x] **Step 2: Push RED and observe focused Terminal tests fail on missing lines**

Observed: 64/66 tests passed; exactly the two new residue-influence assertions failed.

- [x] **Step 3: Implement minimal read-only exposure**

`inspect-residue` now derives influence only for `refused | indeterminate` and appends the two bounded explanatory lines. It does not alter `moves`, reachability, authority, residue, or evidence refs.

- [x] **Step 4: Push GREEN and observe CI pass**

The first full GREEN attempt exposed a production-build-only portability defect: `node:crypto` had entered the Vite browser graph. Systematic debugging isolated the root cause and replaced only the digest transport implementation with browser-safe synchronous SHA-256. The collision semantics/API remained unchanged.

- [ ] **Step 5: Run final repository gate on the final head**

Required GitHub Actions evidence:

```bash
npm run check
```

Expected: TypeScript lint pass, all Node tests pass, Vite/server build pass.

- [x] **Step 6: Review the PR diff against #21 and the design spec**

Owner review confirmed:

- no donor/runtime execution imports in `collisionSpecimen`;
- no changes to `WorldDoorProjection.reachability` or authority;
- no `constitutedDestinationRefs` mutation;
- no automatic descendant invocation;
- indeterminate remains distinct;
- re-entry contains no hidden event bodies;
- implementation remains Full Measure-local.

Review additionally found and repaired two documentation/verification gaps: browser-safe SHA-256 needed standard-vector tests, and re-entry must remain outside the source witness session to avoid circular identity.

- [ ] **Step 7: Mark PR ready only after fresh verification**

Final checkboxes remain intentionally open in this committed plan until the latest head completes both the repository check and PR readiness transition. Landing remains separately confirmation-gated for the exact verified head SHA.
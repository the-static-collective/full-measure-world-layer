# STRIDE Specimen 001 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove two consecutive, independently confirmed Full Measure-local world steps with fresh stance derivation after every footprint.

**Architecture:** Add one pure `src/lib/strideSpecimen/` module beside, not inside, donor/world-runtime adapters. The module consumes existing `WorldDoorProjection` and `WorldEncounterResidue` shapes plus a pinned local orientation fixture; it owns only local stance/footprint/stride evidence and a fixed two-attempt ceiling.

**Tech Stack:** TypeScript 5.8, Node `node:test` / `node:assert`, existing `WorldEncounterResidue` / `WorldDoorProjection` types, repository `npm run check` gate.

**Spec:** `docs/superpowers/specs/2026-08-19-stride-specimen-001-design.md`

## Global Constraints

- Full Measure-local experiment only.
- `A -> B` confirmation never authorizes `B -> E`.
- Only `admitted` may change constituted position.
- Refused, indeterminate, failed, and validation-failed attempts still create footprints.
- Fresh orientation derives from the post-footprint constituted position.
- A third attempt refuses with `STRIDE_STEP_LIMIT_REACHED`.
- No changes to Project0, TranchNode, Corpus OS, Founder Node, world-runtime donor adapters, HTTP routes, or UI.
- No live discovery and no destination-body retrieval.
- Broad gate: `npm run check`.

---

### Task 1: Specify STRIDE behavior test-first

**Files:**
- Create: `tests/stride-specimen.test.ts`

**Interfaces:**
- Consumes: existing `WorldEncounterResidue` type from `src/lib/worldRuntime/types.ts`.
- Produces: required API names `createStrideSpecimenSession`, `StrideSpecimenError`, and session methods `getStance()`, `getWitnesses()`, `takeStep(...)`.

- [ ] **Step 1: Write the failing positive-path test**

Create a test that imports the missing STRIDE module, asserts initial stance A exposes the declared A doors, records admitted `A -> B` with `confirmation:1`, verifies stance B exposes B's fresh doors, then records admitted `B -> E` with `confirmation:2` and verifies stance E plus two witnesses.

- [ ] **Step 2: Write failing negative tests**

Cover:

```text
A -> B refused      => footprint exists; position stays A
A -> B indeterminate=> footprint exists; position stays A
reused confirmation => STRIDE_CONFIRMATION_REUSED
stale stance         => STRIDE_STALE_STANCE
old/non-exposed door => STRIDE_DOOR_NOT_EXPOSED
mismatched residue   => STRIDE_RESIDUE_MISMATCH
third attempt        => STRIDE_STEP_LIMIT_REACHED
```

- [ ] **Step 3: Push test-only RED**

Expected GitHub `check` failure: module `../src/lib/strideSpecimen/index.js` does not exist. Existing tests should reach the new test normally.

### Task 2: Implement the minimum local STRIDE domain

**Files:**
- Create: `src/lib/strideSpecimen/index.ts`

**Interfaces:**
- Consumes:
  - `WorldDoorProjection`
  - `WorldEncounterResidue`
- Produces:

```ts
export class StrideSpecimenError extends Error {
  readonly code: string;
}

export interface StrideStance {
  stanceRef: string;
  fieldRef: string;
  positionRef: string;
  residueRefs: string[];
  exposedDoorRefs: string[];
  orientationPolicy: 'full-measure/stride-orientation-fixture/v0.1';
  authority: 'none';
}

export interface StrideFootprint {
  footprintRef: string;
  sourceStanceRef: string;
  doorRef: string;
  destinationRef: string;
  crossingRef: string;
  confirmationRef: string;
  outcomeClass: WorldEncounterResidue['outcomeClass'];
  residueRef: string;
  constitutedRefsAdded: string[];
  authority: 'none';
}

export interface StrideWitness {
  witnessRef: string;
  stanceBeforeRef: string;
  footprint: StrideFootprint;
  stanceAfterRef: string;
  authority: 'none';
}

export function createStrideSpecimenSession(): {
  getStance(): StrideStance;
  getWitnesses(): StrideWitness[];
  takeStep(input: {
    stanceRef: string;
    doorRef: string;
    crossingRef: string;
    confirmationRef: string;
    residue: WorldEncounterResidue;
  }): StrideWitness;
};
```

- [ ] **Step 1: Add the pinned orientation fixture inside the module**

Declare A/B/E plus C/D/F destination stubs as local fixture positions. Each position owns a distinct `fieldRef` and ordered `WorldDoorProjection[]`. Do not import `fixtureDoorSource.ts`; STRIDE's fixture is purpose-built to prove re-orientation.

- [ ] **Step 2: Implement deterministic local refs and immutable clones**

Use stable local identifiers under `stride-local:` derived only from step ordinal, current position, selected door/crossing, and completed residue identity. Do not mint Project0-looking refs.

- [ ] **Step 3: Implement validation and one-step transition**

Before mutation, validate step ceiling, current stance, exposed door, nonempty unique confirmation, and matching residue source/door/crossing. Reject non-admitted residue carrying constituted destination refs.

- [ ] **Step 4: Apply disposition law**

For admitted, next position is the selected door destination. For every non-admitted class, next position remains unchanged. In every completed attempt, append the residue ref and derive a fresh stance from the resulting position.

- [ ] **Step 5: Preserve attempt atomicity**

Any validation error must leave current stance, confirmation set, residue history, and witness history unchanged.

### Task 3: Verify GREEN and contract boundaries

**Files:**
- Modify only if evidence requires: `tests/stride-specimen.test.ts`
- No production widening outside `src/lib/strideSpecimen/`.

- [ ] **Step 1: Observe focused GREEN through CI**

Expected: all STRIDE tests pass.

- [ ] **Step 2: Run/observe repository broad gate**

GitHub `check` must pass `npm run check`: TypeScript, every `tests/*.test.ts`, and production build.

- [ ] **Step 3: Confirm Boot the House proof is unaffected**

The existing `boot-house-proof` workflow must remain green; STRIDE does not modify donor checkout or composed crossing scripts.

- [ ] **Step 4: Review exact diff**

Expected changed production scope:

```text
src/lib/strideSpecimen/index.ts
tests/stride-specimen.test.ts
docs/superpowers/specs/2026-08-19-stride-specimen-001-design.md
docs/superpowers/plans/2026-08-19-stride-specimen-001.md
```

No world-runtime adapter, route, server, UI, package, or donor schema file should change.

### Task 4: PR completion

- [ ] Open a PR referencing issue #23 and preserve the local-only/non-authority boundary in the PR body.
- [ ] Verify exact final head checks and unresolved review state.
- [ ] Do not merge merely because the PR is green unless the user's merge authorization is explicit in the active workflow.

## Self-review

- Spec coverage: positive two-step path, refusal, indeterminate, stale stance, non-exposed door, confirmation reuse, residue mismatch, attempt atomicity, and third-step ceiling all map to executable tests.
- Placeholder scan: no implementation TODOs remain in the plan.
- Type consistency: API names and error codes are fixed above and reused by all tasks.

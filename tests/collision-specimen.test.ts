import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createCollisionReentrySeed,
  createCollisionWitnessSession,
  createDeclaredFreedomProposal,
  deriveResidualInfluence,
  reconstructCollisionRelation,
} from '../src/lib/collisionSpecimen/index.js';
import type { WorldEncounterResidue } from '../src/lib/worldRuntime/types.js';

function residue(
  outcomeClass: WorldEncounterResidue['outcomeClass'],
  overrides: Partial<WorldEncounterResidue> = {},
): WorldEncounterResidue {
  return {
    residueRef: 'world-residue:000021',
    sourceFieldRef: 'world-field:garden-v0.1',
    doorRef: 'world-door:corpus-casework-v0.1',
    crossingRef: 'world-crossing:collision-001',
    outcomeClass,
    evidenceRefs: ['evidence:b', 'evidence:a'],
    unresolvedRefs: ['reason:b', 'reason:a'],
    returnRefs: [],
    constitutedDestinationRefs: [],
    ...overrides,
  };
}

function descendant(parentResidueRef = 'world-residue:000021') {
  return createDeclaredFreedomProposal({
    parentResidueRef,
    ancestor: {
      proposalRef: 'proposal:ancestor:001',
      body: { tone: 'quiet', count: 2, enabled: false },
    },
    invocationReason: 'human-requested-alternative',
    policyVersion: 'full-measure.fixture-one-step/v0.1',
    allowedDimensions: ['tone', 'enabled'],
    seed: 'seed-001',
  });
}

test('refused residue derives a non-authoritative attention cue without mutating history', () => {
  const input = residue('refused');
  const snapshot = structuredClone(input);

  const influence = deriveResidualInfluence(input);

  assert.equal(influence.effect.kind, 'attention-cue');
  assert.equal(influence.outcomeClass, 'refused');
  assert.equal(influence.authority, 'none');
  assert.equal(influence.mutation, 'forbidden');
  assert.equal(influence.effect.targetRef, input.doorRef);
  assert.deepEqual(influence.evidenceRefs, ['evidence:a', 'evidence:b']);
  assert.deepEqual(influence.unresolvedRefs, ['reason:a', 'reason:b']);
  assert.deepEqual(input, snapshot);
});

test('indeterminate residue remains an unresolved frontier rather than becoming refusal', () => {
  const influence = deriveResidualInfluence(residue('indeterminate'));

  assert.equal(influence.effect.kind, 'unresolved-frontier');
  assert.equal(influence.outcomeClass, 'indeterminate');
  assert.equal(influence.authority, 'none');
});

test('set-like evidence order does not change deterministic local influence identity', () => {
  const first = deriveResidualInfluence(
    residue('refused', {
      evidenceRefs: ['evidence:b', 'evidence:a', 'evidence:b'],
      unresolvedRefs: ['reason:b', 'reason:a'],
    }),
  );
  const second = deriveResidualInfluence(
    residue('refused', {
      evidenceRefs: ['evidence:a', 'evidence:b'],
      unresolvedRefs: ['reason:a', 'reason:b', 'reason:a'],
    }),
  );

  assert.equal(first.influenceRef, second.influenceRef);
  assert.deepEqual(first.evidenceRefs, second.evidenceRefs);
  assert.deepEqual(first.unresolvedRefs, second.unresolvedRefs);
});

test('admitted, validation-failed, and failed residue are ineligible collision inputs', () => {
  for (const outcomeClass of ['admitted', 'validation-failed', 'failed'] as const) {
    assert.throws(
      () => deriveResidualInfluence(residue(outcomeClass)),
      /ineligible collision outcome/,
    );
  }
});

test('declared-freedom descendant changes exactly one allowed ancestor dimension deterministically', () => {
  const ancestor = {
    proposalRef: 'proposal:ancestor:001',
    body: { tone: 'quiet', count: 2, enabled: false },
  } as const;
  const ancestorSnapshot = structuredClone(ancestor);
  const request = {
    parentResidueRef: 'world-residue:000021',
    ancestor,
    invocationReason: 'human-requested-alternative',
    policyVersion: 'full-measure.fixture-one-step/v0.1',
    allowedDimensions: ['tone', 'enabled'],
    seed: 'seed-001',
  } as const;

  const first = createDeclaredFreedomProposal(request);
  const second = createDeclaredFreedomProposal(request);

  assert.equal(first.authority, 'none');
  assert.equal(first.admission, 'required');
  assert.equal(first.changedDimensions.length, 1);
  assert.ok(first.allowedDimensions.includes(first.changedDimensions[0]));
  assert.equal(first.ancestorProposalRef, ancestor.proposalRef);
  assert.equal(first.parentResidueRef, request.parentResidueRef);
  assert.deepEqual(ancestor, ancestorSnapshot);
  assert.deepEqual(first, second);

  const changedKeys = Object.keys(ancestor.body).filter(
    (key) =>
      first.proposal[key] !==
      ancestor.body[key as keyof typeof ancestor.body],
  );
  assert.deepEqual(changedKeys, first.changedDimensions);
});

test('declared-freedom descendant rejects empty freedom, unknown policy, and missing ancestor dimensions', () => {
  const ancestor = {
    proposalRef: 'proposal:ancestor:001',
    body: { tone: 'quiet', count: 2, enabled: false },
  };
  const base = {
    parentResidueRef: 'world-residue:000021',
    ancestor,
    invocationReason: 'human-requested-alternative',
    policyVersion: 'full-measure.fixture-one-step/v0.1',
    seed: 'seed-001',
  };

  assert.throws(
    () => createDeclaredFreedomProposal({ ...base, allowedDimensions: [] }),
    /allowed dimensions are required/,
  );
  assert.throws(
    () =>
      createDeclaredFreedomProposal({
        ...base,
        policyVersion: 'unknown/v0.1',
        allowedDimensions: ['tone'],
      }),
    /unknown descendant policy/,
  );
  assert.throws(
    () =>
      createDeclaredFreedomProposal({
        ...base,
        allowedDimensions: ['missing'],
      }),
    /ancestor dimension is missing/,
  );
});

test('witness session preserves lifecycle order and keeps descendant proposal non-authoritative', () => {
  const refused = residue('refused');
  const influence = deriveResidualInfluence(refused);
  const proposal = descendant(refused.residueRef);

  const session = createCollisionWitnessSession({
    attemptRef: 'attempt:001',
    confirmationRef: 'confirmation:001',
    dispositionRef: 'disposition:001',
    residue: refused,
    influence,
    descendantProposal: proposal,
  });

  assert.deepEqual(
    session.entries.map((entry) => entry.stage),
    [
      'attempted',
      'confirmed',
      'disposed',
      'residue-recorded',
      'projection-derived',
      'descendant-proposed',
    ],
  );
  assert.equal(
    session.entries.find((entry) => entry.stage === 'disposed')?.claimClass,
    'evidence',
  );
  assert.equal(
    session.entries.find((entry) => entry.stage === 'projection-derived')?.authority,
    'none',
  );
  assert.equal(
    session.entries.find((entry) => entry.stage === 'descendant-proposed')?.claimClass,
    'proposal',
  );
  assert.equal(
    session.entries.find((entry) => entry.stage === 'descendant-proposed')?.authority,
    'none',
  );
});

test('indeterminate witness disposition remains uncertainty', () => {
  const unresolved = residue('indeterminate');
  const session = createCollisionWitnessSession({
    attemptRef: 'attempt:002',
    confirmationRef: 'confirmation:002',
    dispositionRef: 'disposition:002',
    residue: unresolved,
    influence: deriveResidualInfluence(unresolved),
  });

  assert.equal(
    session.entries.find((entry) => entry.stage === 'disposed')?.claimClass,
    'uncertainty',
  );
});

test('re-entry reconstructs only the surviving relation graph and never impersonates occurrence', () => {
  const refused = residue('refused');
  const influence = deriveResidualInfluence(refused);
  const proposal = descendant(refused.residueRef);
  const session = createCollisionWitnessSession({
    attemptRef: 'attempt:001',
    confirmationRef: 'confirmation:001',
    dispositionRef: 'disposition:001',
    residue: refused,
    influence,
    descendantProposal: proposal,
  });

  const seed = createCollisionReentrySeed({
    session,
    residue: refused,
    influence,
    descendantProposal: proposal,
  });
  const reconstructed = reconstructCollisionRelation(seed);

  assert.equal(seed.reconstructionClaim, 'reentry-not-occurrence');
  assert.equal(reconstructed.reconstructionClaim, 'reentry-not-occurrence');
  assert.deepEqual(reconstructed.relationRefs, seed.relationRefs);
  assert.equal(reconstructed.outcomeClass, 'refused');
  assert.equal(reconstructed.authority, 'none');
  assert.equal('proposalBody' in reconstructed, false);
  assert.equal('destinationBody' in reconstructed, false);
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePlenty,
  PlentySpecimenError,
} from '../src/lib/plentySpecimen/index.js';
import type {
  PlentyCapabilityClaim,
  PlentyEvaluationInput,
  PlentyParticular,
} from '../src/lib/plentySpecimen/types.js';

function particular(
  particularRef = 'particular:radio',
  sourceRefs = ['source:radio'],
): PlentyParticular {
  return { particularRef, kind: 'tool', sourceRefs };
}

function capability(overrides: Partial<PlentyCapabilityClaim> = {}): PlentyCapabilityClaim {
  return {
    capabilityRef: 'capability:communicate',
    particularRef: 'particular:radio',
    capability: 'communicate-100-miles',
    evidenceClass: 'observed',
    provenanceKind: 'system-observation',
    currentness: 'current',
    availability: 'available',
    access: 'accessible',
    authority: 'authorized',
    dependencyRefs: [],
    requiresCapabilityRefs: [],
    sourceRefs: ['source:radio-test'],
    ...overrides,
  };
}

function validInput(): PlentyEvaluationInput {
  return {
    need: {
      needRef: 'need:communicate',
      capabilityRequirement: 'communicate-100-miles',
    },
    particulars: [particular()],
    capabilities: [capability()],
    candidatePaths: [{
      pathRef: 'path:radio',
      needRef: 'need:communicate',
      capabilityRefs: ['capability:communicate'],
      dependencyRefs: [],
      satisfiesCapabilityRequirement: true,
      constraintResults: [],
    }],
  };
}

function expectPlentyError(fn: () => unknown, code: string): void {
  assert.throws(fn, (error: unknown) => {
    if (!(error instanceof PlentySpecimenError)) return false;
    assert.equal(error.code, code);
    return true;
  });
}

test('evaluates a minimum valid PLENTY input without upgrading its evidence', () => {
  const receipt = evaluatePlenty(validInput());

  assert.equal(receipt.needRef, 'need:communicate');
  assert.equal(receipt.candidatePathCount, 1);
  assert.equal(receipt.pathReceipts.length, 1);
});

test('rejects a candidate path that names an unknown capability', () => {
  const input = validInput();
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:missing'],
  };

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_UNKNOWN_CAPABILITY');
});

test('rejects a capability that names an unknown particular', () => {
  const input = validInput();
  input.capabilities[0] = capability({ particularRef: 'particular:missing' });

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_UNKNOWN_PARTICULAR');
});

test('rejects a path evaluated for a different need', () => {
  const input = validInput();
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    needRef: 'need:other',
  };

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_NEED_MISMATCH');
});

test('rejects contradictory duplicate particular identity', () => {
  const input = validInput();
  input.particulars = [
    particular('particular:radio', ['source:a']),
    particular('particular:radio', ['source:b']),
  ];

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_PARTICULAR_CONFLICT');
});

for (const provenanceKind of ['model-output', 'plenty-receipt', 'self-report'] as const) {
  test(`rejects witnessed evidence laundered through ${provenanceKind}`, () => {
    const input = validInput();
    input.capabilities[0] = capability({
      evidenceClass: 'witnessed',
      provenanceKind,
    });

    expectPlentyError(() => evaluatePlenty(input), 'PLENTY_WITNESS_LAUNDERING');
  });
}

test('accepts human-witness provenance as witnessed evidence without changing it', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    evidenceClass: 'witnessed',
    provenanceKind: 'human-witness',
  });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.candidatePathCount, 1);
});

for (const currentness of ['stale', 'unknown'] as const) {
  test(`keeps ${currentness} currentness representable`, () => {
    const input = validInput();
    input.capabilities[0] = capability({ currentness });

    assert.doesNotThrow(() => evaluatePlenty(input));
  });
}

test('validation failure is atomic and does not mutate supplied input', () => {
  const input = validInput();
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:communicate', 'capability:missing'],
  };
  const before = JSON.stringify(input);

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_UNKNOWN_CAPABILITY');
  assert.equal(JSON.stringify(input), before);
});

test('deduplicates repeated capability references inside one path receipt', () => {
  const input = validInput();
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:communicate', 'capability:communicate'],
  };

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts.length, 1);
  assert.deepEqual(receipt.pathReceipts[0].dependencyRefs, []);
});


test('does not treat a superficially related capability as satisfying the need', () => {
  const input = validInput();
  input.capabilities[0] = capability({ capability: 'heat-material' });
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    satisfiesCapabilityRequirement: false,
  };

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].structuralState, 'incomplete');
  assert.equal(receipt.disposition, 'NO_KNOWN_PATH');
});

test('marks an unresolved capability requirement cycle structurally incomplete', () => {
  const input = validInput();
  input.capabilities = [
    capability({
      capabilityRef: 'capability:a',
      capability: 'communicate-100-miles',
      requiresCapabilityRefs: ['capability:b'],
    }),
    capability({
      capabilityRef: 'capability:b',
      requiresCapabilityRefs: ['capability:c'],
    }),
    capability({
      capabilityRef: 'capability:c',
      requiresCapabilityRefs: ['capability:a'],
    }),
  ];
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:a', 'capability:b', 'capability:c'],
  };

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].structuralState, 'incomplete');
  assert.equal(receipt.viablePathCount, 0);
});

test('becomes structurally complete when the requirement chain reaches a leaf', () => {
  const input = validInput();
  input.capabilities = [
    capability({
      capabilityRef: 'capability:a',
      capability: 'communicate-100-miles',
      requiresCapabilityRefs: ['capability:b'],
    }),
    capability({
      capabilityRef: 'capability:b',
      requiresCapabilityRefs: ['capability:c'],
    }),
    capability({
      capabilityRef: 'capability:c',
      requiresCapabilityRefs: [],
    }),
  ];
  input.candidatePaths[0] = {
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:a', 'capability:b', 'capability:c'],
  };

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].structuralState, 'complete');
  assert.equal(receipt.pathReceipts[0].viabilityState, 'viable');
});

for (const [field, value] of [
  ['availability', 'unavailable'],
  ['access', 'inaccessible'],
  ['authority', 'unauthorized'],
  ['currentness', 'stale'],
] as const) {
  test(`${field} ${value} blocks present viability`, () => {
    const input = validInput();
    input.capabilities[0] = capability({ [field]: value });

    const receipt = evaluatePlenty(input);
    assert.equal(receipt.pathReceipts[0].viabilityState, 'blocked');
    assert.equal(receipt.viablePathCount, 0);
  });
}

for (const field of ['availability', 'access', 'authority', 'currentness'] as const) {
  test(`unknown ${field} remains unresolved rather than false`, () => {
    const input = validInput();
    input.capabilities[0] = capability({ [field]: 'unknown' });

    const receipt = evaluatePlenty(input);
    assert.equal(receipt.pathReceipts[0].viabilityState, 'unresolved');
    assert.equal(receipt.viablePathCount, 0);
    assert.deepEqual(receipt.unresolvedClaimRefs, ['capability:communicate']);
  });
}

test('failed hard resource constraint blocks viability', () => {
  const input = validInput();
  input.need.constraints = [{ constraintRef: 'constraint:money', kind: 'resource', hard: true }];
  input.candidatePaths[0].constraintResults = [{
    constraintRef: 'constraint:money',
    result: 'failed',
  }];

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].viabilityState, 'blocked');
});

test('failed hard time constraint blocks viability', () => {
  const input = validInput();
  input.need.constraints = [{ constraintRef: 'constraint:deadline', kind: 'time', hard: true }];
  input.candidatePaths[0].constraintResults = [{
    constraintRef: 'constraint:deadline',
    result: 'failed',
  }];

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].viabilityState, 'blocked');
});

test('unknown hard constraint remains unresolved', () => {
  const input = validInput();
  input.need.constraints = [{ constraintRef: 'constraint:money', kind: 'resource', hard: true }];
  input.candidatePaths[0].constraintResults = [{
    constraintRef: 'constraint:money',
    result: 'unknown',
  }];

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].viabilityState, 'unresolved');
});

test('omitted hard need constraint remains unresolved', () => {
  const input = validInput();
  input.need.constraints = [{ constraintRef: 'constraint:money', kind: 'resource', hard: true }];

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].viabilityState, 'unresolved');
});

test('satisfied hard constraints permit present viability', () => {
  const input = validInput();
  input.need.constraints = [
    { constraintRef: 'constraint:money', kind: 'resource', hard: true },
    { constraintRef: 'constraint:deadline', kind: 'time', hard: true },
  ];
  input.candidatePaths[0].constraintResults = [
    { constraintRef: 'constraint:money', result: 'satisfied' },
    { constraintRef: 'constraint:deadline', result: 'satisfied' },
  ];

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.pathReceipts[0].viabilityState, 'viable');
});

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluatePlenty,
  PlentySpecimenError,
} from '../src/lib/plentySpecimen/index.js';
import { createPowerCutSpecimen } from '../src/lib/plentySpecimen/fixtures.js';
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


function manyPathInput(entries: Array<{
  pathRef: string;
  capabilityRef: string;
  dependencyRefs?: string[];
  particularRef?: string;
}>): PlentyEvaluationInput {
  const particulars = entries.map((entry, index) =>
    particular(entry.particularRef ?? `particular:${index}`, [`source:${index}`])
  );
  const capabilities = entries.map((entry, index) =>
    capability({
      capabilityRef: entry.capabilityRef,
      particularRef: particulars[index].particularRef,
      capability: 'communicate-100-miles',
      dependencyRefs: entry.dependencyRefs ?? [],
    })
  );
  return {
    need: {
      needRef: 'need:communicate',
      capabilityRequirement: 'communicate-100-miles',
    },
    particulars,
    capabilities,
    candidatePaths: entries.map((entry) => ({
      pathRef: entry.pathRef,
      needRef: 'need:communicate',
      capabilityRefs: [entry.capabilityRef],
      dependencyRefs: [],
      satisfiesCapabilityRequirement: true,
      constraintResults: [],
    })),
  };
}

test('deduplicates byte-equivalent duplicate path identity', () => {
  const input = validInput();
  input.candidatePaths.push({ ...input.candidatePaths[0] });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.candidatePathCount, 1);
  assert.equal(receipt.viablePathCount, 1);
  assert.equal(receipt.independentPathCount, 1);
});

test('rejects contradictory duplicate path identity', () => {
  const input = validInput();
  input.capabilities.push(capability({
    capabilityRef: 'capability:other',
  }));
  input.candidatePaths.push({
    ...input.candidatePaths[0],
    capabilityRefs: ['capability:other'],
  });

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_PATH_CONFLICT');
});

test('shared dependency aliases do not create independent paths', () => {
  const input = manyPathInput([
    { pathRef: 'path:email', capabilityRef: 'capability:email', dependencyRefs: ['dependency:power:grid-a'] },
    { pathRef: 'path:signal', capabilityRef: 'capability:signal', dependencyRefs: ['dependency:power:grid-a'] },
    { pathRef: 'path:matrix', capabilityRef: 'capability:matrix', dependencyRefs: ['dependency:power:grid-a'] },
  ]);

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 3);
  assert.equal(receipt.independentPathCount, 1);
  assert.deepEqual(receipt.fragileDependencyRefs, ['dependency:power:grid-a']);
});

test('ten viable routes through one car remain one independent path', () => {
  const input = manyPathInput(Array.from({ length: 10 }, (_, index) => ({
    pathRef: `path:${String(index).padStart(2, '0')}`,
    capabilityRef: `capability:${index}`,
    dependencyRefs: ['dependency:car:1'],
  })));

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 10);
  assert.equal(receipt.independentPathCount, 1);
  assert.equal(receipt.disposition, 'VIABLE_BUT_FRAGILE');
});

test('providers sharing one upstream provider remain correlated', () => {
  const input = manyPathInput([
    { pathRef: 'path:a', capabilityRef: 'capability:a', dependencyRefs: ['dependency:upstream:x'] },
    { pathRef: 'path:b', capabilityRef: 'capability:b', dependencyRefs: ['dependency:upstream:x'] },
    { pathRef: 'path:c', capabilityRef: 'capability:c', dependencyRefs: ['dependency:upstream:x'] },
  ]);

  assert.equal(evaluatePlenty(input).independentPathCount, 1);
});

test('many routes requiring one human remain one fragile family', () => {
  const input = manyPathInput(Array.from({ length: 40 }, (_, index) => ({
    pathRef: `path:human:${index}`,
    capabilityRef: `capability:human:${index}`,
    dependencyRefs: ['dependency:person:sam'],
  })));

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.independentPathCount, 1);
  assert.deepEqual(receipt.fragileDependencyRefs, ['dependency:person:sam']);
});

test('chooses the lexicographically first maximum disjoint viable path set', () => {
  const input = manyPathInput([
    { pathRef: 'path:a', capabilityRef: 'capability:a', dependencyRefs: ['dependency:power:grid'] },
    { pathRef: 'path:b', capabilityRef: 'capability:b', dependencyRefs: ['dependency:power:solar'] },
    { pathRef: 'path:c', capabilityRef: 'capability:c', dependencyRefs: ['dependency:power:grid', 'dependency:person:sam'] },
  ]);

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.independentPathCount, 2);
  assert.deepEqual(receipt.independentPathRefs, ['path:a', 'path:b']);
  assert.equal(receipt.disposition, 'MULTIPATH');
});

test('two distinct dependency-free capability chains can be independently viable', () => {
  const input = manyPathInput([
    { pathRef: 'path:a', capabilityRef: 'capability:a' },
    { pathRef: 'path:b', capabilityRef: 'capability:b' },
  ]);

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.independentPathCount, 2);
  assert.equal(receipt.disposition, 'RESILIENT_MULTIPATH');
});

test('duplicate dependency-free surfaces over the same capability chain do not inflate independence', () => {
  const input = validInput();
  input.candidatePaths.push({
    ...input.candidatePaths[0],
    pathRef: 'path:radio-alias',
  });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 2);
  assert.equal(receipt.independentPathCount, 1);
});

test('ten thousand syntactic variants around one dependency family remain one independent path', () => {
  const input = validInput();
  input.capabilities[0] = capability({ dependencyRefs: ['dependency:power:one'] });
  input.candidatePaths = Array.from({ length: 10_000 }, (_, index) => ({
    ...input.candidatePaths[0],
    pathRef: `path:variant:${index}`,
  }));

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 10_000);
  assert.equal(receipt.independentPathCount, 1);
});

test('destroying one route leaves unrelated viable paths intact', () => {
  const input = manyPathInput([
    { pathRef: 'path:grid', capabilityRef: 'capability:grid', dependencyRefs: ['dependency:grid'] },
    { pathRef: 'path:solar', capabilityRef: 'capability:solar', dependencyRefs: ['dependency:solar'] },
  ]);
  const baseline = evaluatePlenty(input);
  assert.equal(baseline.independentPathCount, 2);

  input.capabilities[0] = {
    ...input.capabilities[0],
    availability: 'unavailable',
  };
  const after = evaluatePlenty(input);
  assert.equal(after.viablePathCount, 1);
  assert.equal(after.independentPathCount, 1);
  assert.deepEqual(after.independentPathRefs, ['path:solar']);
});


test('refuses a PLENTY receipt as the sole source of authority', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    provenanceKind: 'external-claim',
    authority: 'authorized',
    authoritySourceRefs: ['plenty-receipt:prior'],
  });

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_RECURSIVE_AUTHORITY');
});

test('permits a prior PLENTY receipt as provenance when it is not the authority source', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    provenanceKind: 'external-claim',
    evidenceClass: 'observed',
    sourceRefs: ['plenty-receipt:prior', 'source:independent-observation'],
    authoritySourceRefs: ['source:human-permission'],
  });

  assert.doesNotThrow(() => evaluatePlenty(input));
});

test('an output without reproductive evidence does not manufacture a reusable child capability', () => {
  const input = validInput();
  input.capabilities[0] = capability({ reproductiveEvidenceRefs: [] });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.candidatePathCount, 1);
  assert.equal(receipt.pathReceipts.length, 1);
  assert.deepEqual(receipt.unusedCapabilityRefs, []);
});

test('reconstruction evidence is preserved as input evidence but creates no extra path', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    reproductiveEvidenceRefs: ['recipe:radio-rebuild', 'lineage:radio-v1'],
  });
  const before = JSON.stringify(input);

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.candidatePathCount, 1);
  assert.equal(JSON.stringify(input), before);
});

test('duplicate capability descriptions on the same particular do not mint independence', () => {
  const input = validInput();
  input.capabilities.push(capability({
    capabilityRef: 'capability:communicate-alias',
    capability: 'communicate-100-miles',
    particularRef: 'particular:radio',
  }));
  input.candidatePaths.push({
    ...input.candidatePaths[0],
    pathRef: 'path:radio-alias-two',
    capabilityRefs: ['capability:communicate-alias'],
  });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 2);
  assert.equal(receipt.independentPathCount, 1);
});

test('evaluation preserves the entire nested source graph byte-for-byte', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    dependencyRefs: ['dependency:a', 'dependency:b'],
    reproductiveEvidenceRefs: ['recipe:one'],
    authoritySourceRefs: ['source:permission'],
  });
  const before = JSON.stringify(input);

  evaluatePlenty(input);

  assert.equal(JSON.stringify(input), before);
});

test('canonical power cut leaves seven possibilities but zero viable communication paths', () => {
  const input = createPowerCutSpecimen();
  const receipt = evaluatePlenty(input);

  assert.equal(receipt.candidatePathCount, 7);
  assert.equal(receipt.structurallyCompletePathCount, 7);
  assert.equal(receipt.viablePathCount, 0);
  assert.equal(receipt.independentPathCount, 0);
  assert.equal(receipt.disposition, 'POSSIBILITIES_ONLY');
  assert.deepEqual(receipt.blockingDependencyRefs, ['dependency:power:primary']);
});


test('two routes sharing one underlying particular are not independent', () => {
  const input = validInput();
  input.capabilities.push(capability({
    capabilityRef: 'capability:communicate-second-mode',
    capability: 'communicate-100-miles',
    particularRef: 'particular:radio',
  }));
  input.candidatePaths.push({
    ...input.candidatePaths[0],
    pathRef: 'path:radio-second-mode',
    capabilityRefs: ['capability:communicate-second-mode'],
  });

  const receipt = evaluatePlenty(input);
  assert.equal(receipt.viablePathCount, 2);
  assert.equal(receipt.independentPathCount, 1);
});

test('duplicate particular identity treats source refs as an order-insensitive set', () => {
  const input = validInput();
  input.particulars = [
    particular('particular:radio', ['source:a', 'source:b']),
    particular('particular:radio', ['source:b', 'source:a']),
  ];

  assert.doesNotThrow(() => evaluatePlenty(input));
});

test('contradictory duplicate capability identity fails closed', () => {
  const input = validInput();
  input.capabilities = [
    capability({ availability: 'available' }),
    capability({ availability: 'unavailable' }),
  ];

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_CAPABILITY_CONFLICT');
});

test('contradictory duplicate hard-constraint results fail closed', () => {
  const input = validInput();
  input.need.constraints = [{ constraintRef: 'constraint:money', kind: 'resource', hard: true }];
  input.candidatePaths[0].constraintResults = [
    { constraintRef: 'constraint:money', result: 'satisfied' },
    { constraintRef: 'constraint:money', result: 'failed' },
  ];

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_CONSTRAINT_CONFLICT');
});

test('a capability requirement pointing to an unknown capability fails closed', () => {
  const input = validInput();
  input.capabilities[0] = capability({
    requiresCapabilityRefs: ['capability:missing-requirement'],
  });

  expectPlentyError(() => evaluatePlenty(input), 'PLENTY_UNKNOWN_REQUIREMENT');
});

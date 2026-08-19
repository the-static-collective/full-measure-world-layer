import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createStrideSpecimenSession,
  StrideSpecimenError,
} from '../src/lib/strideSpecimen/index.js';
import type { WorldEncounterResidue } from '../src/lib/worldRuntime/types.js';

function residue(input: {
  residueRef: string;
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  outcomeClass: WorldEncounterResidue['outcomeClass'];
  constitutedDestinationRefs?: string[];
}): WorldEncounterResidue {
  return {
    residueRef: input.residueRef,
    sourceFieldRef: input.sourceFieldRef,
    doorRef: input.doorRef,
    crossingRef: input.crossingRef,
    outcomeClass: input.outcomeClass,
    evidenceRefs: [`evidence:${input.crossingRef}`],
    unresolvedRefs: input.outcomeClass === 'admitted' ? [] : [`unresolved:${input.outcomeClass}`],
    returnRefs: [],
    constitutedDestinationRefs: input.constitutedDestinationRefs ?? [],
  };
}

function expectStrideError(fn: () => unknown, code: string): void {
  assert.throws(fn, (error: unknown) => {
    assert.ok(error instanceof StrideSpecimenError);
    assert.equal(error.code, code);
    return true;
  });
}

test('STRIDE takes two independently confirmed admitted steps and freshly orients after each footprint', () => {
  const session = createStrideSpecimenSession();

  const stanceA = session.getStance();
  assert.equal(stanceA.positionRef, 'stride-position:A');
  assert.equal(stanceA.fieldRef, 'stride-field:A');
  assert.deepEqual(stanceA.exposedDoorRefs, [
    'stride-door:A-B',
    'stride-door:A-C',
    'stride-door:A-D',
  ]);

  const first = session.takeStep({
    stanceRef: stanceA.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:1',
    confirmationRef: 'confirmation:1',
    residue: residue({
      residueRef: 'world-residue:000001',
      sourceFieldRef: stanceA.fieldRef,
      doorRef: 'stride-door:A-B',
      crossingRef: 'crossing:A-B:1',
      outcomeClass: 'admitted',
      constitutedDestinationRefs: ['corpus-output:B:1'],
    }),
  });

  assert.equal(first.footprint.outcomeClass, 'admitted');
  assert.equal(first.footprint.confirmationRef, 'confirmation:1');
  assert.deepEqual(first.footprint.constitutedRefsAdded, ['corpus-output:B:1']);

  const stanceB = session.getStance();
  assert.equal(first.stanceAfterRef, stanceB.stanceRef);
  assert.equal(stanceB.positionRef, 'stride-position:B');
  assert.equal(stanceB.fieldRef, 'stride-field:B');
  assert.deepEqual(stanceB.residueRefs, ['world-residue:000001']);
  assert.deepEqual(stanceB.exposedDoorRefs, [
    'stride-door:B-C',
    'stride-door:B-E',
    'stride-door:B-F',
  ]);
  assert.equal(stanceB.exposedDoorRefs.includes('stride-door:A-D'), false);

  const second = session.takeStep({
    stanceRef: stanceB.stanceRef,
    doorRef: 'stride-door:B-E',
    crossingRef: 'crossing:B-E:2',
    confirmationRef: 'confirmation:2',
    residue: residue({
      residueRef: 'world-residue:000002',
      sourceFieldRef: stanceB.fieldRef,
      doorRef: 'stride-door:B-E',
      crossingRef: 'crossing:B-E:2',
      outcomeClass: 'admitted',
      constitutedDestinationRefs: ['corpus-output:E:1'],
    }),
  });

  const stanceE = session.getStance();
  assert.equal(second.stanceAfterRef, stanceE.stanceRef);
  assert.equal(stanceE.positionRef, 'stride-position:E');
  assert.deepEqual(stanceE.residueRefs, [
    'world-residue:000001',
    'world-residue:000002',
  ]);
  assert.deepEqual(stanceE.exposedDoorRefs, [
    'stride-door:E-A',
    'stride-door:E-F',
  ]);

  const witnesses = session.getWitnesses();
  assert.equal(witnesses.length, 2);
  assert.deepEqual(witnesses, [first, second]);
  assert.equal(witnesses.every((witness) => witness.authority === 'none'), true);
});

test('refused and indeterminate attempts leave footprints without constituting their destinations', () => {
  for (const outcomeClass of ['refused', 'indeterminate'] as const) {
    const session = createStrideSpecimenSession();
    const before = session.getStance();

    const witness = session.takeStep({
      stanceRef: before.stanceRef,
      doorRef: 'stride-door:A-B',
      crossingRef: `crossing:A-B:${outcomeClass}`,
      confirmationRef: `confirmation:${outcomeClass}`,
      residue: residue({
        residueRef: `world-residue:${outcomeClass}`,
        sourceFieldRef: before.fieldRef,
        doorRef: 'stride-door:A-B',
        crossingRef: `crossing:A-B:${outcomeClass}`,
        outcomeClass,
      }),
    });

    const after = session.getStance();
    assert.equal(witness.footprint.outcomeClass, outcomeClass);
    assert.deepEqual(witness.footprint.constitutedRefsAdded, []);
    assert.equal(after.positionRef, 'stride-position:A');
    assert.deepEqual(after.exposedDoorRefs, before.exposedDoorRefs);
    assert.deepEqual(after.residueRefs, [`world-residue:${outcomeClass}`]);
    assert.notEqual(after.stanceRef, before.stanceRef);
  }
});

test('STRIDE refuses stale stance and a door carried forward from an old orientation', () => {
  const session = createStrideSpecimenSession();
  const stanceA = session.getStance();

  session.takeStep({
    stanceRef: stanceA.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:1',
    confirmationRef: 'confirmation:1',
    residue: residue({
      residueRef: 'world-residue:000001',
      sourceFieldRef: stanceA.fieldRef,
      doorRef: 'stride-door:A-B',
      crossingRef: 'crossing:A-B:1',
      outcomeClass: 'admitted',
    }),
  });

  const stanceB = session.getStance();
  const historyBefore = session.getWitnesses();

  expectStrideError(() => session.takeStep({
    stanceRef: stanceA.stanceRef,
    doorRef: 'stride-door:A-C',
    crossingRef: 'crossing:stale',
    confirmationRef: 'confirmation:stale',
    residue: residue({
      residueRef: 'world-residue:stale',
      sourceFieldRef: stanceA.fieldRef,
      doorRef: 'stride-door:A-C',
      crossingRef: 'crossing:stale',
      outcomeClass: 'refused',
    }),
  }), 'STRIDE_STALE_STANCE');

  expectStrideError(() => session.takeStep({
    stanceRef: stanceB.stanceRef,
    doorRef: 'stride-door:A-D',
    crossingRef: 'crossing:old-door',
    confirmationRef: 'confirmation:old-door',
    residue: residue({
      residueRef: 'world-residue:old-door',
      sourceFieldRef: stanceB.fieldRef,
      doorRef: 'stride-door:A-D',
      crossingRef: 'crossing:old-door',
      outcomeClass: 'refused',
    }),
  }), 'STRIDE_DOOR_NOT_EXPOSED');

  assert.deepEqual(session.getWitnesses(), historyBefore);
  assert.deepEqual(session.getStance(), stanceB);
});

test('each STRIDE attempt requires a distinct explicit confirmation', () => {
  const session = createStrideSpecimenSession();
  const stanceA = session.getStance();

  session.takeStep({
    stanceRef: stanceA.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:1',
    confirmationRef: 'confirmation:shared',
    residue: residue({
      residueRef: 'world-residue:000001',
      sourceFieldRef: stanceA.fieldRef,
      doorRef: 'stride-door:A-B',
      crossingRef: 'crossing:A-B:1',
      outcomeClass: 'admitted',
    }),
  });

  const stanceB = session.getStance();
  const before = session.getWitnesses();

  expectStrideError(() => session.takeStep({
    stanceRef: stanceB.stanceRef,
    doorRef: 'stride-door:B-E',
    crossingRef: 'crossing:B-E:2',
    confirmationRef: 'confirmation:shared',
    residue: residue({
      residueRef: 'world-residue:000002',
      sourceFieldRef: stanceB.fieldRef,
      doorRef: 'stride-door:B-E',
      crossingRef: 'crossing:B-E:2',
      outcomeClass: 'admitted',
    }),
  }), 'STRIDE_CONFIRMATION_REUSED');

  assert.deepEqual(session.getWitnesses(), before);
  assert.deepEqual(session.getStance(), stanceB);
});

test('STRIDE validates completed residue before mutating session state', () => {
  const session = createStrideSpecimenSession();
  const before = session.getStance();

  expectStrideError(() => session.takeStep({
    stanceRef: before.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:1',
    confirmationRef: 'confirmation:1',
    residue: residue({
      residueRef: 'world-residue:mismatch',
      sourceFieldRef: before.fieldRef,
      doorRef: 'stride-door:A-C',
      crossingRef: 'crossing:A-B:1',
      outcomeClass: 'refused',
    }),
  }), 'STRIDE_RESIDUE_MISMATCH');

  assert.deepEqual(session.getStance(), before);
  assert.deepEqual(session.getWitnesses(), []);
});

test('STRIDE refuses a non-admitted residue that claims constituted destination refs', () => {
  const session = createStrideSpecimenSession();
  const before = session.getStance();

  expectStrideError(() => session.takeStep({
    stanceRef: before.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:bad-refusal',
    confirmationRef: 'confirmation:bad-refusal',
    residue: residue({
      residueRef: 'world-residue:bad-refusal',
      sourceFieldRef: before.fieldRef,
      doorRef: 'stride-door:A-B',
      crossingRef: 'crossing:A-B:bad-refusal',
      outcomeClass: 'refused',
      constitutedDestinationRefs: ['illegal:constituted'],
    }),
  }), 'STRIDE_ILLEGAL_CONSTITUTED_REFS');

  assert.deepEqual(session.getStance(), before);
  assert.deepEqual(session.getWitnesses(), []);
});

test('STRIDE Specimen 001 explicitly refuses a third attempted step', () => {
  const session = createStrideSpecimenSession();
  const stanceA = session.getStance();

  session.takeStep({
    stanceRef: stanceA.stanceRef,
    doorRef: 'stride-door:A-B',
    crossingRef: 'crossing:A-B:1',
    confirmationRef: 'confirmation:1',
    residue: residue({
      residueRef: 'world-residue:000001',
      sourceFieldRef: stanceA.fieldRef,
      doorRef: 'stride-door:A-B',
      crossingRef: 'crossing:A-B:1',
      outcomeClass: 'admitted',
    }),
  });

  const stanceB = session.getStance();
  session.takeStep({
    stanceRef: stanceB.stanceRef,
    doorRef: 'stride-door:B-E',
    crossingRef: 'crossing:B-E:2',
    confirmationRef: 'confirmation:2',
    residue: residue({
      residueRef: 'world-residue:000002',
      sourceFieldRef: stanceB.fieldRef,
      doorRef: 'stride-door:B-E',
      crossingRef: 'crossing:B-E:2',
      outcomeClass: 'admitted',
    }),
  });

  const stanceE = session.getStance();
  const witnessesBefore = session.getWitnesses();

  expectStrideError(() => session.takeStep({
    stanceRef: stanceE.stanceRef,
    doorRef: 'stride-door:E-A',
    crossingRef: 'crossing:E-A:3',
    confirmationRef: 'confirmation:3',
    residue: residue({
      residueRef: 'world-residue:000003',
      sourceFieldRef: stanceE.fieldRef,
      doorRef: 'stride-door:E-A',
      crossingRef: 'crossing:E-A:3',
      outcomeClass: 'admitted',
    }),
  }), 'STRIDE_STEP_LIMIT_REACHED');

  assert.deepEqual(session.getStance(), stanceE);
  assert.deepEqual(session.getWitnesses(), witnessesBefore);
});

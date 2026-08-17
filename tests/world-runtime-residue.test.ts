import assert from 'node:assert/strict';
import test from 'node:test';

import { getFixtureDoorProjection, getFixtureWorldField } from '../src/lib/worldRuntime/fixtureDoorSource.js';
import { createWorldResidueStore } from '../src/lib/worldRuntime/residue.js';

const baseResidue = {
  sourceFieldRef: 'full-measure:garden:v0.1',
  doorRef: 'world-door:corpus-casework-v0.1',
  crossingRef: 'full-measure:crossing:0001',
  evidenceRefs: ['tranchnode:decode:1', `enc-${'a'.repeat(64)}`],
  unresolvedRefs: [] as string[],
  returnRefs: ['full-measure:return:0001'],
  constitutedDestinationRefs: [] as string[],
};

test('fixture door source exposes exactly three metadata-only doors and labels the source honestly', () => {
  const field = getFixtureWorldField();
  const doors = getFixtureDoorProjection();

  assert.equal(field.fieldRef, 'full-measure:garden:v0.1');
  assert.equal(field.sourceMode, 'fixture');
  assert.equal(doors.length, 3);
  assert.ok(doors.every((door) => door.sourceMode === 'fixture'));
  assert.ok(doors.every((door) => door.authority === 'none'));
  assert.ok(doors.every((door) => !('payload' in door)));

  const corpusDoor = doors.find((door) => door.destinationRef === 'corpus-os:casework-v0.1');
  assert.ok(corpusDoor);
  assert.equal(corpusDoor?.requiredCrossingProfile, 'casework.synthetic-echo/v0.1');
  assert.equal(corpusDoor?.reachability, 'reachable');
});

test('residue store keeps validation failure and four destination dispositions distinct', () => {
  const store = createWorldResidueStore();
  const outcomes = ['validation-failed', 'admitted', 'refused', 'indeterminate', 'failed'] as const;

  const residues = outcomes.map((outcomeClass, index) => store.append({
    ...baseResidue,
    crossingRef: `full-measure:crossing:${index}`,
    outcomeClass,
    constitutedDestinationRefs: outcomeClass === 'admitted' ? ['corpus-output:1'] : [],
  }));

  assert.deepEqual(residues.map((item) => item.outcomeClass), outcomes);
  assert.deepEqual(residues.map((item) => item.residueRef), [
    'world-residue:000001',
    'world-residue:000002',
    'world-residue:000003',
    'world-residue:000004',
    'world-residue:000005',
  ]);
  assert.equal(store.list().length, 5);
  assert.equal(store.get('world-residue:000003')?.outcomeClass, 'refused');
});

test('refused, indeterminate, failed, and validation-failed residue cannot manufacture constituted destination state', () => {
  const store = createWorldResidueStore();
  for (const outcomeClass of ['validation-failed', 'refused', 'indeterminate', 'failed'] as const) {
    assert.throws(
      () => store.append({
        ...baseResidue,
        outcomeClass,
        constitutedDestinationRefs: ['fake:constituted-output'],
      }),
      /only admitted encounters may constitute destination refs/,
    );
  }
});

test('residue stores foreign evidence references, not donor payload bodies or authority objects', () => {
  const store = createWorldResidueStore();
  const residue = store.append({ ...baseResidue, outcomeClass: 'refused' });
  assert.deepEqual(residue.evidenceRefs, baseResidue.evidenceRefs);
  assert.equal('warrant' in residue, false);
  assert.equal('donorBody' in residue, false);
  assert.equal('authority' in residue, false);
});

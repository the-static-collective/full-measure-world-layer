import assert from 'node:assert/strict';
import test from 'node:test';

import { createBootHouseOrchestrator } from '../src/lib/worldRuntime/orchestrator.js';
import { getFixtureDoorProjection } from '../src/lib/worldRuntime/fixtureDoorSource.js';
import { createWorldResidueStore } from '../src/lib/worldRuntime/residue.js';

const ENVELOPE_REF = `enc-${'d'.repeat(64)}`;
const corpusDoor = getFixtureDoorProjection().find((door) => door.destinationRef === 'corpus-os:casework-v0.1')!;

function confirmedInput() {
  return {
    sourceFieldRef: 'full-measure:garden:v0.1',
    doorRef: corpusDoor.doorRef,
    crossingRef: 'full-measure:crossing:0001',
    confirmationReceiptRef: 'full-measure:confirmation:0001',
    traversalEvidenceRefs: ['tranchnode:decoding:0001'],
    encounterRef: ENVELOPE_REF,
    encounterBody: { protocolVersion: 'p0.exchange/0.1' },
    destinationSubjectRef: 'artifact:agreement-a',
    input: 'bounded testimony',
  };
}

test('pre-destination Project0 validation failure records validation residue and never invokes Corpus', async () => {
  let corpusCalls = 0;
  const residueStore = createWorldResidueStore();
  const orchestrator = createBootHouseOrchestrator({
    doors: getFixtureDoorProjection(),
    residueStore,
    project0: {
      async verify() {
        return { ok: false, kind: 'donor', code: 'ENCOUNTER_ADDRESS_MISMATCH' } as const;
      },
    },
    corpus: {
      async evaluate() {
        corpusCalls += 1;
        throw new Error('Corpus must not be invoked after validation failure');
      },
    },
  });

  const result = await orchestrator.confirmEncounter(confirmedInput());
  assert.equal(result.status, 'validation-failed');
  assert.equal(result.destinationInvoked, false);
  assert.equal(corpusCalls, 0);
  assert.equal(result.residue.outcomeClass, 'validation-failed');
  assert.deepEqual(result.residue.constitutedDestinationRefs, []);
  assert.ok(result.residue.evidenceRefs.includes('full-measure:confirmation:0001'));
  assert.ok(result.residue.unresolvedRefs.includes('ENCOUNTER_ADDRESS_MISMATCH'));
});

test('verified encounter invokes Corpus once and admitted output alone may become constituted destination refs', async () => {
  let corpusCalls = 0;
  const residueStore = createWorldResidueStore();
  const orchestrator = createBootHouseOrchestrator({
    doors: getFixtureDoorProjection(),
    residueStore,
    project0: {
      async verify(expectedRef) {
        return {
          ok: true,
          value: {
            operation: 'verify',
            record: { ref: expectedRef, body: { normalized: true } },
          },
        } as const;
      },
    },
    corpus: {
      async evaluate(request) {
        corpusCalls += 1;
        assert.equal(request.envelopeRef, ENVELOPE_REF);
        assert.equal(request.destinationSubjectRef, 'artifact:agreement-a');
        return {
          ok: true,
          value: {
            status: 'admitted',
            reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
            destinationFrameRef: 'corpus-os:casework-v0.1',
            envelopeRef: ENVELOPE_REF,
            evidenceRefs: ['corpus:receipt-evidence'],
            outputRefs: ['session-output:session-request-0001'],
            authorityTransfer: 'none',
            callerAuthenticated: false,
          },
        } as const;
      },
    },
  });

  const result = await orchestrator.confirmEncounter(confirmedInput());
  assert.equal(result.status, 'admitted');
  assert.equal(result.destinationInvoked, true);
  assert.equal(corpusCalls, 1);
  assert.deepEqual(result.residue.constitutedDestinationRefs, ['session-output:session-request-0001']);
  assert.ok(result.residue.evidenceRefs.includes(ENVELOPE_REF));
  assert.ok(result.residue.evidenceRefs.includes('corpus:receipt-evidence'));
});

test('refused, indeterminate, and failed Corpus dispositions remain distinct and constitute no destination refs', async () => {
  for (const status of ['refused', 'indeterminate', 'failed'] as const) {
    const orchestrator = createBootHouseOrchestrator({
      doors: getFixtureDoorProjection(),
      residueStore: createWorldResidueStore(),
      project0: {
        async verify(expectedRef) {
          return { ok: true, value: { operation: 'verify', record: { ref: expectedRef, body: {} } } } as const;
        },
      },
      corpus: {
        async evaluate() {
          return {
            ok: true,
            value: {
              status,
              reasonCode: `CORPUS_${status.toUpperCase()}`,
              destinationFrameRef: 'corpus-os:casework-v0.1',
              envelopeRef: ENVELOPE_REF,
              evidenceRefs: [`corpus:${status}`],
              outputRefs: [],
              authorityTransfer: 'none',
              callerAuthenticated: false,
            },
          } as const;
        },
      },
    });

    const result = await orchestrator.confirmEncounter(confirmedInput());
    assert.equal(result.status, status);
    assert.equal(result.residue.outcomeClass, status);
    assert.deepEqual(result.residue.constitutedDestinationRefs, []);
  }
});

test('confirmed encounter cannot target an undeclared door', async () => {
  const orchestrator = createBootHouseOrchestrator({
    doors: getFixtureDoorProjection(),
    residueStore: createWorldResidueStore(),
    project0: { async verify() { throw new Error('must not validate'); } },
    corpus: { async evaluate() { throw new Error('must not evaluate'); } },
  });

  await assert.rejects(
    () => orchestrator.confirmEncounter({ ...confirmedInput(), doorRef: 'world-door:not-declared' }),
    /declared door/,
  );
});

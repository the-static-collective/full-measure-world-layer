import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorldRuntimeServices } from '../src/lib/worldRuntime/services.js';
import type { JsonProcessInvoker } from '../src/lib/worldRuntime/processAdapter.js';

const ENVELOPE_REF = `enc-${'e'.repeat(64)}`;

function donorInvoker(): JsonProcessInvoker {
  return async (command, request) => {
    const body = request as any;
    if (command.cwd === '/repos/tranchnode') {
      return {
        ok: true,
        value: {
          schema: 'tranchnode/intent-stroke-stdio-response/v0.1',
          ok: true,
          decoding: {
            authority: 'none',
            fingerprint: 'sha256:fixture',
            candidates: [],
            ambiguity: { kind: 'none' },
          },
        },
      };
    }
    if (command.cwd === '/repos/project0') {
      return {
        ok: true,
        value: {
          schema: 'project0/world-encounter-stdio-response/v0.1',
          ok: true,
          operation: body.operation,
          record: {
            ref: body.operation === 'verify' ? body.expectedRef : ENVELOPE_REF,
            digestHex: 'e'.repeat(64),
            recordType: 'exchange_envelope',
            body: { normalized: true },
          },
        },
      };
    }
    if (command.cwd === '/repos/corpus-os') {
      return {
        ok: true,
        value: {
          schema: 'corpus-os/world-encounter-stdio-response/v0.1',
          ok: true,
          result: {
            status: 'admitted',
            reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
            destinationFrameRef: 'corpus-os:casework-v0.1',
            envelopeRef: body.envelopeRef,
            evidenceRefs: ['corpus:evidence:1'],
            outputRefs: ['corpus:output:1'],
            authorityTransfer: 'none',
            callerAuthenticated: false,
            legalValidity: 'unclaimed',
          },
        },
      };
    }
    return { ok: false, kind: 'unavailable' };
  };
}

test('fixture field and doors remain available when every live donor is unconfigured', async () => {
  const services = createWorldRuntimeServices({}, 'linux', donorInvoker());
  assert.equal(services.getField().sourceMode, 'fixture');
  assert.equal(services.getDoors().length, 3);
  assert.deepEqual(services.availability(), {
    tranchnode: false,
    project0: false,
    corpusOs: false,
  });

  const decode = await services.decodeStroke({ stroke: {}, layout: {}, templates: [], decoder: {} });
  assert.deepEqual(decode, { ok: false, kind: 'unavailable', donor: 'tranchnode' });
  const prepare = await services.prepareEncounter({ offered: 'witness' });
  assert.deepEqual(prepare, { ok: false, kind: 'unavailable', donor: 'project0' });
});

test('configured services compose the three donor clients without changing their authority boundaries', async () => {
  const services = createWorldRuntimeServices({
    BOOT_HOUSE_TRANCHNODE_REPO: '/repos/tranchnode',
    BOOT_HOUSE_PROJECT0_REPO: '/repos/project0',
    BOOT_HOUSE_CORPUS_OS_REPO: '/repos/corpus-os',
  }, 'linux', donorInvoker());

  assert.deepEqual(services.availability(), {
    tranchnode: true,
    project0: true,
    corpusOs: true,
  });

  const decode = await services.decodeStroke({ stroke: {}, layout: {}, templates: [], decoder: {} });
  assert.equal(decode.ok, true);
  if (decode.ok) assert.equal((decode.value as any).authority, 'none');

  const prepared = await services.prepareEncounter({ offered: 'witness' });
  assert.equal(prepared.ok, true);
  if (!prepared.ok) return;
  assert.equal(prepared.value.record.ref, ENVELOPE_REF);

  const crossing = await services.confirmEncounter({
    sourceFieldRef: 'full-measure:garden:v0.1',
    doorRef: 'world-door:corpus-casework-v0.1',
    crossingRef: 'full-measure:crossing:service-1',
    confirmationReceiptRef: 'full-measure:confirmation:service-1',
    traversalEvidenceRefs: ['tranchnode:decoding:service-1'],
    encounterRef: ENVELOPE_REF,
    encounterBody: prepared.value.record.body,
    destinationSubjectRef: 'artifact:agreement-a',
    input: 'bounded testimony',
  });
  assert.equal(crossing.ok, true);
  if (!crossing.ok) return;
  assert.equal(crossing.value.status, 'admitted');
  assert.deepEqual(crossing.value.residue.constitutedDestinationRefs, ['corpus:output:1']);
  assert.equal(services.getResidue(crossing.value.residue.residueRef)?.outcomeClass, 'admitted');
});

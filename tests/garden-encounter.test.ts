import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGardenEncounterEnvelope,
  createGardenCrossingRefs,
} from '../src/lib/worldRuntime/gardenEncounter.js';

const door = {
  doorRef: 'world-door:corpus-casework-v0.1',
  destinationRef: 'corpus-os:casework-v0.1',
  sourceMode: 'fixture' as const,
};

test('Garden crossing refs keep gesture, confirmation, crossing, and testimony distinct', () => {
  assert.deepEqual(createGardenCrossingRefs('session-abc', 3), {
    crossingRef: 'full-measure:crossing:session-abc:0003',
    confirmationReceiptRef: 'full-measure:confirmation:session-abc:0003',
    testimonyRef: 'full-measure:testimony:session-abc:0003',
  });
});

test('encounter envelope carries witnessed provenance and explicitly carries no source authority', () => {
  const envelope = buildGardenEncounterEnvelope({
    testimonyRef: 'full-measure:testimony:session-abc:0003',
    confirmationReceiptRef: 'full-measure:confirmation:session-abc:0003',
    fieldRef: 'full-measure:garden:v0.1',
    door,
    traversalFingerprint: 'sha256:traversal-fingerprint',
  });

  assert.deepEqual(envelope, {
    protocolVersion: 'p0.exchange/0.1',
    originNodeRef: 'full-measure-world-layer',
    originFrameRef: 'full-measure:garden:v0.1',
    originVersionRef: 'boot-the-house/v0.1',
    offered: {
      objectRef: 'full-measure:testimony:session-abc:0003',
      mediaType: 'application/vnd.full-measure.crossing-witness+json',
      sourceReceiptRefs: [
        'full-measure:confirmation:session-abc:0003',
        'sha256:traversal-fingerprint',
      ],
      disclosureClass: 'public-prototype',
    },
    sourceProvenanceRefs: [
      'full-measure:garden:v0.1',
      'world-door:corpus-casework-v0.1',
      'sha256:traversal-fingerprint',
    ],
    sourceAuthorityRefs: [],
    sourceEpistemicKind: 'witness',
    sourceVerificationState: 'unverified',
    capabilityUsed: 'offer_public_witness',
    limitations: [
      'human-confirmation-local-only',
      'fixture-door-source',
      'no-source-authority',
      'destination-must-decide-locally',
    ],
  });
});

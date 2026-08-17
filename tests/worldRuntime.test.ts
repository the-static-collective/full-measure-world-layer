import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createWorldRuntime,
  type DestinationPort,
  type EncounterPort,
  type TraversalPort,
  type WorldDoorProjection,
} from '../src/world-runtime/orchestrator.js';

const doors: WorldDoorProjection[] = [
  {
    doorRef: 'door:corpus',
    destinationRef: 'corpus-os:world-encounter:v0.1',
    relation: 'project-backed crossing fixture',
    reachability: 'reachable',
    provenanceRefs: ['fixture:boot-house/doors/v0.1'],
    relevanceReasons: ['real destination adapter'],
    requiredCrossingProfile: 'p0.exchange/0.1',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:upper-room',
    destinationRef: 'upper-room:scripture-room',
    relation: 'nearby room',
    reachability: 'unknown',
    provenanceRefs: ['fixture:boot-house/doors/v0.1'],
    relevanceReasons: ['declared neighboring room'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:band-runtime',
    destinationRef: 'band-runtime:groove-room',
    relation: 'nearby room',
    reachability: 'unknown',
    provenanceRefs: ['fixture:boot-house/doors/v0.1'],
    relevanceReasons: ['declared neighboring room'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
];

function makePorts(options: {
  ambiguity?: 'none' | 'collision';
  encounterStatus?: 'ok' | 'validation-failed';
  destinationStatus?: 'admitted' | 'refused' | 'indeterminate' | 'failed';
} = {}) {
  const calls = { traversal: 0, encounter: 0, destination: 0 };

  const traversal: TraversalPort = {
    async decode() {
      calls.traversal += 1;
      const ambiguity = options.ambiguity ?? 'none';
      return {
        authority: 'none',
        decodingRef: 'tranchnode:decoding:fixture-1',
        candidates: [
          { doorRef: 'door:corpus', totalCost: 10 },
          { doorRef: 'door:upper-room', totalCost: ambiguity === 'collision' ? 10 : 30 },
        ],
        ambiguity: {
          kind: ambiguity,
          leadingDoorRefs: ambiguity === 'collision'
            ? ['door:corpus', 'door:upper-room']
            : ['door:corpus'],
        },
      };
    },
  };

  const encounter: EncounterPort = {
    async prepare(input) {
      calls.encounter += 1;
      if (options.encounterStatus === 'validation-failed') {
        return {
          status: 'validation-failed',
          reasonCode: 'PROJECT0_VALIDATION_FAILED',
          evidenceRefs: [input.confirmationReceiptRef],
        };
      }
      return {
        status: 'ok',
        encounterRef: 'enc-' + 'a'.repeat(64),
        encounter: {
          ref: 'enc-' + 'a'.repeat(64),
          body: { protocolVersion: 'p0.exchange/0.1' },
        },
        evidenceRefs: [input.confirmationReceiptRef, 'project0:encounter:fixture-1'],
      };
    },
  };

  const destination: DestinationPort = {
    async evaluate(input) {
      calls.destination += 1;
      const status = options.destinationStatus ?? 'admitted';
      if (status === 'failed') {
        return {
          status: 'failed',
          authority: 'none',
          failureClass: 'CORPUS_DESTINATION_RUNTIME_FAILURE',
          evidenceRefs: [input.encounterRef],
        };
      }
      return {
        status,
        authority: 'none',
        reasonCode: status === 'admitted'
          ? 'CORPUS_ENCOUNTER_ADMITTED'
          : status === 'refused'
            ? 'CORPUS_DISCLOSURE_NOT_ACCEPTED'
            : 'CORPUS_SOURCE_VERIFICATION_UNRESOLVED',
        evidenceRefs: [input.encounterRef, 'corpus:policy:fixture-1'],
      };
    },
  };

  return { ports: { traversal, encounter, destination }, calls };
}

const stroke = {
  rawStrokeRef: 'full-measure:stroke:1',
  points: [
    { sequence: 0, x: 0, y: 0 },
    { sequence: 1, x: 100, y: 0 },
  ],
};

test('field exposes exactly three metadata-only non-authoritative doors', () => {
  const { ports } = makePorts();
  const runtime = createWorldRuntime({ doors, ...ports });
  const field = runtime.getField();

  assert.equal(field.doors.length, 3);
  assert.equal(field.doors.every((door) => door.authority === 'none'), true);
  assert.deepEqual(field.doors.map((door) => door.evidenceMode), ['fixture', 'fixture', 'fixture']);
  assert.equal(JSON.stringify(field).includes('destinationPayload'), false);
});

test('decoding a stroke can never cross a constitutional boundary', async () => {
  const { ports, calls } = makePorts();
  const runtime = createWorldRuntime({ doors, ...ports });

  const decoded = await runtime.decodeStroke(stroke);

  assert.equal(decoded.kind, 'confirmation-required');
  assert.equal(decoded.decoding.authority, 'none');
  assert.equal(calls.traversal, 1);
  assert.equal(calls.encounter, 0);
  assert.equal(calls.destination, 0);
});

test('collision stays unresolved until the human explicitly chooses a leading door', async () => {
  const { ports, calls } = makePorts({ ambiguity: 'collision' });
  const runtime = createWorldRuntime({ doors, ...ports });
  const decoded = await runtime.decodeStroke(stroke);

  await assert.rejects(
    runtime.confirmCrossing({
      pendingId: decoded.pendingId,
      confirmed: true,
      doorRef: 'door:band-runtime',
      offeredWitnessRefs: ['full-measure:witness:1'],
      confirmedBy: 'user_lu',
    }),
    /confirmed door is not a leading traversal candidate/
  );
  assert.equal(calls.encounter, 0);
  assert.equal(calls.destination, 0);
});

test('a visible but unreachable leading door cannot be sent through the destination adapter', async () => {
  const { ports, calls } = makePorts({ ambiguity: 'collision' });
  const runtime = createWorldRuntime({ doors, ...ports });
  const decoded = await runtime.decodeStroke(stroke);

  await assert.rejects(
    runtime.confirmCrossing({
      pendingId: decoded.pendingId,
      confirmed: true,
      doorRef: 'door:upper-room',
      offeredWitnessRefs: ['full-measure:witness:1'],
      confirmedBy: 'user_lu',
    }),
    /confirmed door is not currently reachable/
  );
  assert.equal(calls.encounter, 0);
  assert.equal(calls.destination, 0);
});

test('Project0 validation failure never invokes the destination', async () => {
  const { ports, calls } = makePorts({ encounterStatus: 'validation-failed' });
  const runtime = createWorldRuntime({ doors, ...ports });
  const decoded = await runtime.decodeStroke(stroke);

  const result = await runtime.confirmCrossing({
    pendingId: decoded.pendingId,
    confirmed: true,
    doorRef: 'door:corpus',
    offeredWitnessRefs: ['full-measure:witness:1'],
    confirmedBy: 'user_lu',
  });

  assert.equal(result.kind, 'validation-failed');
  assert.equal(calls.encounter, 1);
  assert.equal(calls.destination, 0);
});

test('refusal records attributable residue without marking the destination admitted', async () => {
  const { ports } = makePorts({ destinationStatus: 'refused' });
  const runtime = createWorldRuntime({ doors, ...ports });
  const before = runtime.getField();
  const decoded = await runtime.decodeStroke(stroke);

  const result = await runtime.confirmCrossing({
    pendingId: decoded.pendingId,
    confirmed: true,
    doorRef: 'door:corpus',
    offeredWitnessRefs: ['full-measure:witness:1'],
    confirmedBy: 'user_lu',
  });

  assert.equal(result.kind, 'terminal');
  assert.equal(result.residue.destinationStatus, 'refused');
  assert.equal(result.residue.authority, 'none');
  assert.equal(result.worldChange.kind, 'boundary-scar');

  const after = runtime.getField();
  assert.deepEqual(after.admittedDestinationRefs, before.admittedDestinationRefs);
  assert.equal(after.visibleResidueRefs.includes(result.residue.residueRef), true);
});

test('admitted, refused, indeterminate, and failed remain distinct world changes', async () => {
  const expected = {
    admitted: 'illumination',
    refused: 'boundary-scar',
    indeterminate: 'unresolved-fog',
    failed: 'operational-failure',
  } as const;

  for (const status of Object.keys(expected) as Array<keyof typeof expected>) {
    const { ports } = makePorts({ destinationStatus: status });
    const runtime = createWorldRuntime({ doors, ...ports });
    const decoded = await runtime.decodeStroke(stroke);
    const result = await runtime.confirmCrossing({
      pendingId: decoded.pendingId,
      confirmed: true,
      doorRef: 'door:corpus',
      offeredWitnessRefs: ['full-measure:witness:1'],
      confirmedBy: 'user_lu',
    });

    assert.equal(result.kind, 'terminal');
    assert.equal(result.residue.destinationStatus, status);
    assert.equal(result.worldChange.kind, expected[status]);
  }
});

test('declining confirmation emits no crossing object and consumes the pending gesture', async () => {
  const { ports, calls } = makePorts();
  const runtime = createWorldRuntime({ doors, ...ports });
  const decoded = await runtime.decodeStroke(stroke);

  const result = await runtime.confirmCrossing({
    pendingId: decoded.pendingId,
    confirmed: false,
    doorRef: 'door:corpus',
    offeredWitnessRefs: [],
    confirmedBy: 'user_lu',
  });

  assert.deepEqual(result, { kind: 'declined' });
  assert.equal(calls.encounter, 0);
  assert.equal(calls.destination, 0);
  await assert.rejects(
    runtime.confirmCrossing({
      pendingId: decoded.pendingId,
      confirmed: true,
      doorRef: 'door:corpus',
      offeredWitnessRefs: [],
      confirmedBy: 'user_lu',
    }),
    /pending traversal not found/
  );
});

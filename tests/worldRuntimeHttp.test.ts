import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { createWorldRuntime } from '../src/world-runtime/orchestrator.js';
import { createWorldRuntimeRouter } from '../src/world-runtime/http.js';
import type {
  DestinationPort,
  EncounterPort,
  TraversalPort,
  WorldDoorProjection,
} from '../src/world-runtime/contracts.js';

const doors: WorldDoorProjection[] = [
  {
    doorRef: 'door:corpus', destinationRef: 'corpus-os:world-encounter:v0.1', relation: 'fixture',
    reachability: 'reachable', provenanceRefs: ['fixture:doors'], relevanceReasons: ['destination'],
    requiredCrossingProfile: 'p0.exchange/0.1', evidenceMode: 'fixture', authority: 'none',
  },
  {
    doorRef: 'door:upper-room', destinationRef: 'upper-room:scripture-room', relation: 'fixture',
    reachability: 'unknown', provenanceRefs: ['fixture:doors'], relevanceReasons: ['neighbor'],
    requiredCrossingProfile: 'not-yet-live', evidenceMode: 'fixture', authority: 'none',
  },
  {
    doorRef: 'door:band-runtime', destinationRef: 'band-runtime:groove-room', relation: 'fixture',
    reachability: 'unknown', provenanceRefs: ['fixture:doors'], relevanceReasons: ['neighbor'],
    requiredCrossingProfile: 'not-yet-live', evidenceMode: 'fixture', authority: 'none',
  },
];

async function withServer(
  run: (baseUrl: string, observed: { witnessRefs: string[]; actor: string }) => Promise<void>,
  options: { leadingDoorRef?: string } = {},
) {
  const observed = { witnessRefs: [] as string[], actor: '' };
  const leadingDoorRef = options.leadingDoorRef ?? 'door:corpus';
  const traversal: TraversalPort = {
    async decode() {
      return {
        authority: 'none',
        decodingRef: 'tranchnode:decoding:http-test',
        candidates: [{ doorRef: leadingDoorRef, totalCost: 1 }],
        ambiguity: { kind: 'none', leadingDoorRefs: [leadingDoorRef] },
      };
    },
  };
  const encounter: EncounterPort = {
    async prepare(input) {
      observed.witnessRefs = [...input.offeredWitnessRefs];
      observed.actor = input.confirmedBy;
      return {
        status: 'ok',
        encounterRef: 'enc-' + 'b'.repeat(64),
        encounter: { ref: 'enc-' + 'b'.repeat(64), body: { protocolVersion: 'p0.exchange/0.1' } },
        evidenceRefs: ['project0:http-test'],
      };
    },
  };
  const destination: DestinationPort = {
    async evaluate(input) {
      return {
        status: 'admitted',
        authority: 'none',
        reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
        evidenceRefs: [input.encounterRef, 'corpus:http-test'],
      };
    },
  };

  const runtime = createWorldRuntime({ doors, traversal, encounter, destination });
  const app = express();
  app.use(express.json({ limit: '64kb' }));
  app.use('/api/world', createWorldRuntimeRouter({
    runtime,
    offeredWitnessRef: 'github:full-measure@server-pinned:README.md',
    resolveActorId: (req) => typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : 'user_lu',
  }));

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('expected TCP server address');
  try {
    await run(`http://127.0.0.1:${address.port}`, observed);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('GET field exposes exactly three metadata-only doors', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/field`);
    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.available, true);
    assert.equal(body.field.doors.length, 3);
    assert.equal(body.field.doors.every((door: any) => door.authority === 'none'), true);
    assert.equal(JSON.stringify(body).includes('command'), false);
    assert.equal(JSON.stringify(body).includes('cwd'), false);
  });
});

test('decode returns a server-issued pending id but does not cross', async () => {
  await withServer(async (baseUrl, observed) => {
    const response = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: 100000, y: 500000 }, { x: 900000, y: 500000 }] }),
    });
    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.kind, 'confirmation-required');
    assert.equal(typeof body.pendingId, 'string');
    assert.equal(body.decoding.authority, 'none');
    assert.deepEqual(observed.witnessRefs, []);
  });
});

test('cross ignores browser-supplied witness/actor fields and uses server authority boundaries', async () => {
  await withServer(async (baseUrl, observed) => {
    const decodedResponse = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: 100000, y: 500000 }, { x: 900000, y: 500000 }] }),
    });
    const decoded = await decodedResponse.json() as any;

    const response = await fetch(`${baseUrl}/api/world/cross`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-id': 'user_real' },
      body: JSON.stringify({
        pendingId: decoded.pendingId,
        doorRef: 'door:corpus',
        confirmed: true,
        offeredWitnessRefs: ['attacker:chosen-object'],
        confirmedBy: 'attacker_actor',
      }),
    });

    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.kind, 'terminal');
    assert.equal(body.residue.destinationStatus, 'admitted');
    assert.deepEqual(observed.witnessRefs, ['github:full-measure@server-pinned:README.md']);
    assert.equal(observed.actor, 'user_real');
  });
});

test('unreachable leading door is crossing-unavailable, not an adapter failure', async () => {
  await withServer(async (baseUrl, observed) => {
    const decodedResponse = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: 100000, y: 500000 }, { x: 500000, y: 100000 }] }),
    });
    const decoded = await decodedResponse.json() as any;

    const response = await fetch(`${baseUrl}/api/world/cross`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        pendingId: decoded.pendingId,
        doorRef: 'door:upper-room',
        confirmed: true,
      }),
    });

    assert.equal(response.status, 409);
    const body = await response.json() as any;
    assert.equal(body.kind, 'crossing-unavailable');
    assert.equal(body.reasonCode, 'WORLD_CONFIRMED_DOOR_NOT_AVAILABLE');
    assert.deepEqual(observed.witnessRefs, []);
  }, { leadingDoorRef: 'door:upper-room' });
});

test('terminal residue is retrievable and confirmation ids are one-use', async () => {
  await withServer(async (baseUrl) => {
    const decodedResponse = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: 100000, y: 500000 }, { x: 900000, y: 500000 }] }),
    });
    const decoded = await decodedResponse.json() as any;
    const crossingRequest = {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pendingId: decoded.pendingId, doorRef: 'door:corpus', confirmed: true }),
    } as const;

    const first = await fetch(`${baseUrl}/api/world/cross`, crossingRequest);
    assert.equal(first.status, 200);
    const result = await first.json() as any;

    const residueResponse = await fetch(`${baseUrl}/api/world/residue/${encodeURIComponent(result.residue.residueRef)}`);
    assert.equal(residueResponse.status, 200);
    const residue = await residueResponse.json() as any;
    assert.equal(residue.residueRef, result.residue.residueRef);
    assert.equal(residue.authority, 'none');

    const replay = await fetch(`${baseUrl}/api/world/cross`, crossingRequest);
    assert.equal(replay.status, 409);
    const replayBody = await replay.json() as any;
    assert.equal(replayBody.kind, 'crossing-unavailable');
  });
});

test('invalid gestures fail before donor invocation', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: -1, y: 5 }] }),
    });
    assert.equal(response.status, 400);
    const body = await response.json() as any;
    assert.equal(body.kind, 'invalid-gesture');
  });
});

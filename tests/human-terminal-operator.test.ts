import assert from 'node:assert/strict';
import test from 'node:test';

import { createHumanTerminalOperator } from '../src/lib/humanTerminal/operator.js';
import { createWorldRuntimeClient } from '../src/lib/worldRuntime/client.js';

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; init?: any }> = [];
  const fetcher = async (url: string, init?: any) => {
    calls.push({ url, init });
    const next = responses.shift() ?? {
      status: 500,
      body: { error: 'missing fixture response' },
    };
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      async json() {
        return next.body;
      },
    };
  };
  return { calls, fetcher };
}

const FIELD = {
  fieldRef: 'world-field:garden-v0.1',
  projectionVersion: '0.1',
  sourceMode: 'fixture' as const,
  sourceRefs: ['fixture:field'],
  unresolvedRefs: ['frontier:one'],
  excludedSourceClasses: ['destination-body'],
};

const CORPUS_DOOR = {
  doorRef: 'world-door:corpus-casework-v0.1',
  destinationRef: 'corpus-os:casework',
  relation: 'constitutional-casework',
  reachability: 'reachable' as const,
  provenanceRefs: ['fixture:corpus-door'],
  relevanceReasons: ['destination can evaluate the declared encounter'],
  requiredCrossingProfile: 'project0-world-encounter-v0.1',
  authority: 'none' as const,
  sourceMode: 'fixture' as const,
};

test('orientation reads only the Full Measure field projection', async () => {
  const fixture = fakeFetch([
    { status: 200, body: { field: FIELD, availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({ kind: 'orient' });

  assert.deepEqual(fixture.calls.map((call) => call.url), ['/api/world/field']);
  assert.equal(output.status, 'ok');
  assert.equal(output.sourceMode, 'fixture');
  assert.deepEqual(output.evidenceRefs, ['fixture:field']);
  assert.match(output.lines.join(' '), /fixture-backed/i);
});

test('door explanation uses projected boundary metadata and never fetches a destination body', async () => {
  const fixture = fakeFetch([
    { status: 200, body: { doors: [CORPUS_DOOR], availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'explain-door',
    doorRef: CORPUS_DOOR.doorRef,
  });

  assert.deepEqual(fixture.calls.map((call) => call.url), ['/api/world/doors']);
  assert.equal(output.status, 'ok');
  assert.deepEqual(output.evidenceRefs, ['fixture:corpus-door']);
  assert.match(output.lines.join(' '), /authority: none/i);
  assert.match(output.lines.join(' '), /destination can evaluate/i);
});

test('safe moves preserve read-only, confirmation, blocked, source-mode, and authority truth', async () => {
  const blockedDoor = {
    ...CORPUS_DOOR,
    doorRef: 'world-door:blocked',
    destinationRef: 'other:blocked',
    reachability: 'blocked' as const,
    provenanceRefs: ['fixture:blocked'],
  };
  const fixture = fakeFetch([
    { status: 200, body: { doors: [CORPUS_DOOR, blockedDoor], availability: {} } },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({ kind: 'list-safe-moves' });

  const corpusCross = output.moves.find(
    (move) => move.intent.kind === 'begin-crossing' && move.intent.doorRef === CORPUS_DOOR.doorRef,
  );
  const blockedCross = output.moves.find(
    (move) => move.intent.kind === 'begin-crossing' && move.intent.doorRef === blockedDoor.doorRef,
  );

  assert.equal(corpusCross?.state, 'requires-human-confirmation');
  assert.equal(corpusCross?.authority, 'none');
  assert.equal(corpusCross?.sourceMode, 'fixture');
  assert.equal(blockedCross?.state, 'blocked');
});

test('residue projection preserves exact outcome class and exact evidence refs', async () => {
  const fixture = fakeFetch([
    {
      status: 200,
      body: {
        residue: {
          residueRef: 'world-residue:000001',
          sourceFieldRef: FIELD.fieldRef,
          doorRef: CORPUS_DOOR.doorRef,
          crossingRef: 'world-crossing:000001',
          outcomeClass: 'validation-failed',
          evidenceRefs: ['project0:validation'],
          unresolvedRefs: [],
          returnRefs: [],
          constitutedDestinationRefs: [],
        },
      },
    },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'inspect-residue',
    residueRef: 'world-residue:000001',
  });

  assert.equal(output.outcomeClass, 'validation-failed');
  assert.deepEqual(output.evidenceRefs, ['project0:validation']);
  assert.match(output.lines.join(' '), /destination was not invoked/i);
  assert.equal(output.lines.join(' ').includes('refused'), false);
});

test('begin-crossing is a handoff and performs zero HTTP calls', async () => {
  const fixture = fakeFetch([]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'begin-crossing',
    doorRef: CORPUS_DOOR.doorRef,
  });

  assert.deepEqual(fixture.calls, []);
  assert.deepEqual(output.handoff, {
    kind: 'garden-crossing',
    doorRef: CORPUS_DOOR.doorRef,
  });
  assert.match(output.lines.join(' '), /explicit human confirmation/i);
});

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

function residueBody(outcomeClass: string) {
  return {
    residue: {
      residueRef: `world-residue:${outcomeClass}`,
      sourceFieldRef: FIELD.fieldRef,
      doorRef: CORPUS_DOOR.doorRef,
      crossingRef: `world-crossing:${outcomeClass}`,
      outcomeClass,
      evidenceRefs: [`evidence:${outcomeClass}`],
      unresolvedRefs:
        outcomeClass === 'refused' || outcomeClass === 'indeterminate'
          ? [`reason:${outcomeClass}`]
          : [],
      returnRefs: [],
      constitutedDestinationRefs: [],
    },
  };
}

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
    { status: 200, body: residueBody('validation-failed') },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'inspect-residue',
    residueRef: 'world-residue:validation-failed',
  });

  assert.equal(output.outcomeClass, 'validation-failed');
  assert.deepEqual(output.evidenceRefs, ['evidence:validation-failed']);
  assert.match(output.lines.join(' '), /destination was not invoked/i);
  assert.equal(output.lines.join(' ').includes('refused'), false);
  assert.equal(
    output.lines.some((line) => line.startsWith('Residual influence:')),
    false,
  );
});

test('refused residue inspection exposes only a historical attention cue with no authority or reachability change', async () => {
  const fixture = fakeFetch([{ status: 200, body: residueBody('refused') }]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'inspect-residue',
    residueRef: 'world-residue:refused',
  });

  assert.ok(output.lines.includes('Residual influence: historical attention cue.'));
  assert.ok(
    output.lines.includes('Authority: none; current reachability is unchanged.'),
  );
  assert.deepEqual(output.moves, []);
  assert.deepEqual(output.evidenceRefs, ['evidence:refused']);
});

test('indeterminate residue inspection exposes an unresolved frontier without coercing it to refusal', async () => {
  const fixture = fakeFetch([
    { status: 200, body: residueBody('indeterminate') },
  ]);
  const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));

  const output = await operator.execute({
    kind: 'inspect-residue',
    residueRef: 'world-residue:indeterminate',
  });

  assert.ok(output.lines.includes('Residual influence: unresolved frontier.'));
  assert.ok(
    output.lines.includes('Authority: none; current reachability is unchanged.'),
  );
  assert.equal(output.outcomeClass, 'indeterminate');
  assert.deepEqual(output.moves, []);
});

test('plain-human residue copy keeps all destination outcome classes distinct', async () => {
  const cases = [
    {
      outcomeClass: 'admitted' as const,
      constitutedDestinationRefs: ['corpus:output-a'],
      expected: /Admitted destination refs: corpus:output-a/i,
      forbidden: /refused|failed operationally|frontier remains unresolved/i,
    },
    {
      outcomeClass: 'refused' as const,
      constitutedDestinationRefs: [],
      expected: /destination evaluated the encounter and refused it/i,
      forbidden: /failed operationally|frontier remains unresolved|destination was not invoked/i,
    },
    {
      outcomeClass: 'indeterminate' as const,
      constitutedDestinationRefs: [],
      expected: /frontier remains unresolved/i,
      forbidden: /refused it|failed operationally|destination was not invoked/i,
    },
    {
      outcomeClass: 'failed' as const,
      constitutedDestinationRefs: [],
      expected: /failed operationally/i,
      forbidden: /refused it|frontier remains unresolved|destination was not invoked/i,
    },
  ];

  for (const [index, scenario] of cases.entries()) {
    const residueRef = `world-residue:${String(index + 2).padStart(6, '0')}`;
    const fixture = fakeFetch([
      {
        status: 200,
        body: {
          residue: {
            residueRef,
            sourceFieldRef: FIELD.fieldRef,
            doorRef: CORPUS_DOOR.doorRef,
            crossingRef: `world-crossing:${String(index + 2).padStart(6, '0')}`,
            outcomeClass: scenario.outcomeClass,
            evidenceRefs: [`evidence:${scenario.outcomeClass}`],
            unresolvedRefs: [],
            returnRefs: [],
            constitutedDestinationRefs: scenario.constitutedDestinationRefs,
          },
        },
      },
    ]);
    const operator = createHumanTerminalOperator(createWorldRuntimeClient(fixture.fetcher));
    const output = await operator.execute({ kind: 'inspect-residue', residueRef });
    const copy = output.lines.join(' ');

    assert.equal(output.outcomeClass, scenario.outcomeClass);
    assert.match(copy, scenario.expected);
    assert.doesNotMatch(copy, scenario.forbidden);
    assert.deepEqual(output.evidenceRefs, [`evidence:${scenario.outcomeClass}`]);
  }
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

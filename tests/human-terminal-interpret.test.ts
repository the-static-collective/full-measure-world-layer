import assert from 'node:assert/strict';
import test from 'node:test';

import { interpretHumanTerminalInput } from '../src/lib/humanTerminal/interpret.js';

test('basic-human aliases resolve only to known operator intents', () => {
  assert.deepEqual(interpretHumanTerminalInput('Where am I?'), {
    recognized: true,
    intent: { kind: 'orient' },
  });
  assert.deepEqual(interpretHumanTerminalInput('what doors are nearby'), {
    recognized: true,
    intent: { kind: 'list-nearby-doors' },
  });
  assert.deepEqual(interpretHumanTerminalInput('What can I safely do?'), {
    recognized: true,
    intent: { kind: 'list-safe-moves' },
  });
  assert.deepEqual(
    interpretHumanTerminalInput('Why is this door here?', {
      selectedDoorRef: 'world-door:corpus-casework-v0.1',
    }),
    {
      recognized: true,
      intent: {
        kind: 'explain-door',
        doorRef: 'world-door:corpus-casework-v0.1',
      },
    },
  );
});

test('session context supplies exact residue and selected-door refs without guessing', () => {
  assert.deepEqual(
    interpretHumanTerminalInput('What happened last time?', {
      lastResidueRef: 'world-residue:000001',
    }),
    {
      recognized: true,
      intent: { kind: 'inspect-residue', residueRef: 'world-residue:000001' },
    },
  );

  assert.deepEqual(
    interpretHumanTerminalInput('Enter a crossing', {
      selectedDoorRef: 'world-door:corpus-casework-v0.1',
    }),
    {
      recognized: true,
      intent: {
        kind: 'begin-crossing',
        doorRef: 'world-door:corpus-casework-v0.1',
      },
    },
  );
});

test('unknown language fails closed and never becomes a command', () => {
  assert.deepEqual(interpretHumanTerminalInput('rm -rf everything'), {
    recognized: false,
    normalizedInput: 'rm -rf everything',
  });
  assert.deepEqual(interpretHumanTerminalInput('deploy all repos and merge whatever is green'), {
    recognized: false,
    normalizedInput: 'deploy all repos and merge whatever is green',
  });
});

test('context-dependent phrases stay unknown when the required exact ref is absent', () => {
  assert.deepEqual(interpretHumanTerminalInput('Why is this door here?'), {
    recognized: false,
    normalizedInput: 'why is this door here',
  });
  assert.deepEqual(interpretHumanTerminalInput('What happened last time?'), {
    recognized: false,
    normalizedInput: 'what happened last time',
  });
});

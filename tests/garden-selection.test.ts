import assert from 'node:assert/strict';
import test from 'node:test';

import { selectGardenTraversalCandidate } from '../src/lib/worldRuntime/gardenSelection.js';
import { getFixtureDoorProjection } from '../src/lib/worldRuntime/fixtureDoorSource.js';

const doors = getFixtureDoorProjection();

function decoding(overrides: Record<string, unknown> = {}) {
  return {
    authority: 'none',
    fingerprint: 'sha256:decode',
    candidates: [
      { templateId: 'garden-to-corpus', totalCost: 1 },
      { templateId: 'garden-to-band-runtime', totalCost: 9 },
    ],
    ambiguity: { kind: 'none', leadingTemplateIds: ['garden-to-corpus'] },
    ...overrides,
  };
}

test('unambiguous leading candidate identifies a door but never grants crossing authority', () => {
  const selection = selectGardenTraversalCandidate(decoding(), doors);
  assert.deepEqual(selection, {
    state: 'candidate',
    templateId: 'garden-to-corpus',
    doorRef: 'world-door:corpus-casework-v0.1',
    reachability: 'reachable',
    canConfirmCrossing: true,
    authority: 'none',
  });
});

test('collision remains unresolved and disables crossing confirmation', () => {
  const selection = selectGardenTraversalCandidate(decoding({
    ambiguity: { kind: 'collision', leadingTemplateIds: ['garden-to-corpus', 'garden-to-band-runtime'] },
  }), doors);
  assert.deepEqual(selection, {
    state: 'ambiguous',
    leadingTemplateIds: ['garden-to-corpus', 'garden-to-band-runtime'],
    canConfirmCrossing: false,
    authority: 'none',
  });
});

test('decoder may point at a fixture door whose reachability is still unknown without making it crossable', () => {
  const selection = selectGardenTraversalCandidate(decoding({
    candidates: [{ templateId: 'garden-to-upper-room', totalCost: 1 }],
    ambiguity: { kind: 'none', leadingTemplateIds: ['garden-to-upper-room'] },
  }), doors);

  assert.equal(selection.state, 'candidate');
  if (selection.state !== 'candidate') return;
  assert.equal(selection.doorRef, 'world-door:upper-room-fixture-v0.1');
  assert.equal(selection.reachability, 'unknown');
  assert.equal(selection.canConfirmCrossing, false);
  assert.equal(selection.authority, 'none');
});

test('unknown decoder template stays visible as unresolved rather than selecting a substitute door', () => {
  const selection = selectGardenTraversalCandidate(decoding({
    candidates: [{ templateId: 'unknown-template', totalCost: 1 }],
    ambiguity: { kind: 'none', leadingTemplateIds: ['unknown-template'] },
  }), doors);
  assert.deepEqual(selection, {
    state: 'unresolved',
    templateId: 'unknown-template',
    canConfirmCrossing: false,
    authority: 'none',
  });
});

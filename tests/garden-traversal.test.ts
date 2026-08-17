import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GARDEN_DECODER,
  GARDEN_HEIGHT,
  GARDEN_LAYOUT,
  GARDEN_TEMPLATES,
  GARDEN_WIDTH,
  doorRefForTemplate,
  normalizePointerStroke,
} from '../src/lib/worldRuntime/gardenTraversal.js';

test('Garden declares one bounded field with three door traversal templates and no authority', () => {
  assert.equal(GARDEN_LAYOUT.schema, 'tranchnode/intent-stroke-layout/v0.1');
  assert.equal(GARDEN_WIDTH, 360);
  assert.equal(GARDEN_HEIGHT, 220);
  assert.deepEqual(GARDEN_TEMPLATES.map((template) => template.id), [
    'garden-to-corpus',
    'garden-to-band-runtime',
    'garden-to-upper-room',
  ]);
  assert.equal(GARDEN_DECODER.id, 'tranchnode/intent-stroke-dtw');
  assert.equal(doorRefForTemplate('garden-to-corpus'), 'world-door:corpus-casework-v0.1');
  assert.equal(doorRefForTemplate('garden-to-band-runtime'), 'world-door:band-runtime-fixture-v0.1');
  assert.equal(doorRefForTemplate('garden-to-upper-room'), 'world-door:upper-room-fixture-v0.1');
  assert.equal(doorRefForTemplate('unknown-template'), null);
});

test('pointer witness is normalized into bounded integer sequence without manufacturing a layout ref', () => {
  const points = normalizePointerStroke([
    { x: -10.4, y: 110.2 },
    { x: 130.7, y: 111.9 },
    { x: 999.1, y: -5.2 },
  ]);

  assert.deepEqual(points, [
    { sequence: 0, x: 0, y: 110 },
    { sequence: 1, x: 131, y: 112 },
    { sequence: 2, x: 360, y: 0 },
  ]);
  assert.ok(points.every((point) => !('fieldLayoutRef' in point)));
});

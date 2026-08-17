import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorldRuntimeHttpHandlers } from '../src/lib/worldRuntime/http.js';
import { createWorldRuntimeServices } from '../src/lib/worldRuntime/services.js';

const services = createWorldRuntimeServices({}, 'linux', async () => ({ ok: false, kind: 'unavailable' }));
const handlers = createWorldRuntimeHttpHandlers(services);

test('field and fixture doors remain HTTP-visible without live donor configuration', async () => {
  const field = await handlers.field();
  assert.equal(field.status, 200);
  assert.equal((field.body as any).field.sourceMode, 'fixture');
  assert.deepEqual((field.body as any).availability, {
    tranchnode: false,
    project0: false,
    corpusOs: false,
  });

  const doors = await handlers.doors();
  assert.equal(doors.status, 200);
  assert.equal((doors.body as any).doors.length, 3);
  assert.ok((doors.body as any).doors.every((door: any) => door.sourceMode === 'fixture'));
});

test('donor-dependent HTTP operations report explicit service unavailability', async () => {
  const decode = await handlers.decode({ points: [], layout: {}, templates: [], decoder: {} });
  assert.equal(decode.status, 503);
  assert.deepEqual(decode.body, { ok: false, kind: 'unavailable', donor: 'tranchnode' });

  const prepare = await handlers.prepare({ offered: 'witness' });
  assert.equal(prepare.status, 503);
  assert.deepEqual(prepare.body, { ok: false, kind: 'unavailable', donor: 'project0' });
});

test('residue lookup reports absence rather than inventing reconstruction evidence', async () => {
  const missing = await handlers.residue('world-residue:999999');
  assert.equal(missing.status, 404);
  assert.deepEqual(missing.body, {
    error: 'World encounter residue not found',
    residueRef: 'world-residue:999999',
  });
});

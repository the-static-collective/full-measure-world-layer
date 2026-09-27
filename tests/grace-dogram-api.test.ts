import assert from 'node:assert/strict';
import test from 'node:test';

import {requestDogramSuccessorDelta} from '../src/lib/grace/dogramApi.js';

test('browser Dogram client accepts a live authority-none successor receipt', async () => {
  const result = await requestDogramSuccessorDelta(
    ['feed-home', 'share-meal'],
    ['share-meal'],
    async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          ok: true,
          value: {
            experiment: 'SUCCESSOR-DELTA-001',
            before_actions: ['feed-home', 'share-meal'],
            after_actions: ['share-meal'],
            foreclosed: ['feed-home'],
            newly_available: [],
            retained: ['share-meal'],
            authority: 'none',
          },
        };
      },
    }),
  );

  assert.equal(result.status, 'live');
  if (result.status === 'live') {
    assert.deepEqual(result.value.foreclosed, ['feed-home']);
    assert.equal(result.value.authority, 'none');
  }
});

test('browser Dogram client reports explicit donor unavailability', async () => {
  const result = await requestDogramSuccessorDelta(
    ['a'],
    [],
    async () => ({
      ok: false,
      status: 503,
      async json() {
        return {ok: false, kind: 'unavailable', code: 'DOGRAM_NOT_CONFIGURED'};
      },
    }),
  );
  assert.deepEqual(result, {status: 'unavailable', code: 'DOGRAM_NOT_CONFIGURED'});
});

test('browser Dogram client rejects malformed live result', async () => {
  const result = await requestDogramSuccessorDelta(
    ['a'],
    [],
    async () => ({
      ok: true,
      status: 200,
      async json() {
        return {ok: true, value: {authority: 'none'}};
      },
    }),
  );
  assert.deepEqual(result, {status: 'error', code: 'DOGRAM_BROWSER_CONTRACT_INVALID'});
});

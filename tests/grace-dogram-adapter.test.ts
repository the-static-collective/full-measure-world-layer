import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createGraceDogramAdapter,
  createGraceDogramService,
  resolveGraceDogramProcessConfig,
} from '../src/lib/grace/dogramAdapter.js';
import type {JsonProcessInvoker} from '../src/lib/worldRuntime/processAdapter.js';

test('Dogram process config is an allowlisted repo root plus fixed Python module argv', () => {
  assert.deepEqual(
    resolveGraceDogramProcessConfig({GRACE_DOGRAM_REPO: '/repos/Dogram'}, 'linux'),
    {
      executable: 'python3',
      args: ['-m', 'dogram.game_mechanics_stdio'],
      cwd: '/repos/Dogram',
    },
  );
  assert.deepEqual(
    resolveGraceDogramProcessConfig({GRACE_DOGRAM_REPO: 'C:\\repos\\Dogram'}, 'win32'),
    {
      executable: 'python',
      args: ['-m', 'dogram.game_mechanics_stdio'],
      cwd: 'C:\\repos\\Dogram',
    },
  );
  assert.equal(resolveGraceDogramProcessConfig({}, 'linux'), null);
});

test('adapter accepts only non-authoritative Dogram mechanics receipts', async () => {
  const invoke: JsonProcessInvoker = async (_command, request) => {
    const body = request as any;
    assert.equal(body.schema, 'dogram/game-mechanics-stdio-request/v0.1');
    assert.equal(body.operation, 'successor_delta');
    return {
      ok: true,
      value: {
        schema: 'dogram/game-mechanics-stdio-response/v0.1',
        ok: true,
        operation: 'successor_delta',
        result: {
          experiment: 'SUCCESSOR-DELTA-001',
          foreclosed: ['feed-home'],
          authority: 'none',
        },
        authority: 'none',
      },
    };
  };

  const adapter = createGraceDogramAdapter(
    {executable: 'python3', args: ['-m', 'dogram.game_mechanics_stdio'], cwd: '/repos/Dogram'},
    invoke,
  );
  const result = await adapter.calculate({
    operation: 'successor_delta',
    beforeActions: ['feed-home', 'share-meal'],
    afterActions: ['share-meal'],
  });

  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.foreclosed, ['feed-home']);
  }
});

test('adapter rejects any Dogram response that claims authority', async () => {
  const invoke: JsonProcessInvoker = async () => ({
    ok: true,
    value: {
      schema: 'dogram/game-mechanics-stdio-response/v0.1',
      ok: true,
      result: {experiment: 'SUCCESSOR-DELTA-001'},
      authority: 'granted',
    },
  });

  const adapter = createGraceDogramAdapter(
    {executable: 'python3', args: ['-m', 'dogram.game_mechanics_stdio'], cwd: '/repos/Dogram'},
    invoke,
  );
  const result = await adapter.calculate({
    operation: 'successor_delta',
    beforeActions: ['a'],
    afterActions: [],
  });

  assert.deepEqual(result, {
    ok: false,
    kind: 'contract',
    code: 'DOGRAM_AUTHORITY_MUST_BE_NONE',
  });
});

test('unconfigured service stays explicitly unavailable', async () => {
  const service = createGraceDogramService({}, 'linux');
  assert.deepEqual(service.availability(), {
    configured: false,
    donor: 'Dogram',
    authority: 'none',
  });
  assert.deepEqual(
    await service.calculate({
      operation: 'budget_rounding',
      weights: {home: 1},
      budget: 1,
    }),
    {
      ok: false,
      kind: 'unavailable',
      code: 'DOGRAM_NOT_CONFIGURED',
    },
  );
});

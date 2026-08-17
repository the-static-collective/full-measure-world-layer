import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';

import { createWorldRuntimeApi } from '../src/world-runtime/bootstrap.js';

async function withServer(run: (baseUrl: string) => Promise<void>) {
  const app = express();
  app.use(express.json());
  app.use('/api/world', createWorldRuntimeApi({
    env: {},
    resolveActorId: () => 'user_lu',
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('expected TCP address');
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test('unconfigured House exposes fixture threshold metadata without pretending crossing is live', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/world/field`);
    assert.equal(response.status, 200);
    const body = await response.json() as any;
    assert.equal(body.available, false);
    assert.equal(body.reasonCode, 'BOOT_HOUSE_DONOR_PATHS_REQUIRED');
    assert.equal(body.field.doors.length, 3);
    assert.equal(body.field.doors.every((door: any) => door.evidenceMode === 'fixture'), true);
  });
});

test('unconfigured House rejects gesture/crossing operations with 503 rather than falling through', async () => {
  await withServer(async (baseUrl) => {
    const decode = await fetch(`${baseUrl}/api/world/decode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] }),
    });
    assert.equal(decode.status, 503);
    const body = await decode.json() as any;
    assert.equal(body.kind, 'world-runtime-unavailable');
    assert.equal(body.reasonCode, 'BOOT_HOUSE_DONOR_PATHS_REQUIRED');

    const cross = await fetch(`${baseUrl}/api/world/cross`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pendingId: 'fake', doorRef: 'door:corpus', confirmed: true }),
    });
    assert.equal(cross.status, 503);
  });
});

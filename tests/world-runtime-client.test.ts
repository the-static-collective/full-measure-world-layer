import assert from 'node:assert/strict';
import test from 'node:test';

import { createWorldRuntimeClient } from '../src/lib/worldRuntime/client.js';

function fakeFetch(responses: Array<{ status: number; body: unknown }>) {
  const calls: Array<{ url: string; init?: any }> = [];
  const fetcher = async (url: string, init?: any) => {
    calls.push({ url, init });
    const next = responses.shift() ?? { status: 500, body: { error: 'missing fixture response' } };
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      async json() { return next.body; },
    };
  };
  return { fetcher, calls };
}

test('browser client uses the exact six mounted world-runtime routes', async () => {
  const fixture = fakeFetch([
    { status: 200, body: { field: {}, availability: {} } },
    { status: 200, body: { doors: [], availability: {} } },
    { status: 200, body: { ok: true, value: { authority: 'none' } } },
    { status: 200, body: { ok: true, value: { record: { ref: 'enc-a' } } } },
    { status: 200, body: { ok: true, value: { status: 'admitted' } } },
    { status: 200, body: { residue: { residueRef: 'world-residue:000001' } } },
  ]);
  const client = createWorldRuntimeClient(fixture.fetcher);

  await client.getField();
  await client.getDoors();
  await client.decodeStroke({ points: [], layout: {}, templates: [], decoder: {} });
  await client.prepareEncounter({ protocolVersion: 'p0.exchange/0.1' });
  await client.confirmEncounter({ crossingRef: 'crossing' });
  await client.getResidue('world-residue:000001');

  assert.deepEqual(fixture.calls.map((call) => [call.url, call.init?.method ?? 'GET']), [
    ['/api/world/field', 'GET'],
    ['/api/world/doors', 'GET'],
    ['/api/world/stroke/decode', 'POST'],
    ['/api/world/encounter/prepare', 'POST'],
    ['/api/world/encounter/confirm', 'POST'],
    ['/api/world/residue/world-residue%3A000001', 'GET'],
  ]);
  assert.equal(JSON.parse(fixture.calls[2]!.init.body).points.length, 0);
  assert.equal(JSON.parse(fixture.calls[3]!.init.body).protocolVersion, 'p0.exchange/0.1');
});

test('browser client preserves structured non-2xx body and HTTP status', async () => {
  const fixture = fakeFetch([
    { status: 503, body: { ok: false, kind: 'unavailable', donor: 'tranchnode' } },
  ]);
  const client = createWorldRuntimeClient(fixture.fetcher);
  const result = await client.decodeStroke({ points: [], layout: {}, templates: [], decoder: {} });

  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.status, 503);
  assert.deepEqual(result.body, { ok: false, kind: 'unavailable', donor: 'tranchnode' });
});

test('browser client reports unreadable responses without inventing donor meaning', async () => {
  const client = createWorldRuntimeClient(async () => ({
    ok: false,
    status: 502,
    async json() { throw new Error('bad gateway text'); },
  }));
  const result = await client.getField();
  assert.deepEqual(result, {
    ok: false,
    status: 502,
    body: { error: 'WORLD_RUNTIME_HTTP_RESPONSE_UNREADABLE' },
  });
});

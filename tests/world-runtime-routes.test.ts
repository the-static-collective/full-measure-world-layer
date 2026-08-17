import assert from 'node:assert/strict';
import test from 'node:test';

import { registerWorldRuntimeRoutes } from '../src/lib/worldRuntime/routes.js';

function fakeApp() {
  const routes: Array<{ method: string; path: string; handler: Function }> = [];
  return {
    routes,
    get(path: string, handler: Function) { routes.push({ method: 'GET', path, handler }); },
    post(path: string, handler: Function) { routes.push({ method: 'POST', path, handler }); },
  };
}

function handlers() {
  return {
    async field() { return { status: 200, body: { field: true } }; },
    async doors() { return { status: 200, body: { doors: true } }; },
    async decode(body: unknown) { return { status: 201, body: { decode: body } }; },
    async prepare(body: unknown) { return { status: 202, body: { prepare: body } }; },
    async confirm(body: unknown) { return { status: 203, body: { confirm: body } }; },
    async residue(ref: string) { return { status: 204, body: { residue: ref } }; },
  };
}

function fakeResponse() {
  let statusCode = 200;
  let body: unknown;
  return {
    status(code: number) { statusCode = code; return this; },
    json(value: unknown) { body = value; return this; },
    snapshot() { return { statusCode, body }; },
  };
}

test('registers the six Boot the House routes and no wildcard catch-all', () => {
  const app = fakeApp();
  registerWorldRuntimeRoutes(app, handlers());
  assert.deepEqual(app.routes.map(({ method, path }) => ({ method, path })), [
    { method: 'GET', path: '/api/world/field' },
    { method: 'GET', path: '/api/world/doors' },
    { method: 'POST', path: '/api/world/stroke/decode' },
    { method: 'POST', path: '/api/world/encounter/prepare' },
    { method: 'POST', path: '/api/world/encounter/confirm' },
    { method: 'GET', path: '/api/world/residue/:ref' },
  ]);
});

test('route glue forwards request bodies/params and preserves handler status/body without reinterpretation', async () => {
  const app = fakeApp();
  registerWorldRuntimeRoutes(app, handlers());

  const decode = app.routes.find((route) => route.path.endsWith('/decode'))!;
  const decodeRes = fakeResponse();
  await decode.handler({ body: { raw: 'stroke' }, params: {} }, decodeRes);
  assert.deepEqual(decodeRes.snapshot(), {
    statusCode: 201,
    body: { decode: { raw: 'stroke' } },
  });

  const residue = app.routes.find((route) => route.path.includes('/residue/'))!;
  const residueRes = fakeResponse();
  await residue.handler({ body: {}, params: { ref: 'world-residue:000001' } }, residueRes);
  assert.deepEqual(residueRes.snapshot(), {
    statusCode: 204,
    body: { residue: 'world-residue:000001' },
  });
});

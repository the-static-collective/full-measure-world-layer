import test from 'node:test';
import assert from 'node:assert/strict';
import { BROKEN_PROMISE_FIXTURE } from '../src/lib/graceMercy/fixtures.js';

test('broken promise fixture preserves known harm separately from unknown intent', () => {
  const byKey = new Map(BROKEN_PROMISE_FIXTURE.facts.map((fact) => [fact.key, fact]));
  assert.equal(byKey.get('promise_made')?.state, 'KNOWN');
  assert.equal(byKey.get('promise_missed_1')?.state, 'KNOWN');
  assert.equal(byKey.get('promise_missed_2')?.state, 'KNOWN');
  assert.equal(byKey.get('consequence_absorbed_by_other')?.state, 'KNOWN');
  assert.equal(byKey.get('warning_status_contested')?.state, 'CONTESTED');
  assert.equal(byKey.get('intent_unknown')?.state, 'UNKNOWN');
});

import { buildGraceMercyProjection, getAvailableGraceVerbs, getAvailableMercyVerbs } from '../src/lib/graceMercy/projection.js';

test('empty encounter projects one character on the Grace side', () => {
  const projection = buildGraceMercyProjection('user_grace', 'grace-mercy:broken-promise-001:user_grace', []);
  assert.equal(projection.characterRef, 'user_grace');
  assert.equal(projection.encounterId, 'grace-mercy:broken-promise-001:user_grace');
  assert.equal(projection.currentSheet, 'GRACE');
  assert.equal(projection.ruptureStatus, 'candidate');
  assert.equal(projection.mercyAvailable, false);
  assert.equal(projection.discernment, null);
  assert.equal(projection.disposition, 'UNRESOLVED');
  assert.ok(getAvailableGraceVerbs(projection).includes('POUR'));
  assert.ok(getAvailableMercyVerbs(projection).includes('REFUSE'));
});

test('latest valid boundary survives a later return to Grace', () => {
  const encounterId = 'grace-mercy:broken-promise-001:user_grace';
  const events: DomainEvent[] = [
    { id:'e1',circleId:'c',aggregateType:'mercy_encounter',aggregateId:encounterId,eventType:'mercy.rupture_noticed',actorId:'user_grace',payload:{status:'established'},createdAt:'2026-09-21T10:00:00Z' },
    { id:'e2',circleId:'c',aggregateType:'mercy_encounter',aggregateId:encounterId,eventType:'mercy.sheet_turned',actorId:'user_grace',payload:{to:'MERCY'},createdAt:'2026-09-21T10:01:00Z' },
    { id:'e3',circleId:'c',aggregateType:'mercy_encounter',aggregateId:encounterId,eventType:'mercy.boundary_set',actorId:'user_grace',payload:{boundary:'commitment:renew-under-same-conditions'},createdAt:'2026-09-21T10:02:00Z' },
    { id:'e4',circleId:'c',aggregateType:'mercy_encounter',aggregateId:encounterId,eventType:'mercy.sheet_turned',actorId:'user_grace',payload:{to:'GRACE'},createdAt:'2026-09-21T10:03:00Z' },
  ];
  const projection = buildGraceMercyProjection('user_grace', encounterId, events);
  assert.equal(projection.currentSheet, 'GRACE');
  assert.deepEqual(projection.activeBoundaries, ['commitment:renew-under-same-conditions']);
});

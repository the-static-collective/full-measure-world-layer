import test from 'node:test';
import assert from 'node:assert/strict';
import { BROKEN_PROMISE_FIXTURE } from '../src/lib/graceMercy/fixtures.js';
import { deriveBrokenPromiseRupture, isMercyAvailable, applyBrokenPromiseAction, type BrokenPromiseAction } from '../src/lib/graceMercy/brokenPromise.js';
import type { DomainEvent } from '../src/types.js';
import { buildGraceMercyProjection } from '../src/lib/graceMercy/projection.js';

function facts(...keys: string[]) {
  return BROKEN_PROMISE_FIXTURE.facts.filter((fact) => keys.includes(fact.key));
}

test('one missed promise alone leaves rupture candidate', () => {
  const rupture = deriveBrokenPromiseRupture(facts('promise_made','promise_missed_1'));
  assert.equal(rupture.status, 'candidate');
  assert.equal(isMercyAvailable(rupture), false);
});

test('repeated known misses and absorbed consequence establish rupture without motive inference', () => {
  const rupture = deriveBrokenPromiseRupture(BROKEN_PROMISE_FIXTURE.facts);
  assert.equal(rupture.status, 'established');
  assert.equal(isMercyAvailable(rupture), true);
  assert.equal(rupture.intentState, 'UNKNOWN');
  assert.equal(rupture.motiveClaim, null);
  assert.ok(rupture.unknowns.includes('intent_unknown'));
  assert.ok(rupture.evidenceRefs.includes('evidence:absorbed-consequence'));
});

test('contested warning remains contested without blocking established effects', () => {
  const rupture = deriveBrokenPromiseRupture(BROKEN_PROMISE_FIXTURE.facts);
  assert.equal(rupture.status, 'established');
  assert.equal(BROKEN_PROMISE_FIXTURE.facts.find((f) => f.key === 'warning_status_contested')?.state, 'CONTESTED');
});

function run(actions: readonly BrokenPromiseAction[]) {
  const characterRef = 'user_grace';
  const encounterId = 'grace-mercy:broken-promise-001:user_grace';
  const events: DomainEvent[] = [];
  actions.forEach((action, index) => {
    const projection = buildGraceMercyProjection(characterRef, encounterId, events);
    events.push(applyBrokenPromiseAction({
      projection,
      action,
      actorId: characterRef,
      circleId: 'circle_1',
      eventId: `a${index + 1}`,
      occurredAt: `2026-09-21T10:${String(index).padStart(2, '0')}:00.000Z`,
    }));
  });
  return { events, projection: buildGraceMercyProjection(characterRef, encounterId, events) };
}

const PREP = ['NOTICE_RUPTURE','TURN_TO_MERCY','NAME_OCCURRENCE','TEST_PATTERN','WITNESS_CONSEQUENCE','BOUND_COMMITMENT'] as const;

test('REFUSE closes a bounded Mercy encounter without deleting the person', () => {
  const { events, projection } = run([...PREP, 'DISCERN_REFUSE', 'CLOSE_ENCOUNTER']);
  assert.equal(projection.currentSheet, 'MERCY');
  assert.equal(projection.discernment, 'REFUSE');
  assert.equal(projection.disposition, 'BOUNDED');
  assert.deepEqual(projection.activeBoundaries, ['commitment:renew-under-same-conditions']);
  assert.equal(projection.closed, true);
  assert.ok(projection.unknowns.includes('intent_unknown'));
  assert.equal(events.filter((e) => e.eventType === 'mercy.sheet_turned').length, 1);
  assert.equal(events.some((e) => /person\.enemy|relationship\.deleted/.test(e.eventType)), false);
});

test('HOLD is a successful close with unresolved disposition', () => {
  const { projection } = run([...PREP, 'DISCERN_HOLD', 'CLOSE_ENCOUNTER']);
  assert.equal(projection.discernment, 'HOLD');
  assert.equal(projection.disposition, 'UNRESOLVED');
  assert.equal(projection.closed, true);
});

test('Y admits only the narrowed retry proposal', () => {
  const { events, projection } = run([...PREP, 'DISCERN_Y', 'CLOSE_ENCOUNTER']);
  const discern = events.find((e) => e.eventType === 'mercy.discerned');
  assert.equal(projection.discernment, 'Y');
  assert.equal(discern?.payload.proposedCrossing, 'commitment:one-retry-with-explicit-check-in');
  assert.deepEqual(projection.activeBoundaries, ['commitment:renew-under-same-conditions']);
});

test('returning to Grace preserves a Mercy boundary and discernment history', () => {
  const { events, projection } = run([...PREP, 'DISCERN_REFUSE', 'TURN_TO_GRACE', 'CLOSE_ENCOUNTER']);
  assert.equal(projection.currentSheet, 'GRACE');
  assert.equal(projection.discernment, 'REFUSE');
  assert.deepEqual(projection.activeBoundaries, ['commitment:renew-under-same-conditions']);
  assert.equal(events.some((e) => ['relationship.restored','access.restored','forgiven'].includes(e.eventType)), false);
});

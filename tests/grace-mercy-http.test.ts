import test from 'node:test';
import assert from 'node:assert/strict';
import type { DomainEvent } from '../src/types.js';
import { acceptGraceMercyAction, buildGraceMercyEncounter, GraceMercyHttpError } from '../src/lib/graceMercy/httpContract.js';

const userId = 'user_grace';
const circleId = 'circle_1';

function submit(events: DomainEvent[], action: string, actionId: string) {
  return acceptGraceMercyAction({ userId, actorId: userId, circleId, body: { action, actionId }, events, now: '2026-09-21T13:00:00.000Z' });
}

test('initial HTTP projection is the Grace side with no fabricated motive', () => {
  const result = buildGraceMercyEncounter(userId, []);
  assert.equal(result.projection.currentSheet, 'GRACE');
  assert.equal(result.projection.mercyAvailable, false);
  assert.ok(result.projection.unknowns.includes('intent_unknown'));
  assert.equal(result.receipt, null);
});

test('action body accepts only action and actionId', () => {
  assert.throws(
    () => acceptGraceMercyAction({ userId, actorId: userId, circleId, body: { action: 'NOTICE_RUPTURE', actionId: 'a1', motiveClaim: 'guilty' }, events: [], now: '2026-09-21T13:00:00.000Z' }),
    (error: any) => error instanceof GraceMercyHttpError && error.status === 400 && error.code === 'INVALID_ACTION_BODY',
  );
});

test('actor must match route character for v0.1', () => {
  assert.throws(
    () => acceptGraceMercyAction({ userId, actorId: 'someone_else', circleId, body: { action: 'NOTICE_RUPTURE', actionId: 'a1' }, events: [], now: '2026-09-21T13:00:00.000Z' }),
    (error: any) => error instanceof GraceMercyHttpError && error.status === 403,
  );
});

test('duplicate actionId is idempotent for the same action and conflicts for another action', () => {
  const first = submit([], 'NOTICE_RUPTURE', 'same');
  const events = [first.event];
  const replay = submit(events, 'NOTICE_RUPTURE', 'same');
  assert.equal(replay.duplicate, true);
  assert.equal(replay.event.id, first.event.id);
  assert.throws(
    () => submit(events, 'TURN_TO_MERCY', 'same'),
    (error: any) => error instanceof GraceMercyHttpError && error.status === 409 && error.code === 'ACTION_ID_CONFLICT',
  );
});

test('illegal transition maps to HTTP 409 without mutating prior history', () => {
  const events: DomainEvent[] = [];
  const before = structuredClone(events);
  assert.throws(
    () => submit(events, 'TURN_TO_MERCY', 'too-soon'),
    (error: any) => error instanceof GraceMercyHttpError && error.status === 409,
  );
  assert.deepEqual(events, before);
});

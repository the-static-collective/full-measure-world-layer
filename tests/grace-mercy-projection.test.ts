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

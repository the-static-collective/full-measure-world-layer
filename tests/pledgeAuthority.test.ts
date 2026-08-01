import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizePledgeTransition } from '../src/lib/pledgeAuthority.js';

test('refuses confirmation before a contributor reports completion', () => {
  const decision = authorizePledgeTransition({
    action: 'confirm',
    currentStatus: 'accepted',
    isOpenerOrSteward: true,
    isPledgeAuthor: false,
  });

  assert.deepEqual(decision, {
    ok: false,
    status: 400,
    error: 'Contribution must be reported complete before confirmation.',
  });
});

test('refuses contributor self-confirmation even when they are a steward', () => {
  const decision = authorizePledgeTransition({
    action: 'confirm',
    currentStatus: 'reported_complete',
    isOpenerOrSteward: true,
    isPledgeAuthor: true,
  });

  assert.deepEqual(decision, {
    ok: false,
    status: 403,
    error: 'A contributor cannot confirm their own fulfillment.',
  });
});

test('permits a different authorized human to confirm a returned report', () => {
  const decision = authorizePledgeTransition({
    action: 'confirm',
    currentStatus: 'reported_complete',
    isOpenerOrSteward: true,
    isPledgeAuthor: false,
  });

  assert.deepEqual(decision, { ok: true, action: 'confirm' });
});

test('permits only the contributor to report an accepted pledge complete', () => {
  const allowed = authorizePledgeTransition({
    action: 'report_complete',
    currentStatus: 'accepted',
    isOpenerOrSteward: false,
    isPledgeAuthor: true,
  });
  const denied = authorizePledgeTransition({
    action: 'report_complete',
    currentStatus: 'accepted',
    isOpenerOrSteward: true,
    isPledgeAuthor: false,
  });

  assert.deepEqual(allowed, { ok: true, action: 'report_complete' });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.status, 403);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { runGraceMercyBrokenPromiseSpecimen } from '../src/lib/graceMercy/specimen.js';

test('Broken Promise specimen is deterministic and ends bounded in Mercy', () => {
  const a = runGraceMercyBrokenPromiseSpecimen();
  const b = runGraceMercyBrokenPromiseSpecimen();
  assert.equal(a.receipt.receiptHash, b.receipt.receiptHash);
  assert.equal(a.receipt.discernment, 'REFUSE');
  assert.equal(a.receipt.disposition, 'BOUNDED');
  assert.equal(a.receipt.endingSheet, 'MERCY');
  assert.ok(a.receipt.unknowns.includes('intent_unknown'));
  assert.equal(a.events.some((event) => /person\.enemy|relationship\.deleted/.test(event.eventType)), false);
});

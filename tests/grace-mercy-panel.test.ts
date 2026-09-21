import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync('src/components/GraceMercyDualSheet.tsx', 'utf8');

test('dual sheet names both lawful postures and the explicit flip', () => {
  for (const phrase of ['GRACE','MERCY','TURN THE SHEET','What good can live here?','What actually happened','Y','HOLD','REFUSE']) assert.ok(source.includes(phrase), `missing ${phrase}`);
});

test('Mercy presentation keeps one character identity and no dark-form language', () => {
  assert.ok(source.includes('currentUser'));
  assert.equal(/evil form|dark side|enemy person|forgiven\s*=\s*restored/i.test(source), false);
});

test('Grace return can show the still-active Mercy boundary', () => {
  assert.ok(source.includes('Boundary still active'));
});

test('dual sheet visibly labels the Broken Promise scenario as a fictional fixture', () => {
  assert.ok(source.includes('FICTIONAL FIXTURE'));
  assert.ok(source.includes('not evaluating your relationships'));
});

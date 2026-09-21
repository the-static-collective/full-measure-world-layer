import type { BrokenPromiseFixture } from './types.js';

export const BROKEN_PROMISE_FIXTURE = Object.freeze({
  fixtureId: 'grace-mercy:broken-promise-001',
  ruptureRef: 'rupture:broken-promise-001',
  occurrenceRef: 'occurrence:broken-promise-001',
  affectedContinuityRef: 'commitment:original-promise',
  proposedRetryCrossing: 'commitment:one-retry-with-explicit-check-in',
  defaultBoundary: 'commitment:renew-under-same-conditions',
  facts: Object.freeze([
    { key: 'promise_made', state: 'KNOWN', summary: 'A meaningful promise was made.', evidenceRefs: ['evidence:promise-made'] },
    { key: 'promise_missed_1', state: 'KNOWN', summary: 'The promise was missed once.', evidenceRefs: ['evidence:miss-1'] },
    { key: 'promise_missed_2', state: 'KNOWN', summary: 'The promise was missed again.', evidenceRefs: ['evidence:miss-2'] },
    { key: 'consequence_absorbed_by_other', state: 'KNOWN', summary: 'Another participant absorbed the consequence.', evidenceRefs: ['evidence:absorbed-consequence'] },
    { key: 'warning_status_contested', state: 'CONTESTED', summary: 'Whether warning was communicated is contested.', evidenceRefs: ['report:warning-a', 'report:warning-b'] },
    { key: 'intent_unknown', state: 'UNKNOWN', summary: 'Intent is not established.', evidenceRefs: [] },
  ] as const),
} satisfies BrokenPromiseFixture);

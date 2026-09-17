import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ContributionQuestAdapterError,
  deriveContributionQuestSeeds,
} from '../src/lib/contributionQuest/index.js';

const FIXTURE = {
  workmark: {
    workmark_id: 'sha256:5ae02620badca78daa720284814f2303a6fde107c58c05ca1299152a19024e66',
  },
  t1: {
    cut: 1,
    receipt_digest: 'sha256:81e29f390778ff783e625c5c92d1c87d370863059e23deea68ff2373e608c642',
  },
  delta: {
    delta_digest: 'sha256:6dca2f97fb26b9ff8d1407f1efbdc152dd1100329019e541ae90ddc6bc604705',
    added_reachable_descendants: ['Y', 'Z'],
  },
  ablation_enable_y: {
    removed_event_id: 'e-enable-y',
    removed_relation_kind: 'ENABLED',
    lost_root_entity_reachability: ['Y', 'Z'],
    receipt_digest: 'sha256:178bea0744d813b8ab150397de8b53163e49de9ccdf6e9e125956ce637c605b3',
  },
  ablation_repair_x: {
    removed_event_id: 'e-repair-x',
    removed_relation_kind: 'REPAIRED',
    lost_root_entity_reachability: [],
    receipt_digest: 'sha256:29ba0deb7cbcdfa092817a275fc1cbfa6c9cc1247c56e677a48ca9ef32d5b7e6',
  },
  full_measure_handoff_fixture: {
    source: 'Dogram',
    authority: 'none',
    workmark_id: 'sha256:5ae02620badca78daa720284814f2303a6fde107c58c05ca1299152a19024e66',
    measurement_receipt_digest: 'sha256:81e29f390778ff783e625c5c92d1c87d370863059e23deea68ff2373e608c642',
    delta_receipt_digest: 'sha256:6dca2f97fb26b9ff8d1407f1efbdc152dd1100329019e541ae90ddc6bc604705',
    allowed_use: [
      'read-only story proposal input',
      'read-only quest proposal input',
      'read-only participation-opening input',
    ],
    forbidden_promotion: [
      'source fact by narration',
      'economic value',
      'human worth',
      'sheet-changing authority',
    ],
  },
} as const;

test('Dogram contribution receipts produce optional quest seeds through exactly two read-only rules', () => {
  const seeds = deriveContributionQuestSeeds(FIXTURE);

  assert.deepEqual(
    seeds.map((seed) => [seed.rule, seed.subjectRef]),
    [
      ['descendant-opening/v0', 'Y'],
      ['descendant-opening/v0', 'Z'],
      ['reachability-bridge/v0', 'e-enable-y'],
    ],
  );
  assert.equal(seeds.every((seed) => seed.authority === 'none'), true);
  assert.equal(seeds.every((seed) => seed.optional === true), true);
  assert.equal(seeds.every((seed) => seed.sourceWorkmarkId === FIXTURE.workmark.workmark_id), true);
  assert.equal(seeds.every((seed) => seed.reward === undefined), true);
  assert.equal(seeds.every((seed) => seed.playerScore === undefined), true);
});

test('zero root-reachability loss removes the bridge quest without erasing descendant openings', () => {
  const hostile = {
    ...FIXTURE,
    ablation_enable_y: FIXTURE.ablation_repair_x,
  };

  const seeds = deriveContributionQuestSeeds(hostile);

  assert.deepEqual(
    seeds.map((seed) => [seed.rule, seed.subjectRef]),
    [
      ['descendant-opening/v0', 'Y'],
      ['descendant-opening/v0', 'Z'],
    ],
  );
});

test('adapter refuses handoff authority widening or missing quest-use admission', () => {
  assert.throws(
    () => deriveContributionQuestSeeds({
      ...FIXTURE,
      full_measure_handoff_fixture: {
        ...FIXTURE.full_measure_handoff_fixture,
        authority: 'story',
      },
    }),
    (error: unknown) => error instanceof ContributionQuestAdapterError && error.code === 'HANDOFF_AUTHORITY_WIDENED',
  );

  assert.throws(
    () => deriveContributionQuestSeeds({
      ...FIXTURE,
      full_measure_handoff_fixture: {
        ...FIXTURE.full_measure_handoff_fixture,
        allowed_use: ['read-only story proposal input'],
      },
    }),
    (error: unknown) => error instanceof ContributionQuestAdapterError && error.code === 'QUEST_USE_NOT_ADMITTED',
  );
});

test('adapter refuses mismatched Dogram receipt bindings rather than narrating across them', () => {
  assert.throws(
    () => deriveContributionQuestSeeds({
      ...FIXTURE,
      full_measure_handoff_fixture: {
        ...FIXTURE.full_measure_handoff_fixture,
        delta_receipt_digest: 'sha256:not-the-supplied-delta',
      },
    }),
    (error: unknown) => error instanceof ContributionQuestAdapterError && error.code === 'HANDOFF_RECEIPT_MISMATCH',
  );
});

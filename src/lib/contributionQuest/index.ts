export type ContributionQuestAdapterErrorCode =
  | 'HANDOFF_SOURCE_MISMATCH'
  | 'HANDOFF_AUTHORITY_WIDENED'
  | 'QUEST_USE_NOT_ADMITTED'
  | 'HANDOFF_RECEIPT_MISMATCH';

export class ContributionQuestAdapterError extends Error {
  constructor(public readonly code: ContributionQuestAdapterErrorCode) {
    super(code);
    this.name = 'ContributionQuestAdapterError';
  }
}

interface ContributionFieldHandoff {
  source: string;
  authority: string;
  workmark_id: string;
  measurement_receipt_digest: string;
  delta_receipt_digest: string;
  allowed_use: readonly string[];
  forbidden_promotion?: readonly string[];
}

interface ContributionQuestInput {
  workmark: {
    workmark_id: string;
  };
  t1: {
    cut: number;
    receipt_digest: string;
  };
  delta: {
    delta_digest: string;
    added_reachable_descendants: readonly string[];
  };
  ablation_enable_y: {
    removed_event_id: string;
    removed_relation_kind: string;
    lost_root_entity_reachability: readonly string[];
    receipt_digest: string;
  };
  full_measure_handoff_fixture: ContributionFieldHandoff;
}

export interface ContributionQuestSeed {
  questSeedRef: string;
  rule: 'descendant-opening/v0' | 'reachability-bridge/v0';
  subjectRef: string;
  title: string;
  invitation: string;
  sourceWorkmarkId: string;
  sourceCut: number;
  sourceMeasurementReceiptDigest: string;
  sourceDeltaReceiptDigest: string;
  sourceAblationReceiptDigest?: string;
  provenanceRefs: string[];
  optional: true;
  authority: 'none';
  reward?: never;
  playerScore?: never;
}

const QUEST_USE = 'read-only quest proposal input';

function stablePart(value: string): string {
  return encodeURIComponent(value);
}

function validateHandoff(input: ContributionQuestInput): void {
  const handoff = input.full_measure_handoff_fixture;

  if (handoff.source !== 'Dogram') {
    throw new ContributionQuestAdapterError('HANDOFF_SOURCE_MISMATCH');
  }
  if (handoff.authority !== 'none') {
    throw new ContributionQuestAdapterError('HANDOFF_AUTHORITY_WIDENED');
  }
  if (!handoff.allowed_use.includes(QUEST_USE)) {
    throw new ContributionQuestAdapterError('QUEST_USE_NOT_ADMITTED');
  }
  if (
    handoff.workmark_id !== input.workmark.workmark_id ||
    handoff.measurement_receipt_digest !== input.t1.receipt_digest ||
    handoff.delta_receipt_digest !== input.delta.delta_digest
  ) {
    throw new ContributionQuestAdapterError('HANDOFF_RECEIPT_MISMATCH');
  }
}

function commonSeedFields(input: ContributionQuestInput) {
  return {
    sourceWorkmarkId: input.workmark.workmark_id,
    sourceCut: input.t1.cut,
    sourceMeasurementReceiptDigest: input.t1.receipt_digest,
    sourceDeltaReceiptDigest: input.delta.delta_digest,
    optional: true as const,
    authority: 'none' as const,
  };
}

export function deriveContributionQuestSeeds(
  input: ContributionQuestInput,
): ContributionQuestSeed[] {
  validateHandoff(input);

  const shared = commonSeedFields(input);
  const seeds: ContributionQuestSeed[] = [];

  for (const descendant of input.delta.added_reachable_descendants) {
    seeds.push({
      ...shared,
      questSeedRef: [
        'full-measure',
        'quest-seed',
        'descendant-opening-v0',
        stablePart(input.delta.delta_digest),
        stablePart(descendant),
      ].join(':'),
      rule: 'descendant-opening/v0',
      subjectRef: descendant,
      title: `Visit the new opening at ${descendant}`,
      invitation: `A newly reachable descendant, ${descendant}, is present in the supplied contribution-field delta. Inspect or engage it if useful.`,
      provenanceRefs: [
        input.workmark.workmark_id,
        input.t1.receipt_digest,
        input.delta.delta_digest,
      ],
    });
  }

  const ablation = input.ablation_enable_y;
  if (ablation.lost_root_entity_reachability.length > 0) {
    seeds.push({
      ...shared,
      questSeedRef: [
        'full-measure',
        'quest-seed',
        'reachability-bridge-v0',
        stablePart(ablation.receipt_digest),
        stablePart(ablation.removed_event_id),
      ].join(':'),
      rule: 'reachability-bridge/v0',
      subjectRef: ablation.removed_event_id,
      title: `Inspect the bridge at ${ablation.removed_event_id}`,
      invitation: `Removing ${ablation.removed_event_id} (${ablation.removed_relation_kind}) removes declared root reachability to ${ablation.lost_root_entity_reachability.join(', ')}. Inspect the bridge if useful.`,
      sourceAblationReceiptDigest: ablation.receipt_digest,
      provenanceRefs: [
        input.workmark.workmark_id,
        input.t1.receipt_digest,
        input.delta.delta_digest,
        ablation.receipt_digest,
      ],
    });
  }

  return seeds;
}

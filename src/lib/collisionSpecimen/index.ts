import { createHash } from 'node:crypto';

import type { WorldEncounterResidue } from '../worldRuntime/types.js';

const INFLUENCE_PROFILE = 'full-measure.residual-influence/v0.1' as const;

export class CollisionSpecimenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollisionSpecimenError';
  }
}

export interface ResidualInfluence {
  profile: typeof INFLUENCE_PROFILE;
  influenceRef: string;
  residueRef: string;
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  outcomeClass: 'refused' | 'indeterminate';
  evidenceRefs: string[];
  unresolvedRefs: string[];
  effect: {
    kind: 'attention-cue' | 'unresolved-frontier';
    targetRef: string;
    reasonRefs: string[];
  };
  authority: 'none';
  mutation: 'forbidden';
}

function normalizedRefs(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function stableRef(prefix: string, tuple: readonly unknown[]): string {
  const digest = createHash('sha256')
    .update(JSON.stringify(tuple))
    .digest('hex');
  return `${prefix}:sha256:${digest}`;
}

export function deriveResidualInfluence(
  residue: WorldEncounterResidue,
): ResidualInfluence {
  if (
    residue.outcomeClass !== 'refused' &&
    residue.outcomeClass !== 'indeterminate'
  ) {
    throw new CollisionSpecimenError(
      `ineligible collision outcome: ${residue.outcomeClass}`,
    );
  }

  const evidenceRefs = normalizedRefs(residue.evidenceRefs);
  const unresolvedRefs = normalizedRefs(residue.unresolvedRefs);
  const outcomeClass = residue.outcomeClass;
  const effectKind =
    outcomeClass === 'refused' ? 'attention-cue' : 'unresolved-frontier';

  const influenceRef = stableRef('collision-influence', [
    INFLUENCE_PROFILE,
    residue.residueRef,
    outcomeClass,
    residue.sourceFieldRef,
    residue.doorRef,
    residue.crossingRef,
    evidenceRefs,
    unresolvedRefs,
  ]);

  return {
    profile: INFLUENCE_PROFILE,
    influenceRef,
    residueRef: residue.residueRef,
    sourceFieldRef: residue.sourceFieldRef,
    doorRef: residue.doorRef,
    crossingRef: residue.crossingRef,
    outcomeClass,
    evidenceRefs,
    unresolvedRefs,
    effect: {
      kind: effectKind,
      targetRef: residue.doorRef,
      reasonRefs: unresolvedRefs,
    },
    authority: 'none',
    mutation: 'forbidden',
  };
}

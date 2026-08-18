import { createHash } from 'node:crypto';

import type { WorldEncounterResidue } from '../worldRuntime/types.js';

const INFLUENCE_PROFILE = 'full-measure.residual-influence/v0.1' as const;
const DESCENDANT_PROFILE = 'full-measure.declared-freedom-proposal/v0.1' as const;
const DESCENDANT_POLICY = 'full-measure.fixture-one-step/v0.1' as const;

type PrimitiveValue = string | number | boolean;

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

export interface DeclaredFreedomRequest {
  parentResidueRef: string;
  ancestor: {
    proposalRef: string;
    body: Readonly<Record<string, PrimitiveValue>>;
  };
  invocationReason: string;
  policyVersion: string;
  allowedDimensions: readonly string[];
  seed: string;
}

export interface DeclaredFreedomProposal {
  profile: typeof DESCENDANT_PROFILE;
  proposalRef: string;
  parentResidueRef: string;
  ancestorProposalRef: string;
  invocationReason: string;
  policyVersion: typeof DESCENDANT_POLICY;
  allowedDimensions: string[];
  changedDimensions: string[];
  seed: string;
  proposal: Readonly<Record<string, PrimitiveValue>>;
  authority: 'none';
  admission: 'required';
}

function normalizedRefs(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function stableRef(prefix: string, tuple: readonly unknown[]): string {
  return `${prefix}:sha256:${sha256(JSON.stringify(tuple))}`;
}

function bodyEntries(
  body: Readonly<Record<string, PrimitiveValue>>,
): Array<readonly [string, PrimitiveValue]> {
  return Object.keys(body)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, body[key]] as const);
}

function mutatePrimitive(
  value: PrimitiveValue,
  seed: string,
  key: string,
): PrimitiveValue {
  if (typeof value === 'boolean') {
    return !value;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new CollisionSpecimenError(
        `unsupported ancestor value for dimension: ${key}`,
      );
    }
    return value + 1;
  }
  if (typeof value === 'string') {
    return `${value}~${sha256(`${seed}:${key}`).slice(0, 6)}`;
  }
  throw new CollisionSpecimenError(
    `unsupported ancestor value for dimension: ${key}`,
  );
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

export function createDeclaredFreedomProposal(
  request: DeclaredFreedomRequest,
): DeclaredFreedomProposal {
  if (request.policyVersion !== DESCENDANT_POLICY) {
    throw new CollisionSpecimenError(
      `unknown descendant policy: ${request.policyVersion}`,
    );
  }

  const allowedDimensions = normalizedRefs(request.allowedDimensions);
  if (allowedDimensions.length === 0) {
    throw new CollisionSpecimenError('allowed dimensions are required');
  }

  for (const key of allowedDimensions) {
    if (!Object.prototype.hasOwnProperty.call(request.ancestor.body, key)) {
      throw new CollisionSpecimenError(`ancestor dimension is missing: ${key}`);
    }
  }

  const selector = sha256(
    `${request.seed}:${request.policyVersion}:${request.ancestor.proposalRef}:${request.parentResidueRef}`,
  );
  const selectedIndex = Number.parseInt(selector.slice(0, 8), 16) % allowedDimensions.length;
  const selectedKey = allowedDimensions[selectedIndex];
  const proposal: Record<string, PrimitiveValue> = {
    ...request.ancestor.body,
  };
  proposal[selectedKey] = mutatePrimitive(
    request.ancestor.body[selectedKey],
    request.seed,
    selectedKey,
  );

  const changedDimensions = Object.keys(request.ancestor.body)
    .filter((key) => proposal[key] !== request.ancestor.body[key])
    .sort((left, right) => left.localeCompare(right));

  if (
    changedDimensions.length !== 1 ||
    !allowedDimensions.includes(changedDimensions[0])
  ) {
    throw new CollisionSpecimenError('descendant freedom accounting failed');
  }

  const proposalRef = stableRef('collision-proposal', [
    DESCENDANT_PROFILE,
    request.parentResidueRef,
    request.ancestor.proposalRef,
    bodyEntries(request.ancestor.body),
    request.invocationReason,
    DESCENDANT_POLICY,
    allowedDimensions,
    request.seed,
    bodyEntries(proposal),
  ]);

  return {
    profile: DESCENDANT_PROFILE,
    proposalRef,
    parentResidueRef: request.parentResidueRef,
    ancestorProposalRef: request.ancestor.proposalRef,
    invocationReason: request.invocationReason,
    policyVersion: DESCENDANT_POLICY,
    allowedDimensions,
    changedDimensions,
    seed: request.seed,
    proposal,
    authority: 'none',
    admission: 'required',
  };
}

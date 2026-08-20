import type { WorldEncounterResidue } from '../worldRuntime/types.js';
import { sha256Hex } from './sha256.js';

const INFLUENCE_PROFILE = 'full-measure.residual-influence/v0.1' as const;
const DESCENDANT_PROFILE = 'full-measure.declared-freedom-proposal/v0.1' as const;
const DESCENDANT_POLICY = 'full-measure.fixture-one-step/v0.1' as const;
const WITNESS_PROFILE = 'full-measure.collision-witness-session/v0.1' as const;
const REENTRY_PROFILE = 'full-measure.collision-reentry/v0.1' as const;
const RELATION_PROFILE = 'full-measure.collision-relation-projection/v0.1' as const;

type PrimitiveValue = string | number | boolean;

type EligibleOutcome = 'refused' | 'indeterminate';

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
  outcomeClass: EligibleOutcome;
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

export type CollisionWitnessStage =
  | 'attempted'
  | 'confirmed'
  | 'disposed'
  | 'residue-recorded'
  | 'projection-derived'
  | 'descendant-proposed';

export interface CollisionWitnessEntry {
  stage: CollisionWitnessStage;
  ref: string;
  evidenceRefs: string[];
  claimClass: 'evidence' | 'uncertainty' | 'proposal';
  authority: 'source-owned' | 'none';
}

export interface CollisionWitnessSessionInput {
  attemptRef: string;
  confirmationRef: string;
  dispositionRef: string;
  residue: WorldEncounterResidue;
  influence: ResidualInfluence;
  descendantProposal?: DeclaredFreedomProposal;
}

export interface CollisionWitnessSession {
  profile: typeof WITNESS_PROFILE;
  sessionRef: string;
  outcomeClass: EligibleOutcome;
  entries: CollisionWitnessEntry[];
}

export interface CollisionReentryInput {
  session: CollisionWitnessSession;
  residue: WorldEncounterResidue;
  influence: ResidualInfluence;
  descendantProposal?: DeclaredFreedomProposal;
}

export interface CollisionRelationRefs {
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  influenceRef: string;
  descendantProposalRef?: string;
}

export interface CollisionReentrySeed {
  profile: typeof REENTRY_PROFILE;
  reentryRef: string;
  sourceSessionRef: string;
  sourceResidueRef: string;
  outcomeClass: EligibleOutcome;
  relationRefs: CollisionRelationRefs;
  evidenceRefs: string[];
  unresolvedRefs: string[];
  decoderProfile: typeof REENTRY_PROFILE;
  reconstructionClaim: 'reentry-not-occurrence';
}

export interface CollisionRelationProjection {
  profile: typeof RELATION_PROFILE;
  reentryRef: string;
  sourceSessionRef: string;
  sourceResidueRef: string;
  outcomeClass: EligibleOutcome;
  relationRefs: CollisionRelationRefs;
  evidenceRefs: string[];
  unresolvedRefs: string[];
  reconstructionClaim: 'reentry-not-occurrence';
  authority: 'none';
}

function normalizedRefs(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function stableRef(prefix: string, tuple: readonly unknown[]): string {
  return `${prefix}:sha256:${sha256Hex(JSON.stringify(tuple))}`;
}

function bodyEntries(
  body: Readonly<Record<string, PrimitiveValue>>,
): Array<readonly [string, PrimitiveValue]> {
  return Object.keys(body)
    .sort((left, right) => left.localeCompare(right))
    .map((key) => [key, body[key]] as const);
}

function eligibleOutcome(residue: WorldEncounterResidue): EligibleOutcome {
  if (
    residue.outcomeClass !== 'refused' &&
    residue.outcomeClass !== 'indeterminate'
  ) {
    throw new CollisionSpecimenError(
      `ineligible collision outcome: ${residue.outcomeClass}`,
    );
  }
  return residue.outcomeClass;
}

function requireRef(value: string, label: string): string {
  if (!value.trim()) {
    throw new CollisionSpecimenError(`${label} is required`);
  }
  return value;
}

function assertInfluenceMatches(
  residue: WorldEncounterResidue,
  influence: ResidualInfluence,
): EligibleOutcome {
  const outcomeClass = eligibleOutcome(residue);
  if (
    influence.residueRef !== residue.residueRef ||
    influence.sourceFieldRef !== residue.sourceFieldRef ||
    influence.doorRef !== residue.doorRef ||
    influence.crossingRef !== residue.crossingRef ||
    influence.outcomeClass !== outcomeClass
  ) {
    throw new CollisionSpecimenError('influence does not match residue lineage');
  }
  return outcomeClass;
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
    return `${value}~${sha256Hex(`${seed}:${key}`).slice(0, 6)}`;
  }
  throw new CollisionSpecimenError(
    `unsupported ancestor value for dimension: ${key}`,
  );
}

export function deriveResidualInfluence(
  residue: WorldEncounterResidue,
): ResidualInfluence {
  const outcomeClass = eligibleOutcome(residue);
  const evidenceRefs = normalizedRefs(residue.evidenceRefs);
  const unresolvedRefs = normalizedRefs(residue.unresolvedRefs);
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

  const selector = sha256Hex(
    `${request.seed}:${request.policyVersion}:${request.ancestor.proposalRef}:${request.parentResidueRef}`,
  );
  const selectedIndex =
    Number.parseInt(selector.slice(0, 8), 16) % allowedDimensions.length;
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

export function createCollisionWitnessSession(
  input: CollisionWitnessSessionInput,
): CollisionWitnessSession {
  const outcomeClass = assertInfluenceMatches(input.residue, input.influence);
  const attemptRef = requireRef(input.attemptRef, 'attempt ref');
  const confirmationRef = requireRef(input.confirmationRef, 'confirmation ref');
  const dispositionRef = requireRef(input.dispositionRef, 'disposition ref');

  if (
    input.descendantProposal &&
    input.descendantProposal.parentResidueRef !== input.residue.residueRef
  ) {
    throw new CollisionSpecimenError(
      'descendant proposal does not match residue lineage',
    );
  }

  const sourceEvidenceRefs = normalizedRefs([
    ...input.residue.evidenceRefs,
    ...input.residue.returnRefs,
  ]);

  const entries: CollisionWitnessEntry[] = [
    {
      stage: 'attempted',
      ref: attemptRef,
      evidenceRefs: [],
      claimClass: 'evidence',
      authority: 'source-owned',
    },
    {
      stage: 'confirmed',
      ref: confirmationRef,
      evidenceRefs: [confirmationRef],
      claimClass: 'evidence',
      authority: 'source-owned',
    },
    {
      stage: 'disposed',
      ref: dispositionRef,
      evidenceRefs: sourceEvidenceRefs,
      claimClass: outcomeClass === 'indeterminate' ? 'uncertainty' : 'evidence',
      authority: 'source-owned',
    },
    {
      stage: 'residue-recorded',
      ref: input.residue.residueRef,
      evidenceRefs: sourceEvidenceRefs,
      claimClass: 'evidence',
      authority: 'source-owned',
    },
    {
      stage: 'projection-derived',
      ref: input.influence.influenceRef,
      evidenceRefs: [...input.influence.evidenceRefs],
      claimClass: 'evidence',
      authority: 'none',
    },
  ];

  if (input.descendantProposal) {
    entries.push({
      stage: 'descendant-proposed',
      ref: input.descendantProposal.proposalRef,
      evidenceRefs: [input.descendantProposal.parentResidueRef],
      claimClass: 'proposal',
      authority: 'none',
    });
  }

  const sessionRef = stableRef('collision-session', [
    WITNESS_PROFILE,
    outcomeClass,
    entries.map((entry) => [
      entry.stage,
      entry.ref,
      normalizedRefs(entry.evidenceRefs),
      entry.claimClass,
      entry.authority,
    ]),
  ]);

  return {
    profile: WITNESS_PROFILE,
    sessionRef,
    outcomeClass,
    entries: entries.map((entry) => ({
      ...entry,
      evidenceRefs: normalizedRefs(entry.evidenceRefs),
    })),
  };
}

export function createCollisionReentrySeed(
  input: CollisionReentryInput,
): CollisionReentrySeed {
  const outcomeClass = assertInfluenceMatches(input.residue, input.influence);
  if (input.session.outcomeClass !== outcomeClass) {
    throw new CollisionSpecimenError('witness session does not match residue outcome');
  }
  if (
    !input.session.entries.some(
      (entry) =>
        entry.stage === 'residue-recorded' &&
        entry.ref === input.residue.residueRef,
    ) ||
    !input.session.entries.some(
      (entry) =>
        entry.stage === 'projection-derived' &&
        entry.ref === input.influence.influenceRef,
    )
  ) {
    throw new CollisionSpecimenError('witness session is missing collision lineage');
  }
  if (
    input.descendantProposal &&
    input.descendantProposal.parentResidueRef !== input.residue.residueRef
  ) {
    throw new CollisionSpecimenError(
      'descendant proposal does not match residue lineage',
    );
  }

  const relationRefs: CollisionRelationRefs = {
    sourceFieldRef: input.residue.sourceFieldRef,
    doorRef: input.residue.doorRef,
    crossingRef: input.residue.crossingRef,
    influenceRef: input.influence.influenceRef,
    ...(input.descendantProposal
      ? { descendantProposalRef: input.descendantProposal.proposalRef }
      : {}),
  };
  const evidenceRefs = normalizedRefs([
    ...input.residue.evidenceRefs,
    ...input.residue.returnRefs,
    ...input.influence.evidenceRefs,
    ...input.session.entries.flatMap((entry) => entry.evidenceRefs),
  ]);
  const unresolvedRefs = normalizedRefs(input.residue.unresolvedRefs);
  const reentryRef = stableRef('collision-reentry', [
    REENTRY_PROFILE,
    input.session.sessionRef,
    input.residue.residueRef,
    outcomeClass,
    relationRefs.sourceFieldRef,
    relationRefs.doorRef,
    relationRefs.crossingRef,
    relationRefs.influenceRef,
    relationRefs.descendantProposalRef ?? '',
    evidenceRefs,
    unresolvedRefs,
  ]);

  return {
    profile: REENTRY_PROFILE,
    reentryRef,
    sourceSessionRef: input.session.sessionRef,
    sourceResidueRef: input.residue.residueRef,
    outcomeClass,
    relationRefs,
    evidenceRefs,
    unresolvedRefs,
    decoderProfile: REENTRY_PROFILE,
    reconstructionClaim: 'reentry-not-occurrence',
  };
}

export function reconstructCollisionRelation(
  seed: CollisionReentrySeed,
): CollisionRelationProjection {
  if (
    seed.profile !== REENTRY_PROFILE ||
    seed.decoderProfile !== REENTRY_PROFILE
  ) {
    throw new CollisionSpecimenError('re-entry profile mismatch');
  }
  requireRef(seed.reentryRef, 're-entry ref');
  requireRef(seed.sourceSessionRef, 'source session ref');
  requireRef(seed.sourceResidueRef, 'source residue ref');
  requireRef(seed.relationRefs.sourceFieldRef, 'source field ref');
  requireRef(seed.relationRefs.doorRef, 'door ref');
  requireRef(seed.relationRefs.crossingRef, 'crossing ref');
  requireRef(seed.relationRefs.influenceRef, 'influence ref');

  return {
    profile: RELATION_PROFILE,
    reentryRef: seed.reentryRef,
    sourceSessionRef: seed.sourceSessionRef,
    sourceResidueRef: seed.sourceResidueRef,
    outcomeClass: seed.outcomeClass,
    relationRefs: {
      ...seed.relationRefs,
    },
    evidenceRefs: normalizedRefs(seed.evidenceRefs),
    unresolvedRefs: normalizedRefs(seed.unresolvedRefs),
    reconstructionClaim: 'reentry-not-occurrence',
    authority: 'none',
  };
}

export type PlentyEvidenceClass = 'declared' | 'observed' | 'witnessed';
export type PlentyProvenanceKind =
  | 'self-report'
  | 'human-witness'
  | 'system-observation'
  | 'model-output'
  | 'plenty-receipt'
  | 'external-claim';
export type PlentyTruthState = 'available' | 'unavailable' | 'unknown';
export type PlentyAccessState = 'accessible' | 'inaccessible' | 'unknown';
export type PlentyAuthorityState = 'authorized' | 'unauthorized' | 'unknown';
export type PlentyCurrentness = 'current' | 'stale' | 'unknown';

export interface PlentyConstraint {
  constraintRef: string;
  kind: 'resource' | 'time' | 'other';
  hard: boolean;
}

export interface PlentyConstraintResult {
  constraintRef: string;
  result: 'satisfied' | 'failed' | 'unknown';
}

export interface PlentyNeed {
  needRef: string;
  capabilityRequirement: string;
  deadlineRef?: string;
  constraints?: PlentyConstraint[];
}

export interface PlentyParticular {
  particularRef: string;
  kind: string;
  sourceRefs: string[];
}

export interface PlentyCapabilityClaim {
  capabilityRef: string;
  particularRef: string;
  capability: string;
  evidenceClass: PlentyEvidenceClass;
  provenanceKind: PlentyProvenanceKind;
  currentness: PlentyCurrentness;
  availability: PlentyTruthState;
  access: PlentyAccessState;
  authority: PlentyAuthorityState;
  dependencyRefs: string[];
  requiresCapabilityRefs: string[];
  sourceRefs: string[];
  reproductiveEvidenceRefs?: string[];
}

export interface PlentyCandidatePath {
  pathRef: string;
  needRef: string;
  capabilityRefs: string[];
  dependencyRefs: string[];
  satisfiesCapabilityRequirement: boolean;
  constraintResults: PlentyConstraintResult[];
}

export interface PlentyEvaluationInput {
  need: PlentyNeed;
  particulars: PlentyParticular[];
  capabilities: PlentyCapabilityClaim[];
  candidatePaths: PlentyCandidatePath[];
}

export interface PlentyPathReceipt {
  pathRef: string;
  structuralState: 'complete' | 'incomplete';
  viabilityState: 'viable' | 'blocked' | 'unresolved';
  dependencyRefs: string[];
  blockingRefs: string[];
  unresolvedRefs: string[];
}

export interface PlentyReceipt {
  needRef: string;
  candidatePathCount: number;
  structurallyCompletePathCount: number;
  viablePathCount: number;
  independentPathCount: number;
  independentPathRefs: string[];
  blockingDependencyRefs: string[];
  fragileDependencyRefs: string[];
  unusedCapabilityRefs: string[];
  unresolvedClaimRefs: string[];
  pathReceipts: PlentyPathReceipt[];
  disposition:
    | 'NO_KNOWN_PATH'
    | 'POSSIBILITIES_ONLY'
    | 'VIABLE_BUT_FRAGILE'
    | 'MULTIPATH'
    | 'RESILIENT_MULTIPATH';
}

export type WorldSourceMode = 'fixture' | 'live';

export interface WorldFieldProjection {
  fieldRef: string;
  projectionVersion: string;
  sourceMode: WorldSourceMode;
  sourceRefs: string[];
  unresolvedRefs: string[];
  excludedSourceClasses: string[];
}

export interface WorldDoorProjection {
  doorRef: string;
  destinationRef: string;
  relation: string;
  reachability: 'reachable' | 'blocked' | 'unknown';
  provenanceRefs: string[];
  relevanceReasons: string[];
  requiredCrossingProfile: string;
  authority: 'none';
  sourceMode: WorldSourceMode;
}

export type WorldEncounterOutcomeClass =
  | 'validation-failed'
  | 'admitted'
  | 'refused'
  | 'indeterminate'
  | 'failed';

export interface WorldEncounterResidueInput {
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  outcomeClass: WorldEncounterOutcomeClass;
  evidenceRefs: string[];
  unresolvedRefs: string[];
  returnRefs: string[];
  constitutedDestinationRefs: string[];
}

export interface WorldEncounterResidue extends WorldEncounterResidueInput {
  residueRef: string;
}

export type WorldAdapterFailureKind = 'transport' | 'contract' | 'donor';

export type WorldAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; kind: WorldAdapterFailureKind; code: string };

export interface Project0VerifyPort {
  verify(expectedRef: string, body: unknown): Promise<WorldAdapterResult<{
    operation: 'verify';
    record: { ref: string; body: unknown };
  }>>;
}

export interface CorpusEvaluationRequest {
  envelopeRef: string;
  destinationSubjectRef?: string;
  input: string;
}

export interface CorpusDisposition {
  status: 'admitted' | 'refused' | 'indeterminate' | 'failed';
  reasonCode: string;
  destinationFrameRef: string;
  envelopeRef: string;
  evidenceRefs: string[];
  outputRefs: string[];
  authorityTransfer: 'none';
  callerAuthenticated: false;
  legalValidity?: 'unclaimed';
  receiptRequestId?: string;
}

export interface CorpusEvaluationPort {
  evaluate(request: CorpusEvaluationRequest): Promise<WorldAdapterResult<CorpusDisposition>>;
}

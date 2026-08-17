export type EvidenceMode = 'live' | 'fixture';

export interface WorldDoorProjection {
  doorRef: string;
  destinationRef: string;
  relation: string;
  reachability: 'reachable' | 'blocked' | 'unknown';
  provenanceRefs: string[];
  relevanceReasons: string[];
  requiredCrossingProfile: string;
  evidenceMode: EvidenceMode;
  authority: 'none';
}

export interface WorldFieldProjection {
  fieldRef: 'full-measure:garden/world-field/v0.1';
  projectionVersion: 'full-measure.world-field/v0.1';
  doors: WorldDoorProjection[];
  admittedDestinationRefs: string[];
  visibleResidueRefs: string[];
}

export interface StrokePoint {
  sequence: number;
  x: number;
  y: number;
}

export interface RawTraversalStroke {
  rawStrokeRef: string;
  points: StrokePoint[];
}

export interface TraversalCandidateProjection {
  doorRef: string;
  totalCost: number;
}

export interface TraversalDecodingProjection {
  authority: 'none';
  decodingRef: string;
  candidates: TraversalCandidateProjection[];
  ambiguity: {
    kind: 'none' | 'collision';
    leadingDoorRefs: string[];
  };
}

export interface TraversalPort {
  decode(input: {
    stroke: RawTraversalStroke;
    doors: WorldDoorProjection[];
  }): Promise<TraversalDecodingProjection>;
}

export interface ConfirmedCrossingIntent {
  sourceFieldRef: WorldFieldProjection['fieldRef'];
  destinationDoorRef: string;
  destinationRef: string;
  traversalEvidenceRefs: string[];
  offeredWitnessRefs: string[];
  confirmedBy: string;
  confirmationReceiptRef: string;
}

export type EncounterPreparation =
  | {
      status: 'ok';
      encounterRef: string;
      encounter: unknown;
      evidenceRefs: string[];
    }
  | {
      status: 'validation-failed';
      reasonCode: string;
      evidenceRefs: string[];
    };

export interface EncounterPort {
  prepare(input: ConfirmedCrossingIntent): Promise<EncounterPreparation>;
}

export type DestinationDisposition =
  | {
      status: 'admitted' | 'refused' | 'indeterminate';
      authority: 'none';
      reasonCode: string;
      evidenceRefs: string[];
    }
  | {
      status: 'failed';
      authority: 'none';
      failureClass: string;
      evidenceRefs: string[];
    };

export interface DestinationPort {
  evaluate(input: {
    encounterRef: string;
    encounter: unknown;
    door: WorldDoorProjection;
  }): Promise<DestinationDisposition>;
}

export interface WorldEncounterResidue {
  residueRef: string;
  sourceFieldRef: WorldFieldProjection['fieldRef'];
  doorRef: string;
  destinationRef: string;
  rawStrokeRef: string;
  decodingRef: string;
  confirmationReceiptRef: string;
  encounterRef: string;
  destinationStatus: DestinationDisposition['status'];
  authority: 'none';
  evidenceRefs: string[];
}

export type WorldChange =
  | { kind: 'illumination'; destinationRef: string; residueRef: string }
  | { kind: 'boundary-scar'; destinationRef: string; residueRef: string }
  | { kind: 'unresolved-fog'; destinationRef: string; residueRef: string }
  | { kind: 'operational-failure'; destinationRef: string; residueRef: string };

export interface ConfirmCrossingRequest {
  pendingId: string;
  confirmed: boolean;
  doorRef: string;
  offeredWitnessRefs: string[];
  confirmedBy: string;
}

export type ConfirmCrossingResult =
  | { kind: 'declined' }
  | {
      kind: 'validation-failed';
      reasonCode: string;
      evidenceRefs: string[];
    }
  | {
      kind: 'terminal';
      residue: WorldEncounterResidue;
      worldChange: WorldChange;
    };

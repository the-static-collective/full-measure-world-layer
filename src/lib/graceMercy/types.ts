import type { DomainEvent } from '../../types.js';

export type SheetSide = 'GRACE' | 'MERCY';
export type EvidenceState = 'KNOWN' | 'REPORTED' | 'DERIVED' | 'CONTESTED' | 'UNKNOWN';
export type Discernment = 'Y' | 'HOLD' | 'REFUSE';
export type MercyDisposition =
  | 'RECONCILED'
  | 'REPAIRED_BUT_DIFFERENT'
  | 'BOUNDED'
  | 'SEPARATED'
  | 'RELEASED'
  | 'REFERRED'
  | 'UNRESOLVED';

export interface BrokenPromiseFact {
  key: string;
  state: EvidenceState;
  summary: string;
  evidenceRefs: readonly string[];
}

export interface BrokenPromiseFixture {
  fixtureId: string;
  ruptureRef: string;
  occurrenceRef: string;
  affectedContinuityRef: string;
  facts: readonly BrokenPromiseFact[];
  proposedRetryCrossing: string;
  defaultBoundary: string;
}

export interface RuptureProjection {
  ruptureId: string;
  occurrenceRef: string;
  affectedContinuityRefs: readonly string[];
  evidenceRefs: readonly string[];
  knownEffects: readonly string[];
  unknowns: readonly string[];
  status: 'candidate' | 'established' | 'contested';
  intentState: EvidenceState;
  motiveClaim: string | null;
}

export interface MercyEncounterProjection {
  characterRef: string;
  encounterId: string;
  currentSheet: SheetSide;
  ruptureStatus: RuptureProjection['status'];
  mercyAvailable: boolean;
  discernment: Discernment | null;
  disposition: MercyDisposition;
  activeBoundaries: readonly string[];
  evidenceStates: readonly BrokenPromiseFact[];
  unknowns: readonly string[];
  objective: string;
  closed: boolean;
  eventHistory: readonly DomainEvent[];
}

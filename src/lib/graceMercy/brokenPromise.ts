import type { DomainEvent } from '../../types.js';
import type { BrokenPromiseFact, MercyEncounterProjection, RuptureProjection } from './types.js';
import { BROKEN_PROMISE_FIXTURE } from './fixtures.js';

export type BrokenPromiseAction =
  | 'NOTICE_RUPTURE'
  | 'TURN_TO_MERCY'
  | 'NAME_OCCURRENCE'
  | 'TEST_PATTERN'
  | 'WITNESS_CONSEQUENCE'
  | 'BOUND_COMMITMENT'
  | 'DISCERN_Y'
  | 'DISCERN_HOLD'
  | 'DISCERN_REFUSE'
  | 'TURN_TO_GRACE'
  | 'CLOSE_ENCOUNTER';

export type MercyTransitionErrorCode =
  | 'MERCY_NOT_AVAILABLE'
  | 'MERCY_SHEET_REQUIRED'
  | 'GRACE_SHEET_REQUIRED'
  | 'ENCOUNTER_ALREADY_CLOSED'
  | 'ACTION_ALREADY_APPLIED'
  | 'PREREQUISITE_MISSING'
  | 'DISCERNMENT_REQUIRED';

export class MercyTransitionError extends Error {
  constructor(public readonly code: MercyTransitionErrorCode) {
    super(code);
    this.name = 'MercyTransitionError';
  }
}

const ESTABLISHING_KEYS = new Set(['promise_made','promise_missed_1','promise_missed_2','consequence_absorbed_by_other']);

export function deriveBrokenPromiseRupture(facts: readonly BrokenPromiseFact[]): RuptureProjection {
  const knownKeys = new Set(facts.filter((fact) => fact.state === 'KNOWN').map((fact) => fact.key));
  const established = [...ESTABLISHING_KEYS].every((key) => knownKeys.has(key));
  const intent = facts.find((fact) => fact.key === 'intent_unknown');
  const evidenceRefs = [...new Set(facts.flatMap((fact) => fact.evidenceRefs))];
  return {
    ruptureId: BROKEN_PROMISE_FIXTURE.ruptureRef,
    occurrenceRef: BROKEN_PROMISE_FIXTURE.occurrenceRef,
    affectedContinuityRefs: [BROKEN_PROMISE_FIXTURE.affectedContinuityRef],
    evidenceRefs,
    knownEffects: facts.filter((fact) => fact.state === 'KNOWN' && fact.key !== 'promise_made').map((fact) => fact.key),
    unknowns: facts.filter((fact) => fact.state === 'UNKNOWN').map((fact) => fact.key),
    status: established ? 'established' : 'candidate',
    intentState: intent?.state ?? 'UNKNOWN',
    motiveClaim: null,
  };
}

export function isMercyAvailable(rupture: RuptureProjection): boolean {
  return rupture.status === 'established' || rupture.status === 'contested';
}

const has = (projection: MercyEncounterProjection, eventType: string) =>
  projection.eventHistory.some((event) => event.eventType === eventType);

export function validateBrokenPromiseAction(projection: MercyEncounterProjection, action: BrokenPromiseAction): void {
  if (projection.closed) throw new MercyTransitionError('ENCOUNTER_ALREADY_CLOSED');

  if (action === 'NOTICE_RUPTURE') {
    if (has(projection, 'mercy.rupture_noticed')) throw new MercyTransitionError('ACTION_ALREADY_APPLIED');
    return;
  }
  if (action === 'TURN_TO_MERCY') {
    if (!projection.mercyAvailable) throw new MercyTransitionError('MERCY_NOT_AVAILABLE');
    if (projection.currentSheet !== 'GRACE') throw new MercyTransitionError('GRACE_SHEET_REQUIRED');
    return;
  }
  if (action === 'TURN_TO_GRACE') {
    if (projection.currentSheet !== 'MERCY') throw new MercyTransitionError('MERCY_SHEET_REQUIRED');
    if (!projection.discernment) throw new MercyTransitionError('DISCERNMENT_REQUIRED');
    return;
  }
  if (action === 'CLOSE_ENCOUNTER') {
    if (!projection.discernment) throw new MercyTransitionError('DISCERNMENT_REQUIRED');
    return;
  }

  if (projection.currentSheet !== 'MERCY') throw new MercyTransitionError('MERCY_SHEET_REQUIRED');

  const requirements: Partial<Record<BrokenPromiseAction, string>> = {
    NAME_OCCURRENCE: 'mercy.sheet_turned',
    TEST_PATTERN: 'mercy.occurrence_named',
    WITNESS_CONSEQUENCE: 'mercy.pattern_tested',
    BOUND_COMMITMENT: 'mercy.consequence_witnessed',
    DISCERN_Y: 'mercy.boundary_set',
    DISCERN_HOLD: 'mercy.boundary_set',
    DISCERN_REFUSE: 'mercy.boundary_set',
  };
  const required = requirements[action];
  if (required && !has(projection, required)) throw new MercyTransitionError('PREREQUISITE_MISSING');

  const uniqueEventByAction: Partial<Record<BrokenPromiseAction, string>> = {
    NAME_OCCURRENCE: 'mercy.occurrence_named',
    TEST_PATTERN: 'mercy.pattern_tested',
    WITNESS_CONSEQUENCE: 'mercy.consequence_witnessed',
    BOUND_COMMITMENT: 'mercy.boundary_set',
  };
  const uniqueType = uniqueEventByAction[action];
  if (uniqueType && has(projection, uniqueType)) throw new MercyTransitionError('ACTION_ALREADY_APPLIED');
  if (action.startsWith('DISCERN_') && has(projection, 'mercy.discerned')) throw new MercyTransitionError('ACTION_ALREADY_APPLIED');
}

export interface ApplyBrokenPromiseActionInput {
  projection: MercyEncounterProjection;
  action: BrokenPromiseAction;
  actorId: string;
  circleId: string;
  eventId: string;
  occurredAt: string;
}

export function applyBrokenPromiseAction(input: ApplyBrokenPromiseActionInput): DomainEvent {
  validateBrokenPromiseAction(input.projection, input.action);
  const base = {
    id: input.eventId,
    circleId: input.circleId,
    aggregateType: 'mercy_encounter' as const,
    aggregateId: input.projection.encounterId,
    actorId: input.actorId,
    createdAt: input.occurredAt,
  };
  const rupture = deriveBrokenPromiseRupture(BROKEN_PROMISE_FIXTURE.facts);

  switch (input.action) {
    case 'NOTICE_RUPTURE':
      return { ...base, eventType:'mercy.rupture_noticed', payload:{ ruptureRef: rupture.ruptureId, status: rupture.status, evidenceRefs: rupture.evidenceRefs, unknowns: rupture.unknowns } };
    case 'TURN_TO_MERCY':
      return { ...base, eventType:'mercy.sheet_turned', payload:{ from:'GRACE', to:'MERCY', reasonRef: rupture.ruptureId } };
    case 'NAME_OCCURRENCE':
      return { ...base, eventType:'mercy.occurrence_named', payload:{ occurrenceRef: rupture.occurrenceRef, label:'promise repeatedly unfulfilled', motiveClaim:null } };
    case 'TEST_PATTERN':
      return { ...base, eventType:'mercy.pattern_tested', payload:{ factRefs:['promise_missed_1','promise_missed_2'], result:'repeated-pattern-established', intentState:'UNKNOWN' } };
    case 'WITNESS_CONSEQUENCE':
      return { ...base, eventType:'mercy.consequence_witnessed', payload:{ evidenceRef:'evidence:absorbed-consequence', witnessScope:'fixture-evidence-observed', authority:'none' } };
    case 'BOUND_COMMITMENT':
      return { ...base, eventType:'mercy.boundary_set', payload:{ boundary:BROKEN_PROMISE_FIXTURE.defaultBoundary, scope:'do-not-renew-under-same-conditions' } };
    case 'DISCERN_REFUSE':
      return { ...base, eventType:'mercy.discerned', payload:{ discernment:'REFUSE', disposition:'BOUNDED', proposedCrossing:BROKEN_PROMISE_FIXTURE.defaultBoundary } };
    case 'DISCERN_HOLD':
      return { ...base, eventType:'mercy.discerned', payload:{ discernment:'HOLD', disposition:'UNRESOLVED', proposedCrossing:BROKEN_PROMISE_FIXTURE.defaultBoundary } };
    case 'DISCERN_Y':
      return { ...base, eventType:'mercy.discerned', payload:{ discernment:'Y', disposition:'BOUNDED', proposedCrossing:BROKEN_PROMISE_FIXTURE.proposedRetryCrossing } };
    case 'TURN_TO_GRACE':
      return { ...base, eventType:'mercy.sheet_turned', payload:{ from:'MERCY', to:'GRACE', boundaryPreserved:true } };
    case 'CLOSE_ENCOUNTER':
      return { ...base, eventType:'mercy.encounter_closed', payload:{ discernment:input.projection.discernment, disposition:input.projection.disposition, endingSheet:input.projection.currentSheet } };
  }
}

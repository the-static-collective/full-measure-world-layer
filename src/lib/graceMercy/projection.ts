import type { DomainEvent } from '../../types.js';
import { BROKEN_PROMISE_FIXTURE } from './fixtures.js';
import type { Discernment, MercyDisposition, MercyEncounterProjection, SheetSide } from './types.js';

const GRACE_VERBS = Object.freeze(['WELCOME','ENCOURAGE','GIVE','CONNECT','PLANT','FEED','PLAY','PRAY','BUILD','INVITE','TEACH','RECEIVE','BLESS','CELEBRATE','POUR'] as const);
const MERCY_VERBS = Object.freeze(['NOTICE','NAME','TEST','HOLD','WITNESS','BOUND','INTERRUPT','REFUSE','SEPARATE','REPAIR','RESTITUTE','RECONCILE','RELEASE','RETURN'] as const);

function chronological(events: readonly DomainEvent[], encounterId: string): DomainEvent[] {
  return events
    .filter((event) => event.aggregateType === 'mercy_encounter' && event.aggregateId === encounterId)
    .slice()
    .sort((a,b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function buildGraceMercyProjection(characterRef: string, encounterId: string, events: readonly DomainEvent[]): MercyEncounterProjection {
  const history = chronological(events, encounterId);
  let currentSheet: SheetSide = 'GRACE';
  let ruptureStatus: MercyEncounterProjection['ruptureStatus'] = 'candidate';
  let mercyAvailable = false;
  let discernment: Discernment | null = null;
  let disposition: MercyDisposition = 'UNRESOLVED';
  let objective = 'HELP THEM SUCCEED';
  let closed = false;
  const boundaries: string[] = [];

  for (const event of history) {
    switch (event.eventType) {
      case 'mercy.rupture_noticed': {
        const status = event.payload.status;
        if (status === 'candidate' || status === 'established' || status === 'contested') ruptureStatus = status;
        mercyAvailable = ruptureStatus === 'established' || ruptureStatus === 'contested';
        break;
      }
      case 'mercy.sheet_turned': {
        const to = event.payload.to;
        if (to === 'GRACE' || to === 'MERCY') currentSheet = to;
        break;
      }
      case 'mercy.occurrence_named':
        objective = 'ESTABLISH WHAT ACTUALLY HAPPENED';
        break;
      case 'mercy.boundary_set': {
        const boundary = event.payload.boundary;
        if (typeof boundary === 'string' && !boundaries.includes(boundary)) boundaries.push(boundary);
        break;
      }
      case 'mercy.discerned': {
        const d = event.payload.discernment;
        if (d === 'Y' || d === 'HOLD' || d === 'REFUSE') discernment = d;
        const nextDisposition = event.payload.disposition;
        if (typeof nextDisposition === 'string') disposition = nextDisposition as MercyDisposition;
        break;
      }
      case 'mercy.encounter_closed':
        closed = true;
        break;
    }
  }

  return {
    characterRef,
    encounterId,
    currentSheet,
    ruptureStatus,
    mercyAvailable,
    discernment,
    disposition,
    activeBoundaries: boundaries,
    evidenceStates: BROKEN_PROMISE_FIXTURE.facts,
    unknowns: BROKEN_PROMISE_FIXTURE.facts.filter((fact) => fact.state === 'UNKNOWN').map((fact) => fact.key),
    objective,
    closed,
    eventHistory: history,
  };
}

export function getAvailableGraceVerbs(_projection: MercyEncounterProjection): readonly string[] { return GRACE_VERBS; }
export function getAvailableMercyVerbs(_projection: MercyEncounterProjection): readonly string[] { return MERCY_VERBS; }

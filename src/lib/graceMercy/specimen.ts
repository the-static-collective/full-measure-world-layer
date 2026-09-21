import type { DomainEvent } from '../../types.js';
import { applyBrokenPromiseAction, type BrokenPromiseAction } from './brokenPromise.js';
import { buildGraceMercyProjection } from './projection.js';
import { buildMercyEncounterReceipt, type MercyEncounterReceipt } from './receipt.js';
import type { MercyEncounterProjection } from './types.js';

const SPECIMEN_ACTIONS: readonly BrokenPromiseAction[] = [
  'NOTICE_RUPTURE',
  'TURN_TO_MERCY',
  'NAME_OCCURRENCE',
  'TEST_PATTERN',
  'WITNESS_CONSEQUENCE',
  'BOUND_COMMITMENT',
  'DISCERN_REFUSE',
  'CLOSE_ENCOUNTER',
];

export interface GraceMercyBrokenPromiseSpecimen {
  events: readonly DomainEvent[];
  projection: MercyEncounterProjection;
  receipt: MercyEncounterReceipt;
}

export function runGraceMercyBrokenPromiseSpecimen(): GraceMercyBrokenPromiseSpecimen {
  const characterRef = 'specimen:grace';
  const encounterId = 'grace-mercy:broken-promise-001:specimen-grace';
  const events: DomainEvent[] = [];

  SPECIMEN_ACTIONS.forEach((action, index) => {
    const projection = buildGraceMercyProjection(characterRef, encounterId, events);
    events.push(
      applyBrokenPromiseAction({
        projection,
        action,
        actorId: characterRef,
        circleId: 'specimen:circle',
        eventId: `specimen-action-${String(index + 1).padStart(2, '0')}`,
        occurredAt: `2026-09-21T14:${String(index).padStart(2, '0')}:00.000Z`,
      }),
    );
  });

  const projection = buildGraceMercyProjection(characterRef, encounterId, events);
  return { events, projection, receipt: buildMercyEncounterReceipt(projection) };
}

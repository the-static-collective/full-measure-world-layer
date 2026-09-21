import type { DomainEvent } from '../../types.js';
import type { BrokenPromiseAction } from './brokenPromise.js';
import { applyBrokenPromiseAction, MercyTransitionError } from './brokenPromise.js';
import { buildGraceMercyProjection } from './projection.js';
import { buildMercyEncounterReceipt, type MercyEncounterReceipt } from './receipt.js';
import type { MercyEncounterProjection } from './types.js';

const ACTIONS = new Set<BrokenPromiseAction>([
  'NOTICE_RUPTURE','TURN_TO_MERCY','NAME_OCCURRENCE','TEST_PATTERN','WITNESS_CONSEQUENCE','BOUND_COMMITMENT','DISCERN_Y','DISCERN_HOLD','DISCERN_REFUSE','TURN_TO_GRACE','CLOSE_ENCOUNTER'
]);

export class GraceMercyHttpError extends Error {
  constructor(public readonly status: number, public readonly code: string) {
    super(code);
    this.name = 'GraceMercyHttpError';
  }
}

export interface GraceMercyEncounterResponse {
  projection: MercyEncounterProjection;
  receipt: MercyEncounterReceipt | null;
}

export interface AcceptGraceMercyActionInput {
  userId: string;
  actorId: string;
  circleId: string;
  body: unknown;
  events: readonly DomainEvent[];
  now: string;
}

export interface AcceptedGraceMercyAction extends GraceMercyEncounterResponse {
  event: DomainEvent;
  duplicate: boolean;
}

export function graceMercyEncounterId(userId: string): string {
  return `grace-mercy:broken-promise-001:${userId}`;
}

export function buildGraceMercyEncounter(userId: string, events: readonly DomainEvent[]): GraceMercyEncounterResponse {
  const encounterId = graceMercyEncounterId(userId);
  const projection = buildGraceMercyProjection(userId, encounterId, events);
  return {
    projection,
    receipt: projection.closed ? buildMercyEncounterReceipt(projection) : null,
  };
}

function parseBody(body: unknown): { actionId: string; action: BrokenPromiseAction } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new GraceMercyHttpError(400, 'INVALID_ACTION_BODY');
  const record = body as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  if (keys.length !== 2 || keys[0] !== 'action' || keys[1] !== 'actionId') throw new GraceMercyHttpError(400, 'INVALID_ACTION_BODY');
  if (typeof record.actionId !== 'string' || record.actionId.trim().length === 0 || record.actionId.length > 128) throw new GraceMercyHttpError(400, 'INVALID_ACTION_ID');
  if (typeof record.action !== 'string' || !ACTIONS.has(record.action as BrokenPromiseAction)) throw new GraceMercyHttpError(400, 'INVALID_ACTION');
  return { actionId: record.actionId, action: record.action as BrokenPromiseAction };
}

export function acceptGraceMercyAction(input: AcceptGraceMercyActionInput): AcceptedGraceMercyAction {
  if (input.actorId !== input.userId) throw new GraceMercyHttpError(403, 'ACTOR_MISMATCH');
  const { actionId, action } = parseBody(input.body);
  const encounterId = graceMercyEncounterId(input.userId);
  const relevant = input.events.filter((event) => event.aggregateType === 'mercy_encounter' && event.aggregateId === encounterId);
  const duplicate = relevant.find((event) => event.payload.actionId === actionId);
  if (duplicate) {
    if (duplicate.payload.action !== action) throw new GraceMercyHttpError(409, 'ACTION_ID_CONFLICT');
    const { projection, receipt } = buildGraceMercyEncounter(input.userId, input.events);
    return { event: duplicate, duplicate: true, projection, receipt };
  }

  const { projection } = buildGraceMercyEncounter(input.userId, input.events);
  let event: DomainEvent;
  try {
    event = applyBrokenPromiseAction({
      projection,
      action,
      actorId: input.actorId,
      circleId: input.circleId,
      eventId: `mercy_action:${encodeURIComponent(input.userId)}:${encodeURIComponent(actionId)}`,
      occurredAt: input.now,
    });
  } catch (error) {
    if (error instanceof MercyTransitionError) throw new GraceMercyHttpError(409, error.code);
    throw error;
  }
  event = { ...event, payload: { ...event.payload, actionId, action } };
  const nextEvents = [...input.events, event];
  const next = buildGraceMercyEncounter(input.userId, nextEvents);
  return { event, duplicate: false, projection: next.projection, receipt: next.receipt };
}

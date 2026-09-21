import { createHash } from 'node:crypto';
import { BROKEN_PROMISE_FIXTURE } from './fixtures.js';
import type { Discernment, MercyDisposition, MercyEncounterProjection, SheetSide } from './types.js';

export interface MercyReceiptSheetTurn {
  eventId: string;
  from: SheetSide;
  to: SheetSide;
  reasonRef: string | null;
  occurredAt: string;
}

export interface MercyEncounterReceipt {
  version: 'full-measure/mercy-encounter-receipt/v0.1';
  encounterId: string;
  characterRef: string;
  ruptureRef: string;
  startingSheet: 'GRACE';
  sheetTurns: readonly MercyReceiptSheetTurn[];
  evidenceRefs: readonly string[];
  unknowns: readonly string[];
  boundaries: readonly string[];
  discernment: Discernment;
  disposition: MercyDisposition;
  consequences: readonly string[];
  endingSheet: SheetSide;
  eventIds: readonly string[];
  nonClaims: readonly string[];
  receiptHash: string;
}

export interface MercyReceiptValidation {
  valid: boolean;
  errors: readonly string[];
}

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

function canonicalize(value: Json): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error('NON_FINITE_NUMBER');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(value[key])}`).join(',')}}`;
}

export function canonicalMercyReceiptHash(value: Omit<MercyEncounterReceipt, 'receiptHash'>): string {
  const digest = createHash('sha256').update(canonicalize(value as unknown as Json)).digest('hex');
  return `sha256:${digest}`;
}

const NON_CLAIMS = Object.freeze([
  'does_not_establish_motive',
  'does_not_diagnose_person',
  'does_not_establish_moral_worth',
  'does_not_establish_divine_interpretation',
  'does_not_restore_relationship',
  'does_not_remove_consequence',
] as const);

function assertUniqueEventIds(eventIds: readonly string[]): void {
  if (new Set(eventIds).size !== eventIds.length) throw new Error('DUPLICATE_EVENT_ID');
}

export function buildMercyEncounterReceipt(projection: MercyEncounterProjection): MercyEncounterReceipt {
  if (!projection.closed) throw new Error('ENCOUNTER_NOT_CLOSED');
  if (!projection.discernment) throw new Error('DISCERNMENT_MISSING');

  const eventIds = projection.eventHistory.map((event) => event.id);
  assertUniqueEventIds(eventIds);

  const sheetTurns: MercyReceiptSheetTurn[] = projection.eventHistory
    .filter((event) => event.eventType === 'mercy.sheet_turned')
    .map((event) => ({
      eventId: event.id,
      from: event.payload.from as SheetSide,
      to: event.payload.to as SheetSide,
      reasonRef: typeof event.payload.reasonRef === 'string' ? event.payload.reasonRef : null,
      occurredAt: event.createdAt,
    }));

  const evidenceRefs = [...new Set(BROKEN_PROMISE_FIXTURE.facts.flatMap((fact) => fact.evidenceRefs))];
  const consequences = BROKEN_PROMISE_FIXTURE.facts
    .filter((fact) => fact.state === 'KNOWN' && fact.key !== 'promise_made')
    .map((fact) => fact.key);

  const body: Omit<MercyEncounterReceipt, 'receiptHash'> = {
    version: 'full-measure/mercy-encounter-receipt/v0.1',
    encounterId: projection.encounterId,
    characterRef: projection.characterRef,
    ruptureRef: BROKEN_PROMISE_FIXTURE.ruptureRef,
    startingSheet: 'GRACE',
    sheetTurns,
    evidenceRefs,
    unknowns: [...projection.unknowns],
    boundaries: [...projection.activeBoundaries],
    discernment: projection.discernment,
    disposition: projection.disposition,
    consequences,
    endingSheet: projection.currentSheet,
    eventIds,
    nonClaims: [...NON_CLAIMS],
  };

  return { ...body, receiptHash: canonicalMercyReceiptHash(body) };
}

export function validateMercyReceipt(receipt: MercyEncounterReceipt): MercyReceiptValidation {
  const errors: string[] = [];
  try { assertUniqueEventIds(receipt.eventIds); } catch { errors.push('DUPLICATE_EVENT_ID'); }
  const { receiptHash, ...body } = receipt;
  if (canonicalMercyReceiptHash(body) !== receiptHash) errors.push('HASH_MISMATCH');
  for (const claim of NON_CLAIMS) if (!receipt.nonClaims.includes(claim)) errors.push(`MISSING_NON_CLAIM:${claim}`);
  if (!['Y','HOLD','REFUSE'].includes(receipt.discernment)) errors.push('INVALID_DISCERNMENT');
  return { valid: errors.length === 0, errors };
}

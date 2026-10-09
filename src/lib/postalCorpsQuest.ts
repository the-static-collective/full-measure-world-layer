/**
 * POSTAL-CORPS-001: Full Measure's receiver of an externally proposed route.
 *
 * This consumes an untrusted, private-safe GHoT -> LemonPRESS -> PENNY
 * projection. It intentionally does NOT verify reLATTE signatures, award
 * a Garden Deed, mutate DomainEvents, make financial commitments, or infer
 * proof of physical custody from a sender-supplied JSON document.
 */
export type PostalDisposition = 'HOLD' | 'REST' | 'LEAVE_OPEN' | 'PREVIEW_GARDEN_DRAFT';

export interface PostalCandidate {
  schema: 'full-measure.postal-quest-preview/v0';
  route_id: string;
  source_dispatch_state: 'service_selected';
  source_attestation: 'EXTERNAL_UNVERIFIED_IMPORT';
  carrier_claim_state: string;
  source_history_sha256: string;
  parcel_sha256: string;
  eligible_for_review: boolean;
  human_claim_present: boolean;
  status: 'LOCAL_PROPOSAL_ONLY';
  deed_state: 'NOT_AWARDED';
  official_full_measure_event_created: false;
  penny_released_units: 0;
  penny_book_coins: 0;
  compensation_state: 'NOT_AGREED_OR_SETTLED';
  possible_next_door: 'OPT_IN_GARDEN_DRAFT' | 'HOLD_OR_REFUSE';
}

const hash = /^[0-9a-f]{64}$/;
const routeRef = /^[a-z][a-z0-9-]{2,63}$/;

function obj(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype)
    throw Error('INVALID_POSTAL_OBJECT');
  return value as Record<string, unknown>;
}

function exactly(obj: Record<string, unknown>, expected: string[]): void {
  if (JSON.stringify(Object.keys(obj).sort()) !== JSON.stringify([...expected].sort()))
    throw Error('UNEXPECTED_POSTAL_FIELDS');
}

export function inspectPostalCorpsImport(value: unknown): PostalCandidate {
  const envelope = obj(value);
  exactly(envelope, [
    'source', 'source_dispatch_state', 'route_state', 'full_measure', 'penny',
    'private_addresses_in_output', 'real_postage_acquired', 'physical_delivery_claimed',
  ]);
  if (envelope.source !== 'LEMONPRESS_NATIVE_DISPATCH_001'
      || envelope.source_dispatch_state !== 'service_selected'
      || envelope.private_addresses_in_output !== false
      || envelope.real_postage_acquired !== false
      || envelope.physical_delivery_claimed !== false)
    throw Error('POSTAL_SOURCE_NOT_AN_UNPAID_FIXTURE');
  const fm = obj(envelope.full_measure);
  exactly(fm, [
    'schema', 'route_id', 'parcel_sha256', 'status', 'eligible_for_human_review',
    'self_reported', 'human_claims_present', 'deed_state',
    'official_full_measure_event_created', 'history_sha256',
  ]);
  if (fm.schema !== 'full-measure.postal-quest-draft/v0'
      || fm.status !== 'LOCAL_PROPOSAL_ONLY'
      || fm.deed_state !== 'NOT_AWARDED'
      || fm.official_full_measure_event_created !== false)
    throw Error('POSTAL_IMPORT_CANNOT_CLAIM_DEED');
  if (typeof fm.route_id !== 'string' || !routeRef.test(fm.route_id)
      || typeof fm.parcel_sha256 !== 'string' || !hash.test(fm.parcel_sha256))
    throw Error('BAD_POSTAL_IDENTITY');
  const pending = obj(envelope.penny);
  exactly(pending, [
    'schema', 'route_id', 'candidate_work_payloads', 'work_witness_proof', 'status',
    'book_coins', 'released_units', 'active_units', 'real_payment_occurred',
    'human_wage_agreement', 'ledger_touched', 'history_sha256',
  ]);
  if (pending.schema !== 'jubilee.penny-postal-work-proposal-only/v0'
      || pending.route_id !== fm.route_id
      || pending.status !== 'NO_TREASURY_EVENT'
      || pending.work_witness_proof !== null
      || pending.book_coins !== 0 || pending.released_units !== 0
      || pending.active_units !== 0 || pending.real_payment_occurred !== false
      || pending.human_wage_agreement !== false || pending.ledger_touched !== false)
    throw Error('POSTAL_IMPORT_CANNOT_GRANT_PENNY');
  const stage = envelope.route_state;
  const possible = stage === 'WORK_REVIEW_READY'
    && fm.eligible_for_human_review === true
    && fm.human_claims_present === true
    && fm.self_reported === 'YES';
  if (fm.history_sha256 !== pending.history_sha256
      || (fm.history_sha256 !== null
          && (typeof fm.history_sha256 !== 'string' || !hash.test(fm.history_sha256))))
    throw Error('POSTAL_INCONSISTENT_HISTORY');
  const candidates = pending.candidate_work_payloads;
  if (!Array.isArray(candidates) || candidates.length !== (possible ? 2 : 0))
    throw Error('POSTAL_WORK_PROPOSAL_NOT_CONSISTENT');
  for (let i=0; i<candidates.length; i++){
    const work = obj(candidates[i]);
    exactly(work, ['workId','holderId','quantity','termsRef','evidenceHash','completedAt']);
    if (work.holderId !== 'person:synthetic-carrier'+String(i+1)
        || work.quantity !== 1 || work.evidenceHash !== fm.history_sha256
        || typeof work.workId !== 'string'
        || work.workId !== 'postal-'+fm.route_id+'-leg-'+String(i+1)
        || typeof work.termsRef !== 'string'
        || !work.termsRef.startsWith('terms:illustrative-'))
      throw Error('UNSUPPORTED_POSTAL_WORK_PROJECTION');
  }
  return {
    schema:'full-measure.postal-quest-preview/v0',
    route_id:fm.route_id as string,
    source_dispatch_state:'service_selected',
    source_attestation:'EXTERNAL_UNVERIFIED_IMPORT',
    carrier_claim_state:String(stage),
    source_history_sha256:String(fm.history_sha256),
    parcel_sha256:fm.parcel_sha256 as string,
    eligible_for_review:possible,
    human_claim_present:fm.human_claims_present === true,
    status:'LOCAL_PROPOSAL_ONLY',
    deed_state:'NOT_AWARDED',
    official_full_measure_event_created:false,
    penny_released_units:0,
    penny_book_coins:0,
    compensation_state:'NOT_AGREED_OR_SETTLED',
    possible_next_door:possible?'OPT_IN_GARDEN_DRAFT':'HOLD_OR_REFUSE',
  };
}

/** A human can decline, rest, or request a Garden draft; no ledger append. */
export function choosePostalEncounter(
  candidate: PostalCandidate, decision: PostalDisposition
): {schema:'full-measure.postal-choice/v0',route_id:string,decision:PostalDisposition,
    consequence:'LOCAL_PREVIEW_ONLY', deed_state:'NOT_AWARDED'} {
  if (candidate.schema !== 'full-measure.postal-quest-preview/v0'
      || candidate.deed_state !== 'NOT_AWARDED'
      || !['HOLD','REST','LEAVE_OPEN','PREVIEW_GARDEN_DRAFT'].includes(decision))
    throw Error('POSTAL_CHOICE_INVALID');
  if (decision === 'PREVIEW_GARDEN_DRAFT' && candidate.possible_next_door !== 'OPT_IN_GARDEN_DRAFT')
    throw Error('POSTAL_QUEST_NOT_READY_FOR_PREVIEW');
  return {
    schema:'full-measure.postal-choice/v0',
    route_id:candidate.route_id,
    decision,
    consequence:'LOCAL_PREVIEW_ONLY',
    deed_state:'NOT_AWARDED',
  };
}

export function postalGardenDraft(candidate: PostalCandidate):
  {title:string,story:string,needs:string[],return_condition:string,provenance:string} {
  choosePostalEncounter(candidate,'PREVIEW_GARDEN_DRAFT');
  return {
    title:'Review two-carrier postal test: '+candidate.route_id,
    story:'Unverified external synthetic handoff claims; no real delivery occurred. '
      +'Any human contribution must be separately accepted and witnessed through the real Garden.',
    needs:['Human review of source and privacy','Independent field evidence before real participation'],
    return_condition:'Independent human review and a separate authorized Full Measure project/pledge/witness',
    provenance:'GHoT:POSTAL-CORPS-001:'+candidate.source_history_sha256,
  };
}

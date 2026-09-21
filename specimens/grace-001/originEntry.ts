/** Source-owned GRACE-001 entry policy. An address is not an invitation or an admission. */
const DESTINATION = 'full-measure/grace-001';
const SOURCE = 'foreign-room-seed-001';
const HASH = /^sha256:[a-f0-9]{64}$/;
const ITEM_MODES = new Set(['carry', 'reference', 'reconstitute', 'withhold']);

export const GRACE_ORIGIN_WORLD_MANIFEST = Object.freeze({
  schema: 'origin.world-manifest.v0.1',
  worldId: DESTINATION,
  displayName: 'GRACE-001 // An Ordinary Tuesday',
  version: '0.1-fixture-policy',
  status: 'experimental-fixture-policy-only',
  authority: 'grace-world-local',
  adapterKind: 'grace-origin-entry-policy-only',
  authorityPolicyRef: 'full-measure/grace-001/local-authorship',
  memoryPolicyRef: 'minimum-reference-only',
  declaredCapabilities: Object.freeze([]),
  knownGateRefs: Object.freeze([]),
  constitutionRef: 'specimens/grace-001/worldseed.json',
  localCampaignSchema: 'full-measure.grace-session.v1',
  entryPolicyRef: 'full-measure/grace-001/entry-policy-v0.1',
  exitPolicyRef: 'not-yet-declared',
  transferPolicyRef: 'full-measure/grace-001/reference-only-preview-v0.1',
  privacyPolicyRef: 'explicit-local-consent-required',
  arrivalPolicyRef: 'not-yet-declared',
  localTimeModel: 'grace-session-day-phase',
  continuationModel: 'append-only-grace-session-replay',
  allowedSourceWorldRefs: Object.freeze([SOURCE]),
  liveAdapterEnabled: false,
  nonClaims: Object.freeze([
    'manifest_is_not_an_entry_invitation',
    'manifest_does_not_confer_origin_admission',
    'grace_and_heaven_are_not_incoming_party_resources',
    'no_personal_grace_session_data_is_exposed',
    'no_world_state_mutation',
  ]),
});

interface CandidateGate {
  gateId: string;
  sourceWorldRef: string;
  destinationWorldRef: string;
  status: string;
  authorized: boolean;
  admissionStatus: string;
  reportedLocalEventRef: string;
  priorCrossingRef: string;
  sourceAddress: {
    worldId: string;
    sourceSystem: string;
    sourceBranch: string;
    sourceCommit: string;
    sourceSchema: string;
    sourcePath: string;
    claimScope: string;
  };
  unresolvedConditions: string[];
  nonClaims: string[];
}

interface TransferItem {
  ref: string;
  sourceSystem: string;
  claimScope: string;
  requestedMode: string;
  evidenceRef: string;
}
interface TransferRequest {
  schema: string;
  sourceWorldRef: string;
  proposedDestinationRef: string;
  partyRef: string;
  anchorRef: string;
  priorCrossingRef: string;
  items: TransferItem[];
}

const CONDITIONS = Object.freeze([
  'foreign-room-source-owned-exit-offer',
  'source-offer-integrity-verification',
  'grace-local-host-consent',
  'separate-human-party-confirmation',
  'grace-owned-arrival-adapter',
]);
const NON_CLAIMS = Object.freeze([
  'not_a_grace_world_invitation',
  'not_a_destination_admission',
  'reported_address_not_source_verified',
  'does_not_change_grace_campaign_state',
  'does_not_add_visitors_to_grace_or_heaven_party',
  'does_not_transfer_private_memory_or_local_capability',
  'not_a_cryptographic_verification_of_any_external_receipt',
]);

function object(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
function fail(code: string): never { throw new Error(code); }
function reference(value: unknown): value is string {
  return typeof value === 'string' && HASH.test(value);
}

/** Parse an untrusted reported Origin address, without treating a claimant as authoritative. */
export function inspectGraceCandidate(input: unknown) {
  if (!object(input)) return fail('DETECTED_GATE_REQUIRED');
  if (input.status !== 'DETECTED') return fail('DETECTED_GATE_REQUIRED');
  if (input.authorized !== false || input.admissionStatus !== 'UNREQUESTED') return fail('UNAUTHORIZED_GATE_CLAIM');
  if (input.sourceWorldRef !== SOURCE || input.destinationWorldRef !== DESTINATION) return fail('DESTINATION_MISMATCH');
  if (!reference(input.gateId) || !reference(input.reportedLocalEventRef) || !reference(input.priorCrossingRef)) return fail('CANDIDATE_ID_INVALID');
  if (!object(input.sourceAddress)) return fail('ADDRESS_SCOPE_INVALID');
  const address = input.sourceAddress;
  if (address.worldId !== DESTINATION || address.sourceSystem !== 'the-static-collective/full-measure-world-layer'
    || address.sourceSchema !== 'full-measure.grace-worldseed.v0'
    || address.sourcePath !== 'specimens/grace-001/worldseed.json'
    || address.claimScope !== 'developer-source-pointer-only'
    || address.sourceBranch !== 'feature/grace-001-worldseed'
    || typeof address.sourceCommit !== 'string' || !/^[a-f0-9]{40}$/.test(address.sourceCommit)) return fail('ADDRESS_SCOPE_INVALID');
  if (!Array.isArray(input.unresolvedConditions) || !input.unresolvedConditions.includes('grace-owned-entry-policy')
    || !Array.isArray(input.nonClaims) || !input.nonClaims.includes('not_a_grace_world_invitation')) return fail('ADDRESS_SCOPE_INVALID');
  return {
    schema: 'full-measure.grace-address-inspection.v0.1' as const,
    status: 'ADDRESS_RECOGNIZED_ONLY' as const,
    admitted: false as const,
    candidateGateRef: input.gateId,
    priorCrossingRef: input.priorCrossingRef,
    manifestRef: GRACE_ORIGIN_WORLD_MANIFEST.worldId,
    unresolvedConditions: [...CONDITIONS],
    nonClaims: [...NON_CLAIMS],
  };
}

function classify(item: TransferItem, anchorRef: string) {
  const {ref, sourceSystem, claimScope, requestedMode} = item;
  if (ref.startsWith('private:') || ref.startsWith('model:') || requestedMode === 'withhold') return 'WITHHOLD' as const;
  if (ref === 'static-field:charge' && sourceSystem === 'static-field/worldseed-001') return 'REFUSE' as const;
  if (ref === 'static-field:resonance-interpretation' && sourceSystem === 'static-field/worldseed-001') return 'HOLD' as const;
  if (ref.startsWith('human:') && sourceSystem === 'static-field/worldseed-001' && claimScope === 'participant-ref' && requestedMode === 'reference') return 'HOLD_PERSON_CONSENT' as const;
  if (ref === anchorRef && sourceSystem === 'postemahhn' && claimScope === 'card-reference-not-physical-custody' && requestedMode === 'reference') return 'REFERENCE_ELIGIBLE' as const;
  if (ref === 'thread:bell-unresolved' && sourceSystem === 'static-field/worldseed-001' && claimScope === 'unresolved-thread-only' && requestedMode === 'reference') return 'REFERENCE_ELIGIBLE' as const;
  if (ref === 'static-field:porch' && sourceSystem === 'static-field/worldseed-001' && claimScope === 'reported-origin-place' && requestedMode === 'reconstitute') return 'TRANSFORM_ON_ADMISSION' as const;
  return 'HOLD_UNDECLARED' as const;
}

/** This function never admits a party or writes to the Grace campaign. */
export function previewGraceTransfer(candidate: unknown, request: unknown) {
  const inspection = inspectGraceCandidate(candidate);
  if (!object(request) || Object.keys(request).sort().join('|') !== 'anchorRef|items|partyRef|priorCrossingRef|proposedDestinationRef|schema|sourceWorldRef') return fail('UNDECLARED_REQUEST_FIELDS');
  if (request.schema !== 'origin.transfer-preview-request.v0.1') return fail('REQUEST_SCHEMA_INVALID');
  if (request.sourceWorldRef !== SOURCE || request.proposedDestinationRef !== DESTINATION) return fail('TRANSFER_WORLD_MISMATCH');
  if (!reference(request.priorCrossingRef) || request.priorCrossingRef !== inspection.priorCrossingRef) return fail('TRANSFER_CROSSING_MISMATCH');
  if (typeof request.partyRef !== 'string' || request.partyRef.length < 1 || request.partyRef.length > 128
    || typeof request.anchorRef !== 'string' || request.anchorRef.length < 1 || request.anchorRef.length > 128) return fail('INVALID_PARTY_REF');
  if (!Array.isArray(request.items) || request.items.length < 1 || request.items.length > 32) return fail('INVALID_TRANSFER_ITEMS');
  const seen = new Set<string>();
  const items = request.items.map((raw: unknown) => {
    if (!object(raw) || Object.keys(raw).sort().join('|') !== 'claimScope|evidenceRef|ref|requestedMode|sourceSystem') return fail('UNDECLARED_ITEM_FIELDS');
    const item = raw as unknown as TransferItem;
    if (typeof item.ref !== 'string' || item.ref.length < 1 || item.ref.length > 128 || typeof item.sourceSystem !== 'string' || item.sourceSystem.length < 1
      || typeof item.claimScope !== 'string' || item.claimScope.length < 1 || item.claimScope.length > 128
      || !ITEM_MODES.has(item.requestedMode) || !reference(item.evidenceRef)) return fail('INVALID_TRANSFER_ITEM');
    if (seen.has(item.ref)) return fail('DUPLICATE_ITEM');
    seen.add(item.ref);
    return {ref: item.ref, disposition: classify(item, request.anchorRef as string)};
  });
  return {
    schema: 'full-measure.grace-admission-preview.v0.1' as const,
    manifestRef: GRACE_ORIGIN_WORLD_MANIFEST.worldId,
    entryPolicyRef: GRACE_ORIGIN_WORLD_MANIFEST.entryPolicyRef,
    candidateGateRef: inspection.candidateGateRef,
    partyRef: request.partyRef as string,
    status: 'HOLD' as const,
    admitted: false as const,
    items,
    unresolvedConditions: [...CONDITIONS],
    nonClaims: [...NON_CLAIMS],
  };
}

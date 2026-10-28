/**
 * Full Measure / Commons Return Lens 001.
 *
 * Foreign reLATTE receipt = transport/disposition evidence, not a Deed.
 * Full Measure doesn't mutate Garden/pledge/receipt/capacity models from this.
 */
export type CommonsTransportStatus =
  'HELD' | 'REFUSED' | 'BLOCKED' | 'STORED' | 'ALREADY_STORED';
export interface CommonsPlanReturnSummary {
  schema: 'planz.return-candidate/v0';
  candidateId: string;
  planId: string;
  sourceIssue: string;
  disposition: 'HOLD_FOR_OWNER_REVIEW';
  fieldVerified: false;
  sourceOwnerApproved: false;
  recipientConfirmed: false;
  sentExternally: false;
  authority: 'NONE';
}
export interface CommonsTransportObservation {
  schema: 'relatte.evidence-transit-result/v0';
  crossing_id: string;
  receive_receipt_id: string;
  disposition_receipt_id: string | null;
  status: CommonsTransportStatus;
}
export interface CommonsReturnAssessment {
  schema: 'full-measure.commons-return-assessment/v0';
  kind: 'FOREIGN_OBSERVATION_ONLY';
  planId: string;
  candidateId: string;
  transport: CommonsTransportStatus | 'NOT_RECEIVED';
  stage: 'REFUSED' | 'HELD' | 'REVIEWABLE_CANDIDATE';
  deedsGranted: 0;
  harvestsGranted: 0;
  capacitiesGranted: 0;
  fieldVerified: false;
  nextHumanGate: string;
  missingEvidence: readonly string[];
  disclosure: string;
}
const id=/^planz-return-v0:[a-f0-9]{64}$/;
const source=/^https:\/\/github\.com\/the-static-collective\/[\w.-]+\/issues\/[1-9]\d*$/;
const crossing=/^relatte-crossing-v0:[a-f0-9]{64}$/;
const receipt=/^relatte-receipt-v0:[a-f0-9]{64}$/;

/**
 * This lens deliberately refuses "verified" or "ownerApproved" asserted
 * inside a foreign packet. Cryptography may be independently verified in
 * reLATTE; it still cannot authenticate a human beneficiary.
 */
export function assessCommonsReturn(
  packet: CommonsPlanReturnSummary,
  transport?: CommonsTransportObservation | null,
): CommonsReturnAssessment {
  if (!packet || packet.schema !== 'planz.return-candidate/v0' ||
      !id.test(packet.candidateId ?? '') ||
      typeof packet.planId !== 'string' || !/^[A-Z0-9-]{5,44}$/.test(packet.planId) ||
      !source.test(packet.sourceIssue ?? '') ||
      packet.disposition !== 'HOLD_FOR_OWNER_REVIEW' ||
      packet.fieldVerified !== false || packet.sourceOwnerApproved !== false ||
      packet.recipientConfirmed !== false || packet.sentExternally !== false ||
      packet.authority !== 'NONE') {
    throw new Error('Full Measure refuses foreign claimed authority or invalid candidate');
  }
  if (transport && (transport.schema !== 'relatte.evidence-transit-result/v0' ||
      !crossing.test(transport.crossing_id ?? '') ||
      !receipt.test(transport.receive_receipt_id ?? '') ||
      (transport.disposition_receipt_id !== null &&
       !receipt.test(transport.disposition_receipt_id ?? '')) ||
      !['HELD','REFUSED','BLOCKED','STORED','ALREADY_STORED'].includes(transport.status))) {
    throw new Error('Invalid reLATTE observation summary');
  }
  const status=transport?.status ?? 'NOT_RECEIVED';
  const stage=status==='REFUSED'?'REFUSED':
    status==='STORED'||status==='ALREADY_STORED'?'REVIEWABLE_CANDIDATE':'HELD';
  const nextHumanGate=stage==='REVIEWABLE_CANDIDATE'?
    'A locally authorized source owner must examine consented evidence, separate recipient confirmation, and measurable sustained capacity; foreign admission cannot award Deeds.':
    stage==='REFUSED'?
      'Respect the receiving owner refusal. Do not automatically retry or publish.':
      'Obtain explicit local receiver policy and permission; a signed transport HOLD creates no Deed.';
  return {
    schema:'full-measure.commons-return-assessment/v0',
    kind:'FOREIGN_OBSERVATION_ONLY',
    planId:packet.planId,candidateId:packet.candidateId,transport:status,stage,
    deedsGranted:0,harvestsGranted:0,capacitiesGranted:0,fieldVerified:false,
    nextHumanGate,
    missingEvidence:[
      'locally authenticated and revocable operator permission',
      'separate independent recipient confirmation of the actual benefit',
      'local Garden project and human-authorized pledge/receipt connection',
      'measured before/after capacity with permission to share',
      'source-owner and receiving-owner review of evidence',
    ],
    disclosure:'Foreign packet and receipt remain unverified claims. No Garden/Full Measure mutation or personal achievement is inferred.',
  };
}

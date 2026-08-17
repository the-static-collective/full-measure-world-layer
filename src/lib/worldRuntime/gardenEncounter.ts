export interface GardenEncounterDoor {
  doorRef: string;
  destinationRef: string;
  sourceMode: 'fixture' | 'live';
}

export interface GardenCrossingRefs {
  crossingRef: string;
  confirmationReceiptRef: string;
  testimonyRef: string;
}

export function createGardenCrossingRefs(
  sessionRef: string,
  sequence: number,
): GardenCrossingRefs {
  const normalizedSession = sessionRef.trim();
  if (!normalizedSession) throw new Error('Garden crossing session ref is required');
  if (!Number.isSafeInteger(sequence) || sequence < 0) {
    throw new Error('Garden crossing sequence must be a non-negative safe integer');
  }
  const suffix = String(sequence).padStart(4, '0');
  return {
    crossingRef: `full-measure:crossing:${normalizedSession}:${suffix}`,
    confirmationReceiptRef: `full-measure:confirmation:${normalizedSession}:${suffix}`,
    testimonyRef: `full-measure:testimony:${normalizedSession}:${suffix}`,
  };
}

export function buildGardenEncounterEnvelope(input: {
  testimonyRef: string;
  confirmationReceiptRef: string;
  fieldRef: string;
  door: GardenEncounterDoor;
  traversalFingerprint: string;
}) {
  return {
    protocolVersion: 'p0.exchange/0.1',
    originNodeRef: 'full-measure-world-layer',
    originFrameRef: input.fieldRef,
    originVersionRef: 'boot-the-house/v0.1',
    offered: {
      objectRef: input.testimonyRef,
      mediaType: 'application/vnd.full-measure.crossing-witness+json',
      sourceReceiptRefs: [
        input.confirmationReceiptRef,
        input.traversalFingerprint,
      ],
      disclosureClass: 'public-prototype',
    },
    sourceProvenanceRefs: [
      input.fieldRef,
      input.door.doorRef,
      input.traversalFingerprint,
    ],
    sourceAuthorityRefs: [],
    sourceEpistemicKind: 'witness',
    sourceVerificationState: 'unverified',
    capabilityUsed: 'offer_public_witness',
    limitations: [
      'human-confirmation-local-only',
      input.door.sourceMode === 'fixture' ? 'fixture-door-source' : 'live-door-source',
      'no-source-authority',
      'destination-must-decide-locally',
    ],
  };
}

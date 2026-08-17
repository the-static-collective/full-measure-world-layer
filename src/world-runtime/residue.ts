import type {
  DestinationDisposition,
  WorldEncounterResidue,
  WorldChange,
} from './contracts.js';

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

export function createEncounterResidue(input: {
  residueRef: string;
  sourceFieldRef: WorldEncounterResidue['sourceFieldRef'];
  doorRef: string;
  destinationRef: string;
  rawStrokeRef: string;
  decodingRef: string;
  confirmationReceiptRef: string;
  encounterRef: string;
  destination: DestinationDisposition;
  crossingEvidenceRefs: string[];
}): WorldEncounterResidue {
  if (input.destination.authority !== 'none') {
    throw new Error('destination disposition may not transfer authority into Full Measure residue');
  }

  return {
    residueRef: input.residueRef,
    sourceFieldRef: input.sourceFieldRef,
    doorRef: input.doorRef,
    destinationRef: input.destinationRef,
    rawStrokeRef: input.rawStrokeRef,
    decodingRef: input.decodingRef,
    confirmationReceiptRef: input.confirmationReceiptRef,
    encounterRef: input.encounterRef,
    destinationStatus: input.destination.status,
    authority: 'none',
    evidenceRefs: sortedUnique([
      input.rawStrokeRef,
      input.decodingRef,
      input.confirmationReceiptRef,
      input.encounterRef,
      ...input.crossingEvidenceRefs,
      ...input.destination.evidenceRefs,
    ]),
  };
}

export function projectWorldChange(
  residue: WorldEncounterResidue,
): WorldChange {
  switch (residue.destinationStatus) {
    case 'admitted':
      return {
        kind: 'illumination',
        destinationRef: residue.destinationRef,
        residueRef: residue.residueRef,
      };
    case 'refused':
      return {
        kind: 'boundary-scar',
        destinationRef: residue.destinationRef,
        residueRef: residue.residueRef,
      };
    case 'indeterminate':
      return {
        kind: 'unresolved-fog',
        destinationRef: residue.destinationRef,
        residueRef: residue.residueRef,
      };
    case 'failed':
      return {
        kind: 'operational-failure',
        destinationRef: residue.destinationRef,
        residueRef: residue.residueRef,
      };
  }
}

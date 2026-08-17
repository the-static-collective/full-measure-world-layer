import type {
  CorpusEvaluationPort,
  Project0VerifyPort,
  WorldDoorProjection,
  WorldEncounterOutcomeClass,
  WorldEncounterResidue,
} from './types.js';
import type { WorldResidueStore } from './residue.js';

export interface ConfirmedEncounterInput {
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  confirmationReceiptRef: string;
  traversalEvidenceRefs: string[];
  encounterRef: string;
  encounterBody: unknown;
  destinationSubjectRef?: string;
  input: string;
}

export interface ConfirmedEncounterResult {
  status: WorldEncounterOutcomeClass;
  destinationInvoked: boolean;
  residue: WorldEncounterResidue;
}

export function createBootHouseOrchestrator(deps: {
  doors: WorldDoorProjection[];
  residueStore: WorldResidueStore;
  project0: Project0VerifyPort;
  corpus: CorpusEvaluationPort;
}) {
  const doorsByRef = new Map(deps.doors.map((door) => [door.doorRef, door]));

  return {
    async confirmEncounter(input: ConfirmedEncounterInput): Promise<ConfirmedEncounterResult> {
      const door = doorsByRef.get(input.doorRef);
      if (!door) {
        throw new Error('crossing requires a declared door');
      }
      if (
        door.destinationRef !== 'corpus-os:casework-v0.1' ||
        door.requiredCrossingProfile !== 'casework.synthetic-echo/v0.1'
      ) {
        throw new Error('declared door has no compatible destination adapter');
      }

      const baseEvidenceRefs = [
        ...input.traversalEvidenceRefs,
        input.confirmationReceiptRef,
        input.encounterRef,
        ...door.provenanceRefs,
      ];

      const verification = await deps.project0.verify(input.encounterRef, input.encounterBody);
      if (!verification.ok) {
        const residue = deps.residueStore.append({
          sourceFieldRef: input.sourceFieldRef,
          doorRef: input.doorRef,
          crossingRef: input.crossingRef,
          outcomeClass: 'validation-failed',
          evidenceRefs: baseEvidenceRefs,
          unresolvedRefs: [verification.code],
          returnRefs: [],
          constitutedDestinationRefs: [],
        });
        return {
          status: 'validation-failed',
          destinationInvoked: false,
          residue,
        };
      }

      const verifiedEncounterRef = verification.value.record.ref;
      const destination = await deps.corpus.evaluate({
        envelopeRef: verifiedEncounterRef,
        destinationSubjectRef: input.destinationSubjectRef,
        input: input.input,
      });

      if (!destination.ok) {
        const residue = deps.residueStore.append({
          sourceFieldRef: input.sourceFieldRef,
          doorRef: input.doorRef,
          crossingRef: input.crossingRef,
          outcomeClass: 'failed',
          evidenceRefs: [...baseEvidenceRefs, verifiedEncounterRef],
          unresolvedRefs: [destination.code],
          returnRefs: [],
          constitutedDestinationRefs: [],
        });
        return {
          status: 'failed',
          destinationInvoked: true,
          residue,
        };
      }

      const disposition = destination.value;
      const status = disposition.status;
      const residue = deps.residueStore.append({
        sourceFieldRef: input.sourceFieldRef,
        doorRef: input.doorRef,
        crossingRef: input.crossingRef,
        outcomeClass: status,
        evidenceRefs: [
          ...baseEvidenceRefs,
          verifiedEncounterRef,
          ...disposition.evidenceRefs,
        ],
        unresolvedRefs: status === 'admitted' ? [] : [disposition.reasonCode],
        returnRefs: disposition.receiptRequestId
          ? [`corpus-receipt:${disposition.receiptRequestId}`]
          : [],
        constitutedDestinationRefs: status === 'admitted'
          ? [...disposition.outputRefs]
          : [],
      });

      return {
        status,
        destinationInvoked: true,
        residue,
      };
    },
  };
}

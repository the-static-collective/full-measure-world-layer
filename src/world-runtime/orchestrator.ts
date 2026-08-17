import {
  type ConfirmCrossingRequest,
  type ConfirmCrossingResult,
  type DestinationPort,
  type EncounterPort,
  type RawTraversalStroke,
  type TraversalDecodingProjection,
  type TraversalPort,
  type WorldDoorProjection,
  type WorldEncounterResidue,
  type WorldFieldProjection,
} from './contracts.js';
import { assertBoundedWorldDoors, cloneWorldDoors } from './doors.js';
import { createEncounterResidue, projectWorldChange } from './residue.js';

export type {
  ConfirmCrossingRequest,
  ConfirmCrossingResult,
  DestinationPort,
  EncounterPort,
  RawTraversalStroke,
  TraversalDecodingProjection,
  TraversalPort,
  WorldDoorProjection,
  WorldFieldProjection,
} from './contracts.js';

interface PendingTraversal {
  pendingId: string;
  stroke: RawTraversalStroke;
  decoding: TraversalDecodingProjection;
}

export interface WorldRuntimeOptions {
  doors: WorldDoorProjection[];
  traversal: TraversalPort;
  encounter: EncounterPort;
  destination: DestinationPort;
}

export interface WorldRuntime {
  getField(): WorldFieldProjection;
  getResidue(residueRef: string): WorldEncounterResidue | undefined;
  decodeStroke(stroke: RawTraversalStroke): Promise<{
    kind: 'confirmation-required';
    pendingId: string;
    decoding: TraversalDecodingProjection;
  }>;
  confirmCrossing(request: ConfirmCrossingRequest): Promise<ConfirmCrossingResult>;
}

function cloneField(field: WorldFieldProjection): WorldFieldProjection {
  return {
    ...field,
    doors: cloneWorldDoors(field.doors),
    admittedDestinationRefs: [...field.admittedDestinationRefs],
    visibleResidueRefs: [...field.visibleResidueRefs],
  };
}

function cloneResidue(residue: WorldEncounterResidue): WorldEncounterResidue {
  return {
    ...residue,
    evidenceRefs: [...residue.evidenceRefs],
  };
}

function assertTraversalDecoding(
  decoding: TraversalDecodingProjection,
  doors: readonly WorldDoorProjection[],
): void {
  if (decoding.authority !== 'none') {
    throw new Error('traversal decoding may not carry authority');
  }
  if (!decoding.decodingRef) {
    throw new Error('traversal decoding must carry an evidence ref');
  }

  const knownDoors = new Set(doors.map((door) => door.doorRef));
  const candidateDoors = new Set(decoding.candidates.map((candidate) => candidate.doorRef));
  if (decoding.candidates.length === 0) {
    throw new Error('traversal decoding must return at least one candidate');
  }
  for (const candidate of decoding.candidates) {
    if (!knownDoors.has(candidate.doorRef)) {
      throw new Error(`traversal decoding references unknown door ${candidate.doorRef}`);
    }
    if (!Number.isFinite(candidate.totalCost) || candidate.totalCost < 0) {
      throw new Error('traversal candidate cost must be a non-negative finite number');
    }
  }
  if (decoding.ambiguity.leadingDoorRefs.length === 0) {
    throw new Error('traversal decoding must declare at least one leading door');
  }
  for (const doorRef of decoding.ambiguity.leadingDoorRefs) {
    if (!candidateDoors.has(doorRef)) {
      throw new Error(`leading traversal door ${doorRef} is not a candidate`);
    }
  }
}

export function createWorldRuntime(options: WorldRuntimeOptions): WorldRuntime {
  assertBoundedWorldDoors(options.doors);
  const doors = cloneWorldDoors(options.doors);
  const doorByRef = new Map(doors.map((door) => [door.doorRef, door]));

  const field: WorldFieldProjection = {
    fieldRef: 'full-measure:garden/world-field/v0.1',
    projectionVersion: 'full-measure.world-field/v0.1',
    doors,
    admittedDestinationRefs: [],
    visibleResidueRefs: [],
  };

  const pending = new Map<string, PendingTraversal>();
  const residues = new Map<string, WorldEncounterResidue>();
  let pendingSequence = 0;
  let confirmationSequence = 0;
  let residueSequence = 0;

  return {
    getField(): WorldFieldProjection {
      return cloneField(field);
    },

    getResidue(residueRef: string): WorldEncounterResidue | undefined {
      const residue = residues.get(residueRef);
      return residue ? cloneResidue(residue) : undefined;
    },

    async decodeStroke(stroke: RawTraversalStroke) {
      if (!stroke.rawStrokeRef || stroke.points.length < 2) {
        throw new Error('raw traversal stroke is incomplete');
      }

      const decoding = await options.traversal.decode({
        stroke: {
          rawStrokeRef: stroke.rawStrokeRef,
          points: stroke.points.map((point) => ({ ...point })),
        },
        doors: cloneWorldDoors(doors),
      });
      assertTraversalDecoding(decoding, doors);

      pendingSequence += 1;
      const pendingId = `full-measure:pending-traversal:${pendingSequence}`;
      pending.set(pendingId, {
        pendingId,
        stroke: {
          rawStrokeRef: stroke.rawStrokeRef,
          points: stroke.points.map((point) => ({ ...point })),
        },
        decoding: {
          ...decoding,
          candidates: decoding.candidates.map((candidate) => ({ ...candidate })),
          ambiguity: {
            ...decoding.ambiguity,
            leadingDoorRefs: [...decoding.ambiguity.leadingDoorRefs],
          },
        },
      });

      return {
        kind: 'confirmation-required' as const,
        pendingId,
        decoding,
      };
    },

    async confirmCrossing(request: ConfirmCrossingRequest): Promise<ConfirmCrossingResult> {
      const traversal = pending.get(request.pendingId);
      if (!traversal) {
        throw new Error('pending traversal not found');
      }
      pending.delete(request.pendingId);

      if (!request.confirmed) {
        return { kind: 'declined' };
      }

      const door = doorByRef.get(request.doorRef);
      if (!door) {
        throw new Error('confirmed door is not part of the current field');
      }
      if (!traversal.decoding.ambiguity.leadingDoorRefs.includes(request.doorRef)) {
        throw new Error('confirmed door is not a leading traversal candidate');
      }
      if (door.reachability !== 'reachable') {
        throw new Error('confirmed door is not currently reachable');
      }
      if (!request.confirmedBy.trim()) {
        throw new Error('crossing confirmation requires an actor');
      }

      confirmationSequence += 1;
      const confirmationReceiptRef = `full-measure:crossing-confirmation:${confirmationSequence}`;
      const confirmedIntent = {
        sourceFieldRef: field.fieldRef,
        destinationDoorRef: door.doorRef,
        destinationRef: door.destinationRef,
        traversalEvidenceRefs: [
          traversal.stroke.rawStrokeRef,
          traversal.decoding.decodingRef,
        ],
        offeredWitnessRefs: [...request.offeredWitnessRefs],
        confirmedBy: request.confirmedBy,
        confirmationReceiptRef,
      };

      const prepared = await options.encounter.prepare(confirmedIntent);
      if (prepared.status === 'validation-failed') {
        return {
          kind: 'validation-failed',
          reasonCode: prepared.reasonCode,
          evidenceRefs: [...prepared.evidenceRefs],
        };
      }

      const destination = await options.destination.evaluate({
        encounterRef: prepared.encounterRef,
        encounter: prepared.encounter,
        door: {
          ...door,
          provenanceRefs: [...door.provenanceRefs],
          relevanceReasons: [...door.relevanceReasons],
        },
      });
      if (destination.authority !== 'none') {
        throw new Error('destination result attempted to carry authority into Full Measure');
      }

      residueSequence += 1;
      const residue = createEncounterResidue({
        residueRef: `full-measure:world-encounter-residue:${residueSequence}`,
        sourceFieldRef: field.fieldRef,
        doorRef: door.doorRef,
        destinationRef: door.destinationRef,
        rawStrokeRef: traversal.stroke.rawStrokeRef,
        decodingRef: traversal.decoding.decodingRef,
        confirmationReceiptRef,
        encounterRef: prepared.encounterRef,
        destination,
        crossingEvidenceRefs: prepared.evidenceRefs,
      });
      const worldChange = projectWorldChange(residue);

      residues.set(residue.residueRef, cloneResidue(residue));
      field.visibleResidueRefs = [...new Set([...field.visibleResidueRefs, residue.residueRef])];
      if (destination.status === 'admitted') {
        field.admittedDestinationRefs = [
          ...new Set([...field.admittedDestinationRefs, door.destinationRef]),
        ];
      }

      return {
        kind: 'terminal',
        residue: cloneResidue(residue),
        worldChange,
      };
    },
  };
}

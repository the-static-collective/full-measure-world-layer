import type {
  WorldDoorProjection,
  WorldEncounterResidue,
} from '../worldRuntime/types.js';

const ORIENTATION_POLICY = 'full-measure/stride-orientation-fixture/v0.1' as const;
const MAX_ATTEMPTED_STEPS = 2;

export type StrideErrorCode =
  | 'STRIDE_STEP_LIMIT_REACHED'
  | 'STRIDE_STALE_STANCE'
  | 'STRIDE_DOOR_NOT_EXPOSED'
  | 'STRIDE_CONFIRMATION_REQUIRED'
  | 'STRIDE_CONFIRMATION_REUSED'
  | 'STRIDE_RESIDUE_MISMATCH'
  | 'STRIDE_ILLEGAL_CONSTITUTED_REFS'
  | 'STRIDE_UNKNOWN_POSITION';

export class StrideSpecimenError extends Error {
  constructor(public readonly code: StrideErrorCode) {
    super(code);
    this.name = 'StrideSpecimenError';
  }
}

export interface StrideStance {
  stanceRef: string;
  fieldRef: string;
  positionRef: string;
  residueRefs: string[];
  exposedDoorRefs: string[];
  orientationPolicy: typeof ORIENTATION_POLICY;
  authority: 'none';
}

export interface StrideFootprint {
  footprintRef: string;
  sourceStanceRef: string;
  doorRef: string;
  destinationRef: string;
  crossingRef: string;
  confirmationRef: string;
  outcomeClass: WorldEncounterResidue['outcomeClass'];
  residueRef: string;
  constitutedRefsAdded: string[];
  authority: 'none';
}

export interface StrideWitness {
  witnessRef: string;
  stanceBeforeRef: string;
  footprint: StrideFootprint;
  stanceAfterRef: string;
  authority: 'none';
}

export interface StrideStepInput {
  stanceRef: string;
  doorRef: string;
  crossingRef: string;
  confirmationRef: string;
  residue: WorldEncounterResidue;
}

interface OrientationFixture {
  positionRef: string;
  fieldRef: string;
  doors: WorldDoorProjection[];
}

function fixtureDoor(from: string, to: string): WorldDoorProjection {
  return {
    doorRef: `stride-door:${from}-${to}`,
    destinationRef: `stride-position:${to}`,
    relation: 'stride-specimen-local-neighbor',
    reachability: 'reachable',
    provenanceRefs: ['full-measure:stride-specimen-001'],
    relevanceReasons: [`declared local orientation ${from} -> ${to}`],
    requiredCrossingProfile: 'stride-specimen-fixture/v0.1',
    authority: 'none',
    sourceMode: 'fixture',
  };
}

const ORIENTATIONS: ReadonlyMap<string, OrientationFixture> = new Map([
  ['stride-position:A', {
    positionRef: 'stride-position:A',
    fieldRef: 'stride-field:A',
    doors: [
      fixtureDoor('A', 'B'),
      fixtureDoor('A', 'C'),
      fixtureDoor('A', 'D'),
    ],
  }],
  ['stride-position:B', {
    positionRef: 'stride-position:B',
    fieldRef: 'stride-field:B',
    doors: [
      fixtureDoor('B', 'C'),
      fixtureDoor('B', 'E'),
      fixtureDoor('B', 'F'),
    ],
  }],
  ['stride-position:C', {
    positionRef: 'stride-position:C',
    fieldRef: 'stride-field:C',
    doors: [],
  }],
  ['stride-position:D', {
    positionRef: 'stride-position:D',
    fieldRef: 'stride-field:D',
    doors: [],
  }],
  ['stride-position:E', {
    positionRef: 'stride-position:E',
    fieldRef: 'stride-field:E',
    doors: [
      fixtureDoor('E', 'A'),
      fixtureDoor('E', 'F'),
    ],
  }],
  ['stride-position:F', {
    positionRef: 'stride-position:F',
    fieldRef: 'stride-field:F',
    doors: [],
  }],
]);

function localRef(kind: 'stance' | 'footprint' | 'witness', parts: string[]): string {
  const encoded = parts.map((part) => encodeURIComponent(part)).join(':');
  return `stride-local:${kind}:${encoded}`;
}

function cloneStance(stance: StrideStance): StrideStance {
  return {
    ...stance,
    residueRefs: [...stance.residueRefs],
    exposedDoorRefs: [...stance.exposedDoorRefs],
  };
}

function cloneFootprint(footprint: StrideFootprint): StrideFootprint {
  return {
    ...footprint,
    constitutedRefsAdded: [...footprint.constitutedRefsAdded],
  };
}

function cloneWitness(witness: StrideWitness): StrideWitness {
  return {
    ...witness,
    footprint: cloneFootprint(witness.footprint),
  };
}

function deriveStance(
  positionRef: string,
  residueRefs: string[],
  completedStepCount: number,
): StrideStance {
  const orientation = ORIENTATIONS.get(positionRef);
  if (!orientation) {
    throw new StrideSpecimenError('STRIDE_UNKNOWN_POSITION');
  }

  return {
    stanceRef: localRef('stance', [
      String(completedStepCount),
      positionRef,
      ...residueRefs,
    ]),
    fieldRef: orientation.fieldRef,
    positionRef: orientation.positionRef,
    residueRefs: [...residueRefs],
    exposedDoorRefs: orientation.doors.map((door) => door.doorRef),
    orientationPolicy: ORIENTATION_POLICY,
    authority: 'none',
  };
}

function matchingDoor(stance: StrideStance, doorRef: string): WorldDoorProjection | undefined {
  const orientation = ORIENTATIONS.get(stance.positionRef);
  return orientation?.doors.find((door) => door.doorRef === doorRef);
}

function validateResidue(
  input: StrideStepInput,
  stance: StrideStance,
): void {
  const { residue } = input;
  if (
    residue.sourceFieldRef !== stance.fieldRef ||
    residue.doorRef !== input.doorRef ||
    residue.crossingRef !== input.crossingRef
  ) {
    throw new StrideSpecimenError('STRIDE_RESIDUE_MISMATCH');
  }

  if (
    residue.outcomeClass !== 'admitted' &&
    residue.constitutedDestinationRefs.length > 0
  ) {
    throw new StrideSpecimenError('STRIDE_ILLEGAL_CONSTITUTED_REFS');
  }
}

export function createStrideSpecimenSession() {
  let stance = deriveStance('stride-position:A', [], 0);
  const witnesses: StrideWitness[] = [];
  const usedConfirmationRefs = new Set<string>();

  return {
    getStance(): StrideStance {
      return cloneStance(stance);
    },

    getWitnesses(): StrideWitness[] {
      return witnesses.map(cloneWitness);
    },

    takeStep(input: StrideStepInput): StrideWitness {
      if (witnesses.length >= MAX_ATTEMPTED_STEPS) {
        throw new StrideSpecimenError('STRIDE_STEP_LIMIT_REACHED');
      }
      if (input.stanceRef !== stance.stanceRef) {
        throw new StrideSpecimenError('STRIDE_STALE_STANCE');
      }

      const door = matchingDoor(stance, input.doorRef);
      if (!door) {
        throw new StrideSpecimenError('STRIDE_DOOR_NOT_EXPOSED');
      }
      if (input.confirmationRef.trim().length === 0) {
        throw new StrideSpecimenError('STRIDE_CONFIRMATION_REQUIRED');
      }
      if (usedConfirmationRefs.has(input.confirmationRef)) {
        throw new StrideSpecimenError('STRIDE_CONFIRMATION_REUSED');
      }

      validateResidue(input, stance);

      const ordinal = witnesses.length + 1;
      const stanceBefore = stance;
      const positionAfter = input.residue.outcomeClass === 'admitted'
        ? door.destinationRef
        : stanceBefore.positionRef;
      const residueRefsAfter = [
        ...stanceBefore.residueRefs,
        input.residue.residueRef,
      ];
      const stanceAfter = deriveStance(positionAfter, residueRefsAfter, ordinal);
      const footprint: StrideFootprint = {
        footprintRef: localRef('footprint', [
          String(ordinal),
          input.crossingRef,
          input.residue.residueRef,
        ]),
        sourceStanceRef: stanceBefore.stanceRef,
        doorRef: door.doorRef,
        destinationRef: door.destinationRef,
        crossingRef: input.crossingRef,
        confirmationRef: input.confirmationRef,
        outcomeClass: input.residue.outcomeClass,
        residueRef: input.residue.residueRef,
        constitutedRefsAdded: input.residue.outcomeClass === 'admitted'
          ? [...input.residue.constitutedDestinationRefs]
          : [],
        authority: 'none',
      };
      const witness: StrideWitness = {
        witnessRef: localRef('witness', [
          String(ordinal),
          stanceBefore.stanceRef,
          footprint.footprintRef,
          stanceAfter.stanceRef,
        ]),
        stanceBeforeRef: stanceBefore.stanceRef,
        footprint,
        stanceAfterRef: stanceAfter.stanceRef,
        authority: 'none',
      };

      usedConfirmationRefs.add(input.confirmationRef);
      witnesses.push(witness);
      stance = stanceAfter;

      return cloneWitness(witness);
    },
  };
}

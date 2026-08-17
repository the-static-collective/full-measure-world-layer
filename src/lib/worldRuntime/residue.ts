import type {
  WorldEncounterResidue,
  WorldEncounterResidueInput,
} from './types.js';

function cloneResidue(residue: WorldEncounterResidue): WorldEncounterResidue {
  return {
    ...residue,
    evidenceRefs: [...residue.evidenceRefs],
    unresolvedRefs: [...residue.unresolvedRefs],
    returnRefs: [...residue.returnRefs],
    constitutedDestinationRefs: [...residue.constitutedDestinationRefs],
  };
}

export function createWorldResidueStore() {
  const records: WorldEncounterResidue[] = [];

  return {
    append(input: WorldEncounterResidueInput): WorldEncounterResidue {
      if (
        input.outcomeClass !== 'admitted' &&
        input.constitutedDestinationRefs.length > 0
      ) {
        throw new Error('only admitted encounters may constitute destination refs');
      }

      const residue: WorldEncounterResidue = {
        residueRef: `world-residue:${String(records.length + 1).padStart(6, '0')}`,
        sourceFieldRef: input.sourceFieldRef,
        doorRef: input.doorRef,
        crossingRef: input.crossingRef,
        outcomeClass: input.outcomeClass,
        evidenceRefs: [...new Set(input.evidenceRefs)],
        unresolvedRefs: [...new Set(input.unresolvedRefs)],
        returnRefs: [...new Set(input.returnRefs)],
        constitutedDestinationRefs: [...new Set(input.constitutedDestinationRefs)],
      };
      records.push(residue);
      return cloneResidue(residue);
    },

    list(): WorldEncounterResidue[] {
      return records.map(cloneResidue);
    },

    get(residueRef: string): WorldEncounterResidue | undefined {
      const found = records.find((record) => record.residueRef === residueRef);
      return found ? cloneResidue(found) : undefined;
    },
  };
}

export type WorldResidueStore = ReturnType<typeof createWorldResidueStore>;

import { doorRefForTemplate } from './gardenTraversal.js';
import type { WorldDoorProjection } from './types.js';

type GardenSelection =
  | {
      state: 'candidate';
      templateId: string;
      doorRef: string;
      reachability: WorldDoorProjection['reachability'];
      canConfirmCrossing: boolean;
      authority: 'none';
    }
  | {
      state: 'ambiguous';
      leadingTemplateIds: string[];
      canConfirmCrossing: false;
      authority: 'none';
    }
  | {
      state: 'unresolved';
      templateId: string | null;
      canConfirmCrossing: false;
      authority: 'none';
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function selectGardenTraversalCandidate(
  decoding: unknown,
  doors: WorldDoorProjection[],
): GardenSelection {
  if (!isRecord(decoding) || decoding.authority !== 'none') {
    return {
      state: 'unresolved',
      templateId: null,
      canConfirmCrossing: false,
      authority: 'none',
    };
  }

  const ambiguity = decoding.ambiguity;
  if (isRecord(ambiguity) && ambiguity.kind === 'collision') {
    const leaders = Array.isArray(ambiguity.leadingTemplateIds)
      ? ambiguity.leadingTemplateIds.filter((value): value is string => typeof value === 'string')
      : [];
    return {
      state: 'ambiguous',
      leadingTemplateIds: leaders,
      canConfirmCrossing: false,
      authority: 'none',
    };
  }

  const candidates = Array.isArray(decoding.candidates) ? decoding.candidates : [];
  const first = candidates[0];
  const templateId = isRecord(first) && typeof first.templateId === 'string'
    ? first.templateId
    : null;
  if (!templateId) {
    return {
      state: 'unresolved',
      templateId: null,
      canConfirmCrossing: false,
      authority: 'none',
    };
  }

  const doorRef = doorRefForTemplate(templateId);
  if (!doorRef) {
    return {
      state: 'unresolved',
      templateId,
      canConfirmCrossing: false,
      authority: 'none',
    };
  }

  const door = doors.find((candidate) => candidate.doorRef === doorRef);
  if (!door) {
    return {
      state: 'unresolved',
      templateId,
      canConfirmCrossing: false,
      authority: 'none',
    };
  }

  return {
    state: 'candidate',
    templateId,
    doorRef,
    reachability: door.reachability,
    canConfirmCrossing: door.reachability === 'reachable',
    authority: 'none',
  };
}

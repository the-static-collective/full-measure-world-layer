import type { WorldDoorProjection } from './contracts.js';

export function assertBoundedWorldDoors(doors: readonly WorldDoorProjection[]): void {
  if (doors.length !== 3) {
    throw new Error('Boot the House v0.1 requires exactly three nearby doors');
  }

  const doorRefs = new Set<string>();
  for (const door of doors) {
    if (!door.doorRef || !door.destinationRef) {
      throw new Error('world door references must be non-empty');
    }
    if (doorRefs.has(door.doorRef)) {
      throw new Error(`duplicate world door ${door.doorRef}`);
    }
    doorRefs.add(door.doorRef);

    if (door.authority !== 'none') {
      throw new Error(`world door ${door.doorRef} may not carry authority`);
    }
    if (door.evidenceMode !== 'live' && door.evidenceMode !== 'fixture') {
      throw new Error(`world door ${door.doorRef} has unsupported evidence mode`);
    }
  }
}

export function cloneWorldDoors(doors: readonly WorldDoorProjection[]): WorldDoorProjection[] {
  return doors.map((door) => ({
    ...door,
    provenanceRefs: [...door.provenanceRefs],
    relevanceReasons: [...door.relevanceReasons],
  }));
}

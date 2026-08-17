import fs from 'node:fs';
import path from 'node:path';

import {
  createCorpusDestinationPort,
  createProject0EncounterPort,
  createTranchNodeTraversalPort,
  type Project0EncounterSourceProfile,
} from './donorPorts.js';
import { createWorldRuntime, type WorldRuntime } from './orchestrator.js';
import type { JsonProcessCommand } from './processPort.js';
import type { WorldDoorProjection } from './contracts.js';

export type WorldRuntimeUnavailableReason =
  | 'BOOT_HOUSE_DONOR_PATHS_REQUIRED'
  | 'BOOT_HOUSE_DONOR_WORKSPACE_MISSING'
  | 'BOOT_HOUSE_PINNED_SOURCE_REQUIRED';

export const BOOT_HOUSE_DOORS: WorldDoorProjection[] = [
  {
    doorRef: 'door:corpus',
    destinationRef: 'corpus-os:world-encounter:v0.1',
    relation: 'project-backed crossing specimen',
    reachability: 'reachable',
    provenanceRefs: ['fixture:boot-house/nearby-doors/v0.1'],
    relevanceReasons: ['selected v0.1 constitutional destination'],
    requiredCrossingProfile: 'p0.exchange/0.1',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:upper-room',
    destinationRef: 'upper-room:scripture-room',
    relation: 'declared neighboring room',
    reachability: 'unknown',
    provenanceRefs: ['fixture:boot-house/nearby-doors/v0.1'],
    relevanceReasons: ['future inhabited room'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:band-runtime',
    destinationRef: 'band-runtime:groove-room',
    relation: 'declared neighboring room',
    reachability: 'unknown',
    provenanceRefs: ['fixture:boot-house/nearby-doors/v0.1'],
    relevanceReasons: ['future inhabited room'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
];

interface RuntimeCommands {
  traversal: JsonProcessCommand;
  encounter: JsonProcessCommand;
  destination: JsonProcessCommand;
}

export interface UnavailableWorldRuntimeConfiguration {
  available: false;
  reasonCode: WorldRuntimeUnavailableReason;
  doors: WorldDoorProjection[];
}

export interface AvailableWorldRuntimeConfiguration {
  available: true;
  doors: WorldDoorProjection[];
  commands: RuntimeCommands;
  source: Project0EncounterSourceProfile;
  offeredWitnessRef: string;
}

export type ResolvedWorldRuntimeConfiguration =
  | UnavailableWorldRuntimeConfiguration
  | AvailableWorldRuntimeConfiguration;

export type ConfiguredWorldRuntime =
  | UnavailableWorldRuntimeConfiguration
  | (AvailableWorldRuntimeConfiguration & { runtime: WorldRuntime });

function cloneDoors(): WorldDoorProjection[] {
  return BOOT_HOUSE_DOORS.map((door) => ({
    ...door,
    provenanceRefs: [...door.provenanceRefs],
    relevanceReasons: [...door.relevanceReasons],
  }));
}

function isWorkspace(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'package.json'));
}

function command(cwd: string, script: string, timeoutMs: number): JsonProcessCommand {
  const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  return {
    command: npmExecutable,
    args: ['--silent', 'run', script],
    cwd,
    timeoutMs,
    maxInputBytes: 1_048_576,
    maxOutputBytes: 1_048_576,
  };
}

const PINNED_SOURCE = /^github:the-static-collective\/full-measure-world-layer@([0-9a-f]{40})$/;

export function resolveWorldRuntimeConfiguration(
  env: Record<string, string | undefined>,
): ResolvedWorldRuntimeConfiguration {
  const tranch = env.BOOT_HOUSE_TRANCH_DIR?.trim();
  const project0 = env.BOOT_HOUSE_PROJECT0_DIR?.trim();
  const corpus = env.BOOT_HOUSE_CORPUS_DIR?.trim();
  const sourceVersionRef = env.BOOT_HOUSE_SOURCE_VERSION_REF?.trim();

  if (!tranch || !project0 || !corpus) {
    return {
      available: false,
      reasonCode: 'BOOT_HOUSE_DONOR_PATHS_REQUIRED',
      doors: cloneDoors(),
    };
  }

  const directories = [path.resolve(tranch), path.resolve(project0), path.resolve(corpus)];
  if (!directories.every(isWorkspace)) {
    return {
      available: false,
      reasonCode: 'BOOT_HOUSE_DONOR_WORKSPACE_MISSING',
      doors: cloneDoors(),
    };
  }

  if (!sourceVersionRef || !PINNED_SOURCE.test(sourceVersionRef)) {
    return {
      available: false,
      reasonCode: 'BOOT_HOUSE_PINNED_SOURCE_REQUIRED',
      doors: cloneDoors(),
    };
  }

  const [tranchDir, project0Dir, corpusDir] = directories as [string, string, string];
  return {
    available: true,
    doors: cloneDoors(),
    commands: {
      traversal: command(tranchDir, 'intent-stroke:stdio', 15_000),
      encounter: command(project0Dir, 'world-encounter:stdio', 60_000),
      destination: command(corpusDir, 'world-encounter:stdio', 60_000),
    },
    source: {
      originNodeRef: 'full-measure-world-layer',
      originVersionRef: sourceVersionRef,
      disclosureClass: 'public',
      sourceEpistemicKind: 'source',
      sourceVerificationState: 'verified',
    },
    offeredWitnessRef: `${sourceVersionRef}:README.md`,
  };
}

export function createConfiguredWorldRuntime(
  env: Record<string, string | undefined>,
): ConfiguredWorldRuntime {
  const config = resolveWorldRuntimeConfiguration(env);
  if (config.available === false) return config;

  const traversal = createTranchNodeTraversalPort({
    command: config.commands.traversal,
    layout: {
      anchors: [
        { id: 'garden', x: 100_000, y: 500_000 },
        { id: 'door:corpus', x: 900_000, y: 500_000 },
        { id: 'door:upper-room', x: 500_000, y: 100_000 },
        { id: 'door:band-runtime', x: 500_000, y: 900_000 },
      ],
    },
  });
  const encounter = createProject0EncounterPort({
    command: config.commands.encounter,
    source: config.source,
  });
  const destination = createCorpusDestinationPort({
    command: config.commands.destination,
  });

  return {
    ...config,
    runtime: createWorldRuntime({
      doors: config.doors,
      traversal,
      encounter,
      destination,
    }),
  };
}

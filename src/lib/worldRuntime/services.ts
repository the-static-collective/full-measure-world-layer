import { createCorpusAdapter } from './corpusAdapter.js';
import { getFixtureDoorProjection, getFixtureWorldField } from './fixtureDoorSource.js';
import { createBootHouseOrchestrator, type ConfirmedEncounterInput } from './orchestrator.js';
import {
  resolveDonorProcessConfig,
  invokeJsonProcess,
  type JsonProcessInvoker,
} from './processAdapter.js';
import { createProject0Adapter } from './project0Adapter.js';
import { createWorldResidueStore } from './residue.js';
import { createTranchNodeAdapter } from './tranchnodeAdapter.js';

interface StrokeDecodeInput {
  stroke: unknown;
  layout: unknown;
  templates: unknown[];
  decoder: unknown;
}

type UnavailableDonor = 'tranchnode' | 'project0' | 'corpus-os';
type UnavailableResult = { ok: false; kind: 'unavailable'; donor: UnavailableDonor };
type ApplicationFailure = { ok: false; kind: 'application'; code: string };

export function createWorldRuntimeServices(
  env: Record<string, string | undefined> = process.env,
  platform: NodeJS.Platform = process.platform,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  const tranchnodeCommand = resolveDonorProcessConfig('tranchnode', env, platform);
  const project0Command = resolveDonorProcessConfig('project0', env, platform);
  const corpusCommand = resolveDonorProcessConfig('corpus-os', env, platform);

  const tranchnode = tranchnodeCommand
    ? createTranchNodeAdapter(tranchnodeCommand, invoke)
    : null;
  const project0 = project0Command
    ? createProject0Adapter(project0Command, invoke)
    : null;
  const corpus = corpusCommand
    ? createCorpusAdapter(corpusCommand, invoke)
    : null;

  const doors = getFixtureDoorProjection();
  const residueStore = createWorldResidueStore();
  const orchestrator = project0 && corpus
    ? createBootHouseOrchestrator({
        doors,
        residueStore,
        project0,
        corpus,
      })
    : null;

  return {
    availability() {
      return {
        tranchnode: tranchnode !== null,
        project0: project0 !== null,
        corpusOs: corpus !== null,
      };
    },

    getField() {
      return getFixtureWorldField();
    },

    getDoors() {
      return getFixtureDoorProjection();
    },

    async decodeStroke(input: StrokeDecodeInput) {
      if (!tranchnode) {
        return { ok: false, kind: 'unavailable', donor: 'tranchnode' } as const;
      }
      return await tranchnode.decode(input);
    },

    async prepareEncounter(body: unknown) {
      if (!project0) {
        return { ok: false, kind: 'unavailable', donor: 'project0' } as const;
      }
      return await project0.address(body);
    },

    async confirmEncounter(
      input: ConfirmedEncounterInput,
    ): Promise<
      | { ok: true; value: Awaited<ReturnType<NonNullable<typeof orchestrator>['confirmEncounter']>> }
      | UnavailableResult
      | ApplicationFailure
    > {
      if (!project0) {
        return { ok: false, kind: 'unavailable', donor: 'project0' };
      }
      if (!corpus || !orchestrator) {
        return { ok: false, kind: 'unavailable', donor: 'corpus-os' };
      }
      try {
        return { ok: true, value: await orchestrator.confirmEncounter(input) };
      } catch (error: unknown) {
        return {
          ok: false,
          kind: 'application',
          code: error instanceof Error ? error.message : 'WORLD_ENCOUNTER_APPLICATION_FAILURE',
        };
      }
    },

    getResidue(residueRef: string) {
      return residueStore.get(residueRef);
    },

    listResidues() {
      return residueStore.list();
    },
  };
}

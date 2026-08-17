import type { ConfirmedEncounterInput } from './orchestrator.js';
import type { createWorldRuntimeServices } from './services.js';

type WorldRuntimeServices = ReturnType<typeof createWorldRuntimeServices>;

export interface WorldRuntimeHttpResult {
  status: number;
  body: unknown;
}

function adapterHttpStatus(result: { ok: boolean; kind?: string }): number {
  if (result.ok) return 200;
  switch (result.kind) {
    case 'unavailable':
      return 503;
    case 'transport':
    case 'contract':
      return 502;
    case 'donor':
      return 422;
    case 'application':
      return 400;
    default:
      return 500;
  }
}

export function createWorldRuntimeHttpHandlers(services: WorldRuntimeServices) {
  return {
    async field(): Promise<WorldRuntimeHttpResult> {
      return {
        status: 200,
        body: {
          field: services.getField(),
          availability: services.availability(),
        },
      };
    },

    async doors(): Promise<WorldRuntimeHttpResult> {
      return {
        status: 200,
        body: {
          doors: services.getDoors(),
          availability: services.availability(),
        },
      };
    },

    async decode(body: {
      stroke: unknown;
      layout: unknown;
      templates: unknown[];
      decoder: unknown;
    }): Promise<WorldRuntimeHttpResult> {
      const result = await services.decodeStroke(body);
      return { status: adapterHttpStatus(result), body: result };
    },

    async prepare(body: unknown): Promise<WorldRuntimeHttpResult> {
      const result = await services.prepareEncounter(body);
      return { status: adapterHttpStatus(result), body: result };
    },

    async confirm(body: ConfirmedEncounterInput): Promise<WorldRuntimeHttpResult> {
      const result = await services.confirmEncounter(body);
      return { status: adapterHttpStatus(result), body: result };
    },

    async residue(residueRef: string): Promise<WorldRuntimeHttpResult> {
      const residue = services.getResidue(residueRef);
      if (!residue) {
        return {
          status: 404,
          body: {
            error: 'World encounter residue not found',
            residueRef,
          },
        };
      }
      return { status: 200, body: { residue } };
    },
  };
}

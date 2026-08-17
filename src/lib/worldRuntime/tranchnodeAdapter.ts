import {
  invokeJsonProcess,
  type JsonProcessInvoker,
  type ProcessAdapterCommand,
} from './processAdapter.js';
import type { WorldAdapterResult } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function createTranchNodeAdapter(
  command: ProcessAdapterCommand,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  return {
    async decode(input: {
      points: unknown[];
      layout: unknown;
      templates: unknown[];
      decoder: unknown;
    }): Promise<WorldAdapterResult<unknown>> {
      const response = await invoke(command, {
        schema: 'tranchnode/intent-stroke-stdio/v0.2',
        points: input.points,
        layout: input.layout,
        templates: input.templates,
        decoder: input.decoder,
      });

      if (response.ok === false) {
        return { ok: false, kind: 'transport', code: response.kind };
      }
      if (!isRecord(response.value)) {
        return { ok: false, kind: 'contract', code: 'TRANCHNODE_RESPONSE_NOT_OBJECT' };
      }
      if (response.value.schema !== 'tranchnode/intent-stroke-stdio-response/v0.2') {
        return { ok: false, kind: 'contract', code: 'TRANCHNODE_RESPONSE_SCHEMA_MISMATCH' };
      }
      if (response.value.ok === false) {
        const error = response.value.error;
        if (!isRecord(error) || typeof error.code !== 'string') {
          return { ok: false, kind: 'contract', code: 'TRANCHNODE_ERROR_CONTRACT_INVALID' };
        }
        return { ok: false, kind: 'donor', code: error.code };
      }
      if (response.value.ok !== true || !('decoding' in response.value)) {
        return { ok: false, kind: 'contract', code: 'TRANCHNODE_SUCCESS_CONTRACT_INVALID' };
      }
      return { ok: true, value: response.value.decoding };
    },
  };
}

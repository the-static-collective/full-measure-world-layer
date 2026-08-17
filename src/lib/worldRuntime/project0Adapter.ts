import {
  invokeJsonProcess,
  type JsonProcessInvoker,
  type ProcessAdapterCommand,
} from './processAdapter.js';
import type { WorldAdapterResult } from './types.js';

interface Project0Record {
  ref: string;
  digestHex?: string;
  recordType?: string;
  body: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function invokeProject0(
  command: ProcessAdapterCommand,
  invoke: JsonProcessInvoker,
  request: Record<string, unknown>,
  expectedOperation: 'address' | 'verify',
): Promise<WorldAdapterResult<{ operation: 'address' | 'verify'; record: Project0Record }>> {
  const response = await invoke(command, request);
  if (!response.ok) {
    return { ok: false, kind: 'transport', code: response.kind };
  }
  if (!isRecord(response.value)) {
    return { ok: false, kind: 'contract', code: 'PROJECT0_RESPONSE_NOT_OBJECT' };
  }
  if (response.value.schema !== 'project0/world-encounter-stdio-response/v0.1') {
    return { ok: false, kind: 'contract', code: 'PROJECT0_RESPONSE_SCHEMA_MISMATCH' };
  }
  if (response.value.ok === false) {
    const error = response.value.error;
    if (!isRecord(error) || typeof error.code !== 'string') {
      return { ok: false, kind: 'contract', code: 'PROJECT0_ERROR_CONTRACT_INVALID' };
    }
    return { ok: false, kind: 'donor', code: error.code };
  }
  if (
    response.value.ok !== true ||
    response.value.operation !== expectedOperation ||
    !isRecord(response.value.record) ||
    typeof response.value.record.ref !== 'string' ||
    !('body' in response.value.record)
  ) {
    return { ok: false, kind: 'contract', code: 'PROJECT0_SUCCESS_CONTRACT_INVALID' };
  }

  return {
    ok: true,
    value: {
      operation: expectedOperation,
      record: {
        ref: response.value.record.ref,
        digestHex: typeof response.value.record.digestHex === 'string'
          ? response.value.record.digestHex
          : undefined,
        recordType: typeof response.value.record.recordType === 'string'
          ? response.value.record.recordType
          : undefined,
        body: response.value.record.body,
      },
    },
  };
}

export function createProject0Adapter(
  command: ProcessAdapterCommand,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  return {
    async address(body: unknown): Promise<WorldAdapterResult<{ operation: 'address'; record: Project0Record }>> {
      const result = await invokeProject0(command, invoke, {
        schema: 'project0/world-encounter-stdio/v0.1',
        operation: 'address',
        recordType: 'exchange_envelope',
        body,
      }, 'address');
      if (!result.ok) return result;
      return { ok: true, value: { operation: 'address', record: result.value.record } };
    },

    async verify(
      expectedRef: string,
      body: unknown,
    ): Promise<WorldAdapterResult<{ operation: 'verify'; record: Project0Record }>> {
      const result = await invokeProject0(command, invoke, {
        schema: 'project0/world-encounter-stdio/v0.1',
        operation: 'verify',
        recordType: 'exchange_envelope',
        expectedRef,
        body,
      }, 'verify');
      if (!result.ok) return result;
      return { ok: true, value: { operation: 'verify', record: result.value.record } };
    },
  };
}

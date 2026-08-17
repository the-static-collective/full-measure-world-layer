import {
  invokeJsonProcess,
  type JsonProcessInvoker,
  type ProcessAdapterCommand,
} from './processAdapter.js';
import type {
  CorpusDisposition,
  CorpusEvaluationRequest,
  WorldAdapterResult,
} from './types.js';

const DESTINATION_FRAME = 'corpus-os:casework-v0.1';
const DESTINATION_PROFILE = 'casework.synthetic-echo/v0.1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseDisposition(value: unknown): CorpusDisposition | null {
  if (!isRecord(value)) return null;
  if (!['admitted', 'refused', 'indeterminate', 'failed'].includes(String(value.status))) return null;
  if (
    typeof value.reasonCode !== 'string' ||
    typeof value.destinationFrameRef !== 'string' ||
    typeof value.envelopeRef !== 'string' ||
    value.authorityTransfer !== 'none' ||
    value.callerAuthenticated !== false ||
    !isStringArray(value.evidenceRefs) ||
    !isStringArray(value.outputRefs)
  ) {
    return null;
  }

  return {
    status: value.status as CorpusDisposition['status'],
    reasonCode: value.reasonCode,
    destinationFrameRef: value.destinationFrameRef,
    envelopeRef: value.envelopeRef,
    evidenceRefs: [...value.evidenceRefs],
    outputRefs: [...value.outputRefs],
    authorityTransfer: 'none',
    callerAuthenticated: false,
    legalValidity: value.legalValidity === 'unclaimed' ? 'unclaimed' : undefined,
    receiptRequestId: typeof value.receiptRequestId === 'string'
      ? value.receiptRequestId
      : undefined,
  };
}

export function createCorpusAdapter(
  command: ProcessAdapterCommand,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  return {
    async evaluate(
      input: CorpusEvaluationRequest,
    ): Promise<WorldAdapterResult<CorpusDisposition>> {
      const response = await invoke(command, {
        schema: 'corpus-os/world-encounter-admission/v0.1',
        envelopeRef: input.envelopeRef,
        destinationFrameRef: DESTINATION_FRAME,
        profile: DESTINATION_PROFILE,
        destinationSubjectRef: input.destinationSubjectRef,
        input: input.input,
      });

      if (response.ok === false) {
        return { ok: false, kind: 'transport', code: response.kind };
      }
      if (!isRecord(response.value)) {
        return { ok: false, kind: 'contract', code: 'CORPUS_RESPONSE_NOT_OBJECT' };
      }
      if (response.value.schema !== 'corpus-os/world-encounter-stdio-response/v0.1') {
        return { ok: false, kind: 'contract', code: 'CORPUS_RESPONSE_SCHEMA_MISMATCH' };
      }
      if (response.value.ok === false) {
        const error = response.value.error;
        if (!isRecord(error) || typeof error.code !== 'string') {
          return { ok: false, kind: 'contract', code: 'CORPUS_ERROR_CONTRACT_INVALID' };
        }
        return { ok: false, kind: 'donor', code: error.code };
      }
      if (response.value.ok !== true) {
        return { ok: false, kind: 'contract', code: 'CORPUS_SUCCESS_CONTRACT_INVALID' };
      }

      const disposition = parseDisposition(response.value.result);
      if (!disposition) {
        return { ok: false, kind: 'contract', code: 'CORPUS_DISPOSITION_CONTRACT_INVALID' };
      }
      if (
        disposition.destinationFrameRef !== DESTINATION_FRAME ||
        disposition.envelopeRef !== input.envelopeRef
      ) {
        return { ok: false, kind: 'contract', code: 'CORPUS_DISPOSITION_IDENTITY_MISMATCH' };
      }

      return { ok: true, value: disposition };
    },
  };
}

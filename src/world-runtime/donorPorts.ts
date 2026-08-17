import type {
  DestinationDisposition,
  DestinationPort,
  EncounterPort,
  EncounterPreparation,
  TraversalDecodingProjection,
  TraversalPort,
  WorldDoorProjection,
} from './contracts.js';
import {
  JsonProcessError,
  runJsonProcess,
  type JsonProcessCommand,
} from './processPort.js';

const TRANCH_REQUEST_SCHEMA = 'tranchnode/intent-stroke-stdio/v0.1' as const;
const TRANCH_RESPONSE_SCHEMA = 'tranchnode/intent-stroke-stdio-response/v0.1' as const;
const PROJECT0_REQUEST_SCHEMA = 'project0/world-encounter-stdio/v0.1' as const;
const PROJECT0_RESPONSE_SCHEMA = 'project0/world-encounter-stdio-response/v0.1' as const;
const PROJECT0_EXCHANGE_PROTOCOL = 'p0.exchange/0.1' as const;
const CORPUS_REQUEST_SCHEMA = 'corpus-os/world-encounter-admission/v0.1' as const;
const CORPUS_RESPONSE_SCHEMA = 'corpus-os/world-encounter-stdio-response/v0.1' as const;
const CORPUS_RESULT_SCHEMA = 'corpus-os/world-encounter-result/v0.1' as const;
const CORPUS_DESTINATION_FRAME = 'corpus-os:casework-v0.1' as const;
const CORPUS_PROFILE = 'casework.synthetic-echo/v0.1' as const;
const CORPUS_DESTINATION_SUBJECT = 'artifact:agreement-a' as const;

export interface WorldTraversalLayout {
  anchors: Array<{ id: string; x: number; y: number }>;
}

export interface TranchNodeTraversalPortOptions {
  command: JsonProcessCommand;
  layout: WorldTraversalLayout;
  decoder?: {
    id: string;
    version: string;
    interpolationStepsPerSegment: number;
    endpointPenaltyMultiplier: number;
  };
}

type TranchDecodeResult = {
  schema: typeof TRANCH_RESPONSE_SCHEMA;
  ok: true;
  decoding: {
    authority: 'none';
    fingerprint: string;
    candidates: Array<{ templateId: string; totalCost: number }>;
    ambiguity: {
      kind: 'none' | 'collision';
      leadingTemplateIds: string[];
    };
  };
};

function assertDoorLayout(layout: WorldTraversalLayout, doors: readonly WorldDoorProjection[]): void {
  const ids = new Set(layout.anchors.map((anchor) => anchor.id));
  if (!ids.has('garden')) {
    throw new Error('Tranch traversal layout requires the garden anchor');
  }
  for (const door of doors) {
    if (!ids.has(door.doorRef)) {
      throw new Error(`Tranch traversal layout is missing ${door.doorRef}`);
    }
  }
}

export function createTranchNodeTraversalPort(
  options: TranchNodeTraversalPortOptions,
): TraversalPort {
  const decoder = options.decoder ?? {
    id: 'full-measure.boot-house',
    version: '0.1',
    interpolationStepsPerSegment: 8,
    endpointPenaltyMultiplier: 2,
  };

  return {
    async decode({ stroke, doors }): Promise<TraversalDecodingProjection> {
      assertDoorLayout(options.layout, doors);
      const layout = {
        schema: 'tranchnode/intent-stroke-layout/v0.1' as const,
        anchors: options.layout.anchors.map((anchor) => ({ ...anchor })),
      };

      const decoded = await runJsonProcess<unknown, TranchDecodeResult>(options.command, {
        schema: TRANCH_REQUEST_SCHEMA,
        stroke: {
          schema: 'tranchnode/intent-stroke/v0.1',
          points: stroke.points.map((point) => ({ ...point })),
        },
        layout,
        templates: doors.map((door) => ({
          id: door.doorRef,
          anchorIds: ['garden', door.doorRef],
        })),
        decoder,
      });

      if (
        decoded.schema !== TRANCH_RESPONSE_SCHEMA
        || decoded.ok !== true
        || decoded.decoding?.authority !== 'none'
        || typeof decoded.decoding.fingerprint !== 'string'
        || !Array.isArray(decoded.decoding.candidates)
        || !Array.isArray(decoded.decoding.ambiguity?.leadingTemplateIds)
        || (
          decoded.decoding.ambiguity.kind !== 'none'
          && decoded.decoding.ambiguity.kind !== 'collision'
        )
      ) {
        throw new Error('TranchNode decode returned an incompatible response');
      }

      const doorRefs = new Set(doors.map((door) => door.doorRef));
      const candidates = decoded.decoding.candidates.map((candidate) => {
        if (typeof candidate?.templateId !== 'string' || !doorRefs.has(candidate.templateId)) {
          throw new Error(`TranchNode returned unknown traversal template ${String(candidate?.templateId)}`);
        }
        if (!Number.isFinite(candidate.totalCost) || candidate.totalCost < 0) {
          throw new Error('TranchNode returned an invalid traversal cost');
        }
        return {
          doorRef: candidate.templateId,
          totalCost: candidate.totalCost,
        };
      });
      for (const doorRef of decoded.decoding.ambiguity.leadingTemplateIds) {
        if (typeof doorRef !== 'string' || !doorRefs.has(doorRef)) {
          throw new Error(`TranchNode returned unknown leading template ${String(doorRef)}`);
        }
      }

      return {
        authority: 'none',
        decodingRef: decoded.decoding.fingerprint,
        candidates,
        ambiguity: {
          kind: decoded.decoding.ambiguity.kind,
          leadingDoorRefs: [...decoded.decoding.ambiguity.leadingTemplateIds],
        },
      };
    },
  };
}

export interface Project0EncounterSourceProfile {
  originNodeRef: string;
  originVersionRef: string;
  disclosureClass: string;
  sourceEpistemicKind: 'source' | 'observation' | 'claim' | 'proposal' | 'tension' | 'rejection' | 'witness' | 'harvest' | 'inference';
  sourceVerificationState: 'unverified' | 'verified' | 'disputed' | 'unknown';
}

export interface Project0EncounterPortOptions {
  command: JsonProcessCommand;
  source: Project0EncounterSourceProfile;
}

type Project0OkResult = {
  schema: typeof PROJECT0_RESPONSE_SCHEMA;
  ok: true;
  operation: 'address' | 'verify';
  record: {
    ref: string;
    digestHex: string;
    recordType: 'exchange_envelope';
    body: Record<string, unknown>;
  };
};

type Project0ErrorResult = {
  schema: typeof PROJECT0_RESPONSE_SCHEMA;
  ok: false;
  error: { code: string };
};

type Project0Result = Project0OkResult | Project0ErrorResult;

function isProject0ErrorResult(value: unknown): value is Project0ErrorResult {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const error = record.error;
  return record.schema === PROJECT0_RESPONSE_SCHEMA
    && record.ok === false
    && typeof error === 'object'
    && error !== null
    && !Array.isArray(error)
    && typeof (error as Record<string, unknown>).code === 'string';
}

async function runProject0Process(
  command: JsonProcessCommand,
  request: unknown,
): Promise<Project0Result> {
  try {
    return await runJsonProcess<unknown, Project0Result>(command, request);
  } catch (error: unknown) {
    if (
      error instanceof JsonProcessError
      && error.code === 'PROCESS_EXIT_NONZERO'
      && isProject0ErrorResult(error.response)
    ) {
      return error.response;
    }
    throw error;
  }
}

function validationFailure(
  reasonCode: string,
  evidenceRefs: readonly string[],
): EncounterPreparation {
  return {
    status: 'validation-failed',
    reasonCode,
    evidenceRefs: [...new Set(evidenceRefs)],
  };
}

export function createProject0EncounterPort(
  options: Project0EncounterPortOptions,
): EncounterPort {
  return {
    async prepare(input): Promise<EncounterPreparation> {
      if (input.offeredWitnessRefs.length !== 1) {
        return validationFailure(
          'FULL_MEASURE_V0_1_REQUIRES_ONE_OFFERED_REFERENCE',
          [input.confirmationReceiptRef, ...input.traversalEvidenceRefs],
        );
      }

      const offeredRef = input.offeredWitnessRefs[0];
      if (!offeredRef) {
        return validationFailure(
          'FULL_MEASURE_V0_1_REQUIRES_ONE_OFFERED_REFERENCE',
          [input.confirmationReceiptRef],
        );
      }

      const envelope = {
        protocolVersion: PROJECT0_EXCHANGE_PROTOCOL,
        originNodeRef: options.source.originNodeRef,
        originFrameRef: input.sourceFieldRef,
        originVersionRef: options.source.originVersionRef,
        offered: {
          objectRef: offeredRef,
          mediaType: null,
          sourceReceiptRefs: [
            ...input.traversalEvidenceRefs,
            input.confirmationReceiptRef,
          ],
          disclosureClass: options.source.disclosureClass,
        },
        sourceProvenanceRefs: [
          options.source.originVersionRef,
          input.sourceFieldRef,
        ],
        sourceAuthorityRefs: [],
        sourceEpistemicKind: options.source.sourceEpistemicKind,
        sourceVerificationState: options.source.sourceVerificationState,
        capabilityUsed: 'full-measure.offer-bounded-reference/v0.1',
        limitations: [
          `intended-destination:${input.destinationRef}`,
          'reference-only',
          'crossing-does-not-transfer-authority',
        ],
      };

      const addressResult = await runProject0Process(options.command, {
        schema: PROJECT0_REQUEST_SCHEMA,
        operation: 'address',
        recordType: 'exchange_envelope',
        body: envelope,
      });
      if (addressResult.schema !== PROJECT0_RESPONSE_SCHEMA) {
        throw new Error('Project0 address returned an incompatible response schema');
      }
      if (addressResult.ok === false) {
        return validationFailure(addressResult.error.code, [input.confirmationReceiptRef]);
      }
      if (
        addressResult.operation !== 'address'
        || addressResult.record.recordType !== 'exchange_envelope'
        || typeof addressResult.record.ref !== 'string'
      ) {
        throw new Error('Project0 address returned an incompatible encounter record');
      }

      const verifyResult = await runProject0Process(options.command, {
        schema: PROJECT0_REQUEST_SCHEMA,
        operation: 'verify',
        recordType: 'exchange_envelope',
        expectedRef: addressResult.record.ref,
        body: envelope,
      });
      if (verifyResult.schema !== PROJECT0_RESPONSE_SCHEMA) {
        throw new Error('Project0 verify returned an incompatible response schema');
      }
      if (verifyResult.ok === false) {
        return validationFailure(verifyResult.error.code, [
          input.confirmationReceiptRef,
          addressResult.record.ref,
        ]);
      }
      if (
        verifyResult.operation !== 'verify'
        || verifyResult.record.recordType !== 'exchange_envelope'
        || verifyResult.record.ref !== addressResult.record.ref
      ) {
        throw new Error('Project0 verification changed the encounter identity');
      }

      return {
        status: 'ok',
        encounterRef: verifyResult.record.ref,
        encounter: {
          ref: verifyResult.record.ref,
          body: envelope,
        },
        evidenceRefs: [
          input.confirmationReceiptRef,
          ...input.traversalEvidenceRefs,
          verifyResult.record.ref,
        ],
      };
    },
  };
}

export interface CorpusDestinationPortOptions {
  command: JsonProcessCommand;
}

type CorpusProcessResult = {
  schema: typeof CORPUS_RESULT_SCHEMA;
  status: 'admitted' | 'refused' | 'indeterminate' | 'failed';
  reasonCode: string;
  envelopeRef: string;
  destinationFrameRef: string;
  profile: string;
  callerAuthenticated: false;
  authorityTransfer: 'none';
  legalValidity: 'unclaimed';
  receiptRequestId?: string;
  outputRefs: string[];
  evidenceRefs: string[];
};

type CorpusProcessResponse = {
  schema: typeof CORPUS_RESPONSE_SCHEMA;
  ok: true;
  result: CorpusProcessResult;
};

function assertStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) {
    throw new Error(`Corpus destination returned invalid ${label}`);
  }
}

export function createCorpusDestinationPort(
  options: CorpusDestinationPortOptions,
): DestinationPort {
  return {
    async evaluate(input): Promise<DestinationDisposition> {
      if (
        typeof input.encounter !== 'object'
        || input.encounter === null
        || !('ref' in input.encounter)
      ) {
        throw new Error('Corpus destination requires a Project0-addressed encounter');
      }

      const encounter = input.encounter as { ref: unknown };
      if (encounter.ref !== input.encounterRef || typeof encounter.ref !== 'string') {
        throw new Error('Corpus destination encounter identity is inconsistent');
      }

      const response = await runJsonProcess<unknown, CorpusProcessResponse>(options.command, {
        schema: CORPUS_REQUEST_SCHEMA,
        envelopeRef: encounter.ref,
        destinationFrameRef: CORPUS_DESTINATION_FRAME,
        profile: CORPUS_PROFILE,
        destinationSubjectRef: CORPUS_DESTINATION_SUBJECT,
        input: `Boot the House encounter ${encounter.ref}`,
      });
      const result = response.result;

      if (
        response.schema !== CORPUS_RESPONSE_SCHEMA
        || response.ok !== true
        || !result
        || result.schema !== CORPUS_RESULT_SCHEMA
        || result.envelopeRef !== encounter.ref
        || result.destinationFrameRef !== CORPUS_DESTINATION_FRAME
        || result.profile !== CORPUS_PROFILE
        || result.callerAuthenticated !== false
        || result.authorityTransfer !== 'none'
        || result.legalValidity !== 'unclaimed'
        || typeof result.reasonCode !== 'string'
        || result.reasonCode.length === 0
      ) {
        throw new Error('Corpus destination returned an incompatible response');
      }
      assertStringArray(result.evidenceRefs, 'evidence refs');
      assertStringArray(result.outputRefs, 'output refs');

      if (result.status === 'failed') {
        return {
          status: 'failed',
          authority: 'none',
          failureClass: result.reasonCode,
          evidenceRefs: [...new Set(result.evidenceRefs)],
        };
      }

      if (
        result.status !== 'admitted'
        && result.status !== 'refused'
        && result.status !== 'indeterminate'
      ) {
        throw new Error('Corpus destination returned an unknown disposition');
      }

      return {
        status: result.status,
        authority: 'none',
        reasonCode: result.reasonCode,
        evidenceRefs: [...new Set(result.evidenceRefs)],
      };
    },
  };
}

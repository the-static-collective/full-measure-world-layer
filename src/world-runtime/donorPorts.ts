import type {
  DestinationDisposition,
  DestinationPort,
  EncounterPort,
  EncounterPreparation,
  TraversalDecodingProjection,
  TraversalPort,
  WorldDoorProjection,
} from './contracts.js';
import { runJsonProcess, type JsonProcessCommand } from './processPort.js';

const TRANCH_PROCESS_SCHEMA = 'tranchnode.intent-stroke-process/v0.1' as const;
const TRANCH_RESULT_SCHEMA = 'tranchnode.intent-stroke-process-result/v0.1' as const;
const PROJECT0_PROCESS_SCHEMA = 'project0.world-encounter-process/v0.1' as const;
const PROJECT0_RESULT_SCHEMA = 'project0.world-encounter-process-result/v0.1' as const;
const PROJECT0_EXCHANGE_PROTOCOL = 'p0.exchange/0.1' as const;
const CORPUS_REQUEST_SCHEMA = 'corpus.world-encounter-destination/v0.1' as const;
const CORPUS_RESULT_SCHEMA = 'corpus.world-encounter-disposition/v0.1' as const;
const CORPUS_CAPABILITY = 'corpus.receive-public-source-ref/v0.1' as const;

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

type TranchAddressLayoutResult = {
  schema: typeof TRANCH_RESULT_SCHEMA;
  status: 'ok';
  operation: 'address-layout';
  addressed: {
    hash: string;
    value: unknown;
  };
};

type TranchDecodeResult = {
  schema: typeof TRANCH_RESULT_SCHEMA;
  status: 'ok';
  operation: 'decode';
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

      const addressed = await runJsonProcess<unknown, TranchAddressLayoutResult>(options.command, {
        schema: TRANCH_PROCESS_SCHEMA,
        operation: 'address-layout',
        layout,
      });
      if (
        addressed.schema !== TRANCH_RESULT_SCHEMA
        || addressed.status !== 'ok'
        || addressed.operation !== 'address-layout'
        || typeof addressed.addressed?.hash !== 'string'
      ) {
        throw new Error('TranchNode address-layout returned an incompatible response');
      }

      const decoded = await runJsonProcess<unknown, TranchDecodeResult>(options.command, {
        schema: TRANCH_PROCESS_SCHEMA,
        operation: 'decode',
        stroke: {
          schema: 'tranchnode/intent-stroke/v0.1',
          fieldLayoutRef: addressed.addressed.hash,
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
        decoded.schema !== TRANCH_RESULT_SCHEMA
        || decoded.status !== 'ok'
        || decoded.operation !== 'decode'
        || decoded.decoding?.authority !== 'none'
        || typeof decoded.decoding.fingerprint !== 'string'
        || !Array.isArray(decoded.decoding.candidates)
        || !Array.isArray(decoded.decoding.ambiguity?.leadingTemplateIds)
      ) {
        throw new Error('TranchNode decode returned an incompatible response');
      }

      const doorRefs = new Set(doors.map((door) => door.doorRef));
      const candidates = decoded.decoding.candidates.map((candidate) => {
        if (!doorRefs.has(candidate.templateId)) {
          throw new Error(`TranchNode returned unknown traversal template ${candidate.templateId}`);
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
        if (!doorRefs.has(doorRef)) {
          throw new Error(`TranchNode returned unknown leading template ${doorRef}`);
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
  schema: typeof PROJECT0_RESULT_SCHEMA;
  status: 'ok';
  addressed: {
    ref: string;
    digestHex: string;
    recordType: 'exchange_envelope';
    body: Record<string, unknown>;
  };
};

type Project0ErrorResult = {
  schema: typeof PROJECT0_RESULT_SCHEMA;
  status: 'error';
  code: string;
  message?: string;
};

type Project0Result = Project0OkResult | Project0ErrorResult;

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

      const addressResult = await runJsonProcess<unknown, Project0Result>(options.command, {
        schema: PROJECT0_PROCESS_SCHEMA,
        operation: 'address',
        recordType: 'exchange_envelope',
        body: envelope,
      });
      if (addressResult.schema !== PROJECT0_RESULT_SCHEMA) {
        throw new Error('Project0 address returned an incompatible response schema');
      }
      if (addressResult.status === 'error') {
        return validationFailure(addressResult.code, [input.confirmationReceiptRef]);
      }
      if (
        addressResult.addressed.recordType !== 'exchange_envelope'
        || typeof addressResult.addressed.ref !== 'string'
      ) {
        throw new Error('Project0 address returned an incompatible encounter record');
      }

      const verifyResult = await runJsonProcess<unknown, Project0Result>(options.command, {
        schema: PROJECT0_PROCESS_SCHEMA,
        operation: 'verify',
        recordType: 'exchange_envelope',
        expectedRef: addressResult.addressed.ref,
        body: envelope,
      });
      if (verifyResult.schema !== PROJECT0_RESULT_SCHEMA) {
        throw new Error('Project0 verify returned an incompatible response schema');
      }
      if (verifyResult.status === 'error') {
        return validationFailure(verifyResult.code, [
          input.confirmationReceiptRef,
          addressResult.addressed.ref,
        ]);
      }
      if (verifyResult.addressed.ref !== addressResult.addressed.ref) {
        throw new Error('Project0 verification changed the encounter identity');
      }

      return {
        status: 'ok',
        encounterRef: verifyResult.addressed.ref,
        encounter: {
          ref: verifyResult.addressed.ref,
          body: envelope,
        },
        evidenceRefs: [
          input.confirmationReceiptRef,
          ...input.traversalEvidenceRefs,
          verifyResult.addressed.ref,
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
  authority: 'none';
  reasonCode?: string;
  failureClass?: string;
  destinationPolicyEvidenceRefs?: string[];
  evidenceRefs: string[];
};

export function createCorpusDestinationPort(
  options: CorpusDestinationPortOptions,
): DestinationPort {
  return {
    async evaluate(input): Promise<DestinationDisposition> {
      if (
        typeof input.encounter !== 'object'
        || input.encounter === null
        || !('ref' in input.encounter)
        || !('body' in input.encounter)
      ) {
        throw new Error('Corpus destination requires a Project0-addressed encounter');
      }

      const encounter = input.encounter as { ref: unknown; body: unknown };
      if (encounter.ref !== input.encounterRef || typeof encounter.ref !== 'string') {
        throw new Error('Corpus destination encounter identity is inconsistent');
      }

      const result = await runJsonProcess<unknown, CorpusProcessResult>(options.command, {
        schema: CORPUS_REQUEST_SCHEMA,
        capability: CORPUS_CAPABILITY,
        encounter: {
          ref: encounter.ref,
          body: encounter.body,
        },
      });

      if (
        result.schema !== CORPUS_RESULT_SCHEMA
        || result.authority !== 'none'
        || !Array.isArray(result.evidenceRefs)
      ) {
        throw new Error('Corpus destination returned an incompatible response');
      }

      const evidenceRefs = [
        ...result.evidenceRefs,
        ...(Array.isArray(result.destinationPolicyEvidenceRefs)
          ? result.destinationPolicyEvidenceRefs
          : []),
      ];

      if (result.status === 'failed') {
        if (!result.failureClass) {
          throw new Error('Corpus failed disposition lacks a failure class');
        }
        return {
          status: 'failed',
          authority: 'none',
          failureClass: result.failureClass,
          evidenceRefs: [...new Set(evidenceRefs)],
        };
      }

      if (
        result.status !== 'admitted'
        && result.status !== 'refused'
        && result.status !== 'indeterminate'
      ) {
        throw new Error('Corpus destination returned an unknown disposition');
      }
      if (!result.reasonCode) {
        throw new Error('Corpus constitutional disposition lacks a reason code');
      }

      return {
        status: result.status,
        authority: 'none',
        reasonCode: result.reasonCode,
        evidenceRefs: [...new Set(evidenceRefs)],
      };
    },
  };
}

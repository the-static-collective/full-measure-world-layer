import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProject0EncounterPort,
  createTranchNodeTraversalPort,
} from '../src/world-runtime/donorPorts.js';
import type { JsonProcessCommand } from '../src/world-runtime/processPort.js';
import type { WorldDoorProjection } from '../src/world-runtime/contracts.js';

function nodeJsonCommand(scriptBody: string): JsonProcessCommand {
  const script = `
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      const request = JSON.parse(input);
      const respond = (body, code = 0) => {
        process.stdout.write(JSON.stringify(body));
        process.exitCode = code;
      };
      (${scriptBody})(request, respond);
    });
  `;
  return {
    command: process.execPath,
    args: ['-e', script],
    timeoutMs: 1_000,
    maxInputBytes: 64_000,
    maxOutputBytes: 64_000,
  };
}

const doors: WorldDoorProjection[] = [
  {
    doorRef: 'door:corpus',
    destinationRef: 'corpus-os:world-encounter:v0.1',
    relation: 'fixture',
    reachability: 'reachable',
    provenanceRefs: ['fixture:doors'],
    relevanceReasons: ['destination available'],
    requiredCrossingProfile: 'p0.exchange/0.1',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:upper-room',
    destinationRef: 'upper-room:scripture-room',
    relation: 'fixture',
    reachability: 'unknown',
    provenanceRefs: ['fixture:doors'],
    relevanceReasons: ['neighbor'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
  {
    doorRef: 'door:band-runtime',
    destinationRef: 'band-runtime:groove-room',
    relation: 'fixture',
    reachability: 'unknown',
    provenanceRefs: ['fixture:doors'],
    relevanceReasons: ['neighbor'],
    requiredCrossingProfile: 'not-yet-live',
    evidenceMode: 'fixture',
    authority: 'none',
  },
];

const layout = {
  anchors: [
    { id: 'garden', x: 100_000, y: 500_000 },
    { id: 'door:corpus', x: 900_000, y: 500_000 },
    { id: 'door:upper-room', x: 500_000, y: 100_000 },
    { id: 'door:band-runtime', x: 500_000, y: 900_000 },
  ],
};

test('Tranch port uses the donor-owned one-shot stdio contract without caller-owned hashing', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'tranchnode/intent-stroke-stdio/v0.1') {
      return respond({ schema: 'tranchnode/intent-stroke-stdio-response/v0.1', ok: false, error: { code: 'BAD_SCHEMA' } }, 1);
    }
    if (request.stroke.fieldLayoutRef !== undefined) {
      return respond({ schema: 'tranchnode/intent-stroke-stdio-response/v0.1', ok: false, error: { code: 'CALLER_PRECOMPUTED_LAYOUT_REF' } }, 1);
    }
    return respond({
      schema: 'tranchnode/intent-stroke-stdio-response/v0.1',
      ok: true,
      decoding: {
        schema: 'tranchnode/intent-stroke-decoding/v0.1',
        authority: 'none',
        strokeHash: 'sha256:' + '1'.repeat(64),
        fieldLayoutRef: 'sha256:' + '2'.repeat(64),
        decoder: request.decoder,
        candidates: [
          { templateId: 'door:corpus', totalCost: 1 },
          { templateId: 'door:upper-room', totalCost: 7 },
          { templateId: 'door:band-runtime', totalCost: 9 },
        ],
        ambiguity: { kind: 'none', leadingTemplateIds: ['door:corpus'] },
        fingerprint: 'sha256:' + '3'.repeat(64),
      },
    });
  }`);

  const port = createTranchNodeTraversalPort({ command, layout });
  const result = await port.decode({
    doors,
    stroke: {
      rawStrokeRef: 'full-measure:stroke:1',
      points: [
        { sequence: 0, x: 100_000, y: 500_000 },
        { sequence: 1, x: 900_000, y: 500_000 },
      ],
    },
  });

  assert.equal(result.authority, 'none');
  assert.equal(result.decodingRef, 'sha256:' + '3'.repeat(64));
  assert.equal(result.candidates[0]?.doorRef, 'door:corpus');
  assert.deepEqual(result.ambiguity.leadingDoorRefs, ['door:corpus']);
});

test('Project0 port consumes the donor-owned address/verify stdio contract', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'project0/world-encounter-stdio/v0.1') {
      return respond({ schema: 'project0/world-encounter-stdio-response/v0.1', ok: false, error: { code: 'BAD_SCHEMA' } }, 1);
    }
    if (request.operation === 'address') {
      if (request.body.sourceAuthorityRefs.length !== 0) {
        return respond({ schema: 'project0/world-encounter-stdio-response/v0.1', ok: false, error: { code: 'AUTHORITY_LEAK' } }, 1);
      }
      return respond({
        schema: 'project0/world-encounter-stdio-response/v0.1',
        ok: true,
        operation: 'address',
        record: {
          ref: 'enc-' + 'a'.repeat(64),
          digestHex: 'a'.repeat(64),
          recordType: 'exchange_envelope',
          body: request.body,
        },
      });
    }
    if (request.operation === 'verify') {
      return respond({
        schema: 'project0/world-encounter-stdio-response/v0.1',
        ok: true,
        operation: 'verify',
        record: {
          ref: request.expectedRef,
          digestHex: 'a'.repeat(64),
          recordType: 'exchange_envelope',
          body: request.body,
        },
      });
    }
    return respond({ schema: 'project0/world-encounter-stdio-response/v0.1', ok: false, error: { code: 'BAD_OPERATION' } }, 1);
  }`);

  const port = createProject0EncounterPort({
    command,
    source: {
      originNodeRef: 'full-measure-world-layer',
      originVersionRef: 'github:full-measure@fixture-head',
      disclosureClass: 'public',
      sourceEpistemicKind: 'source',
      sourceVerificationState: 'verified',
    },
  });

  const result = await port.prepare({
    sourceFieldRef: 'full-measure:garden/world-field/v0.1',
    destinationDoorRef: 'door:corpus',
    destinationRef: 'corpus-os:world-encounter:v0.1',
    traversalEvidenceRefs: ['tranchnode:decoding:1'],
    offeredWitnessRefs: ['github:the-static-collective/full-measure-world-layer@fixture:README.md'],
    confirmedBy: 'user_lu',
    confirmationReceiptRef: 'full-measure:crossing-confirmation:1',
  });

  assert.equal(result.status, 'ok');
  if (result.status !== 'ok') return;
  assert.equal(result.encounterRef, 'enc-' + 'a'.repeat(64));
  const envelope = result.encounter as { body: Record<string, unknown> };
  assert.deepEqual(envelope.body.sourceAuthorityRefs, []);
});

test('Project0 structured nonzero error remains pre-destination validation failure', async () => {
  const command = nodeJsonCommand(`(_request, respond) => respond({
    schema: 'project0/world-encounter-stdio-response/v0.1',
    ok: false,
    error: { code: 'ENCOUNTER_PROTOCOL_UNSUPPORTED' },
  }, 1)`);

  const port = createProject0EncounterPort({
    command,
    source: {
      originNodeRef: 'full-measure-world-layer',
      originVersionRef: 'fixture',
      disclosureClass: 'public',
      sourceEpistemicKind: 'source',
      sourceVerificationState: 'verified',
    },
  });

  const result = await port.prepare({
    sourceFieldRef: 'full-measure:garden/world-field/v0.1',
    destinationDoorRef: 'door:corpus',
    destinationRef: 'corpus-os:world-encounter:v0.1',
    traversalEvidenceRefs: [],
    offeredWitnessRefs: ['fixture:source'],
    confirmedBy: 'user_lu',
    confirmationReceiptRef: 'full-measure:crossing-confirmation:1',
  });

  assert.equal(result.status, 'validation-failed');
  if (result.status !== 'validation-failed') return;
  assert.equal(result.reasonCode, 'ENCOUNTER_PROTOCOL_UNSUPPORTED');
});

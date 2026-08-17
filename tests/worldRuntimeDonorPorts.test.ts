import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCorpusDestinationPort,
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

test('Tranch port obtains the native layout hash before decoding', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'tranchnode.intent-stroke-process/v0.1') {
      return respond({ status: 'error', code: 'BAD_SCHEMA' }, 1);
    }
    if (request.operation === 'address-layout') {
      if (request.layout.schema !== 'tranchnode/intent-stroke-layout/v0.1') {
        return respond({ status: 'error', code: 'BAD_LAYOUT' }, 1);
      }
      return respond({
        schema: 'tranchnode.intent-stroke-process-result/v0.1',
        status: 'ok',
        operation: 'address-layout',
        addressed: { hash: 'hash-layout-native', value: request.layout },
      });
    }
    if (request.operation === 'decode') {
      if (request.stroke.fieldLayoutRef !== 'hash-layout-native') {
        return respond({ status: 'error', code: 'LAYOUT_REF_MISMATCH' }, 1);
      }
      return respond({
        schema: 'tranchnode.intent-stroke-process-result/v0.1',
        status: 'ok',
        operation: 'decode',
        decoding: {
          schema: 'tranchnode/intent-stroke-decoding/v0.1',
          authority: 'none',
          strokeHash: 'hash-stroke-native',
          fieldLayoutRef: 'hash-layout-native',
          decoder: request.decoder,
          candidates: [
            { templateId: 'door:corpus', anchorIds: ['garden', 'door:corpus'], pathCost: 1, endpointCost: 0, totalCost: 1 },
            { templateId: 'door:upper-room', anchorIds: ['garden', 'door:upper-room'], pathCost: 7, endpointCost: 0, totalCost: 7 },
            { templateId: 'door:band-runtime', anchorIds: ['garden', 'door:band-runtime'], pathCost: 9, endpointCost: 0, totalCost: 9 },
          ],
          ambiguity: { kind: 'none', leadingTemplateIds: ['door:corpus'] },
          fingerprint: 'hash-decoding-native',
        },
      });
    }
    return respond({ status: 'error', code: 'BAD_OPERATION' }, 1);
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
  assert.equal(result.decodingRef, 'hash-decoding-native');
  assert.equal(result.candidates[0]?.doorRef, 'door:corpus');
  assert.deepEqual(result.ambiguity.leadingDoorRefs, ['door:corpus']);
});

test('Project0 port addresses then verifies one authority-free envelope', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'project0.world-encounter-process/v0.1') {
      return respond({ status: 'error', code: 'BAD_SCHEMA' }, 1);
    }
    if (request.operation === 'address') {
      if (request.body.protocolVersion !== 'p0.exchange/0.1') return respond({ status: 'error', code: 'BAD_PROTOCOL' }, 1);
      if (request.body.sourceAuthorityRefs.length !== 0) return respond({ status: 'error', code: 'AUTHORITY_LEAK' }, 1);
      return respond({
        schema: 'project0.world-encounter-process-result/v0.1',
        status: 'ok',
        addressed: {
          ref: 'enc-' + 'a'.repeat(64),
          digestHex: 'a'.repeat(64),
          recordType: 'exchange_envelope',
          body: request.body,
        },
      });
    }
    if (request.operation === 'verify') {
      if (request.expectedRef !== 'enc-' + 'a'.repeat(64)) return respond({ status: 'error', code: 'BAD_REF' }, 1);
      return respond({
        schema: 'project0.world-encounter-process-result/v0.1',
        status: 'ok',
        addressed: {
          ref: request.expectedRef,
          digestHex: 'a'.repeat(64),
          recordType: 'exchange_envelope',
          body: request.body,
        },
      });
    }
    return respond({ status: 'error', code: 'BAD_OPERATION' }, 1);
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
  assert.equal(envelope.body.protocolVersion, 'p0.exchange/0.1');
  assert.deepEqual(envelope.body.sourceAuthorityRefs, []);
  assert.equal(envelope.body.originFrameRef, 'full-measure:garden/world-field/v0.1');
  assert.equal(envelope.body.offered && (envelope.body.offered as { objectRef: string }).objectRef,
    'github:the-static-collective/full-measure-world-layer@fixture:README.md');
});

test('Project0 structured validation error stays pre-destination validation failure', async () => {
  const command = nodeJsonCommand(`(_request, respond) => respond({
    schema: 'project0.world-encounter-process-result/v0.1',
    status: 'error',
    code: 'ENCOUNTER_PROTOCOL_UNSUPPORTED',
    message: 'unsupported',
  })`);

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

test('Corpus port submits only the bounded capability and preserves authority none', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'corpus.world-encounter-destination/v0.1') return respond({ error: 'BAD_SCHEMA' }, 1);
    if (request.capability !== 'corpus.receive-public-source-ref/v0.1') return respond({ error: 'BAD_CAPABILITY' }, 1);
    if (request.encounter.body.protocolVersion !== 'p0.exchange/0.1') return respond({ error: 'BAD_PROTOCOL' }, 1);
    return respond({
      schema: 'corpus.world-encounter-disposition/v0.1',
      status: 'admitted',
      reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
      authority: 'none',
      destinationFrameRef: 'corpus-os:world-encounter:v0.1',
      encounterRef: request.encounter.ref,
      inspectedObject: false,
      destinationPolicyEvidenceRefs: ['corpus-os:policy:world-encounter:v0.1'],
      evidenceRefs: [request.encounter.ref],
    });
  }`);

  const port = createCorpusDestinationPort({ command });
  const result = await port.evaluate({
    encounterRef: 'enc-' + 'a'.repeat(64),
    encounter: {
      ref: 'enc-' + 'a'.repeat(64),
      body: { protocolVersion: 'p0.exchange/0.1' },
    },
    door: doors[0]!,
  });

  assert.equal(result.status, 'admitted');
  assert.equal(result.authority, 'none');
  assert.equal(result.evidenceRefs.includes('corpus-os:policy:world-encounter:v0.1'), true);
});

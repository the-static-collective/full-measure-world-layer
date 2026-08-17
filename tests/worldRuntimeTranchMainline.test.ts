import test from 'node:test';
import assert from 'node:assert/strict';

import { createTranchNodeTraversalPort } from '../src/world-runtime/donorPorts.js';
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

const doors: WorldDoorProjection[] = [{
  doorRef: 'door:corpus',
  destinationRef: 'corpus-os:world-encounter:v0.1',
  relation: 'fixture',
  reachability: 'reachable',
  provenanceRefs: ['fixture:doors'],
  relevanceReasons: ['destination available'],
  requiredCrossingProfile: 'p0.exchange/0.1',
  evidenceMode: 'fixture',
  authority: 'none',
}];

const layout = {
  anchors: [
    { id: 'garden', x: 100_000, y: 500_000 },
    { id: 'door:corpus', x: 900_000, y: 500_000 },
  ],
};

test('Tranch port consumes landed raw-point stdio v0.2 without caller-owned layout identity', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'tranchnode/intent-stroke-stdio/v0.2') {
      return respond({ schema: 'tranchnode/intent-stroke-stdio-response/v0.2', ok: false, error: { code: 'BAD_SCHEMA' } }, 1);
    }
    if (request.stroke !== undefined || !Array.isArray(request.points)) {
      return respond({ schema: 'tranchnode/intent-stroke-stdio-response/v0.2', ok: false, error: { code: 'CALLER_OWNS_STROKE_IDENTITY' } }, 1);
    }
    return respond({
      schema: 'tranchnode/intent-stroke-stdio-response/v0.2',
      ok: true,
      decoding: {
        schema: 'tranchnode/intent-stroke-decoding/v0.1',
        authority: 'none',
        strokeHash: 'sha256:' + '1'.repeat(64),
        fieldLayoutRef: 'sha256:' + '2'.repeat(64),
        decoder: request.decoder,
        candidates: [{ templateId: 'door:corpus', totalCost: 1 }],
        ambiguity: { kind: 'none', leadingTemplateIds: ['door:corpus'] },
        fingerprint: 'sha256:' + '3'.repeat(64),
      },
    });
  }`);

  const port = createTranchNodeTraversalPort({ command, layout });
  const result = await port.decode({
    doors,
    stroke: {
      rawStrokeRef: 'full-measure:stroke:mainline-v02',
      points: [
        { sequence: 0, x: 100_000, y: 500_000 },
        { sequence: 1, x: 900_000, y: 500_000 },
      ],
    },
  });

  assert.equal(result.authority, 'none');
  assert.equal(result.decodingRef, 'sha256:' + '3'.repeat(64));
  assert.equal(result.candidates[0]?.doorRef, 'door:corpus');
});

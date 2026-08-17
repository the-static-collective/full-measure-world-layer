import test from 'node:test';
import assert from 'node:assert/strict';

import { createCorpusDestinationPort } from '../src/world-runtime/donorPorts.js';
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

const corpusDoor: WorldDoorProjection = {
  doorRef: 'door:corpus',
  destinationRef: 'corpus-os:world-encounter:v0.1',
  relation: 'fixture',
  reachability: 'reachable',
  provenanceRefs: ['fixture:doors'],
  relevanceReasons: ['destination available'],
  requiredCrossingProfile: 'p0.exchange/0.1',
  evidenceMode: 'fixture',
  authority: 'none',
};

test('Corpus port consumes landed admission contract without caller authority', async () => {
  const command = nodeJsonCommand(`(request, respond) => {
    if (request.schema !== 'corpus-os/world-encounter-admission/v0.1') return respond({ error: 'BAD_SCHEMA' }, 1);
    if (request.destinationFrameRef !== 'corpus-os:casework-v0.1') return respond({ error: 'BAD_FRAME' }, 1);
    if (request.profile !== 'casework.synthetic-echo/v0.1') return respond({ error: 'BAD_PROFILE' }, 1);
    if (request.destinationSubjectRef !== 'artifact:agreement-a') return respond({ error: 'BAD_SUBJECT' }, 1);
    if (request.input !== 'Boot the House encounter ' + request.envelopeRef) return respond({ error: 'BAD_INPUT' }, 1);
    if ('actorId' in request || 'authority' in request || 'warrant' in request) return respond({ error: 'AUTHORITY_LEAK' }, 1);
    return respond({
      schema: 'corpus-os/world-encounter-stdio-response/v0.1',
      ok: true,
      result: {
        schema: 'corpus-os/world-encounter-result/v0.1',
        status: 'admitted',
        reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
        envelopeRef: request.envelopeRef,
        destinationFrameRef: request.destinationFrameRef,
        profile: request.profile,
        callerAuthenticated: false,
        authorityTransfer: 'none',
        legalValidity: 'unclaimed',
        receiptRequestId: 'session-request-0001',
        outputRefs: ['session-output:session-request-0001'],
        evidenceRefs: [request.envelopeRef, 'fixtures/capabilities/synthetic.echo.json'],
      },
    });
  }`);

  const port = createCorpusDestinationPort({ command });
  const result = await port.evaluate({
    encounterRef: 'enc-' + 'a'.repeat(64),
    encounter: {
      ref: 'enc-' + 'a'.repeat(64),
      body: { protocolVersion: 'p0.exchange/0.1' },
    },
    door: corpusDoor,
  });

  assert.equal(result.status, 'admitted');
  assert.equal(result.authority, 'none');
  assert.equal(result.evidenceRefs.includes('fixtures/capabilities/synthetic.echo.json'), true);
});

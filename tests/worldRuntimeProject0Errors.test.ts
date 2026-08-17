import test from 'node:test';
import assert from 'node:assert/strict';

import { createProject0EncounterPort } from '../src/world-runtime/donorPorts.js';
import type { JsonProcessCommand } from '../src/world-runtime/processPort.js';

function project0ValidationFailureCommand(): JsonProcessCommand {
  const script = `
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => input += chunk);
    process.stdin.on('end', () => {
      JSON.parse(input);
      process.stdout.write(JSON.stringify({
        schema: 'project0.world-encounter-process-result/v0.1',
        status: 'error',
        code: 'ENCOUNTER_PROTOCOL_UNSUPPORTED',
        message: 'unsupported'
      }));
      process.exitCode = 1;
    });
  `;
  return {
    command: process.execPath,
    args: ['-e', script],
    timeoutMs: 1_000,
    maxOutputBytes: 64_000,
  };
}

test('Project0 structured validation remains validation-failed even when CLI exits nonzero', async () => {
  const port = createProject0EncounterPort({
    command: project0ValidationFailureCommand(),
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

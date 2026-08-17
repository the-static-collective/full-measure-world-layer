import assert from 'node:assert/strict';
import test from 'node:test';

import { createTranchNodeAdapter } from '../src/lib/worldRuntime/tranchnodeAdapter.js';
import { createProject0Adapter } from '../src/lib/worldRuntime/project0Adapter.js';
import { createCorpusAdapter } from '../src/lib/worldRuntime/corpusAdapter.js';
import type {
  JsonProcessInvoker,
  ProcessAdapterCommand,
} from '../src/lib/worldRuntime/processAdapter.js';

const command: ProcessAdapterCommand = {
  executable: 'fixture',
  args: [],
  cwd: '/fixture',
};

function recordingInvoker(value: unknown) {
  const requests: unknown[] = [];
  const invoke: JsonProcessInvoker = async (_command, request) => {
    requests.push(structuredClone(request));
    return { ok: true, value };
  };
  return { invoke, requests };
}

test('TranchNode client adds only its donor wrapper and preserves foreign decoding as non-authoritative evidence', async () => {
  const fixture = {
    schema: 'tranchnode/intent-stroke-stdio-response/v0.1',
    ok: true,
    decoding: { authority: 'none', fingerprint: 'sha256:abc', candidates: [], ambiguity: { kind: 'none' } },
  };
  const recorder = recordingInvoker(fixture);
  const adapter = createTranchNodeAdapter(command, recorder.invoke);
  const result = await adapter.decode({ stroke: { raw: true }, layout: { field: true }, templates: [], decoder: { version: 'v' } });

  assert.equal(result.ok, true);
  assert.deepEqual(recorder.requests, [{
    schema: 'tranchnode/intent-stroke-stdio/v0.1',
    stroke: { raw: true },
    layout: { field: true },
    templates: [],
    decoder: { version: 'v' },
  }]);
  if (result.ok) assert.equal((result.value as any).authority, 'none');
});

test('Project0 client delegates address and verify without copying canonicalization', async () => {
  const recorder = recordingInvoker({
    schema: 'project0/world-encounter-stdio-response/v0.1',
    ok: true,
    operation: 'address',
    record: { ref: `enc-${'a'.repeat(64)}`, digestHex: 'a'.repeat(64), recordType: 'exchange_envelope', body: { normalized: true } },
  });
  const adapter = createProject0Adapter(command, recorder.invoke);
  const addressed = await adapter.address({ offered: 'witness' });
  assert.equal(addressed.ok, true);
  assert.deepEqual(recorder.requests[0], {
    schema: 'project0/world-encounter-stdio/v0.1',
    operation: 'address',
    recordType: 'exchange_envelope',
    body: { offered: 'witness' },
  });

  const verifyRecorder = recordingInvoker({
    schema: 'project0/world-encounter-stdio-response/v0.1',
    ok: true,
    operation: 'verify',
    record: { ref: `enc-${'b'.repeat(64)}`, digestHex: 'b'.repeat(64), recordType: 'exchange_envelope', body: { normalized: true } },
  });
  const verifyAdapter = createProject0Adapter(command, verifyRecorder.invoke);
  await verifyAdapter.verify(`enc-${'b'.repeat(64)}`, { offered: 'witness' });
  assert.deepEqual(verifyRecorder.requests[0], {
    schema: 'project0/world-encounter-stdio/v0.1',
    operation: 'verify',
    recordType: 'exchange_envelope',
    expectedRef: `enc-${'b'.repeat(64)}`,
    body: { offered: 'witness' },
  });
});

test('Corpus client fixes the destination frame/profile and never accepts authority fields from Full Measure', async () => {
  const recorder = recordingInvoker({
    schema: 'corpus-os/world-encounter-stdio-response/v0.1',
    ok: true,
    result: {
      status: 'admitted',
      reasonCode: 'CORPUS_ENCOUNTER_ADMITTED',
      destinationFrameRef: 'corpus-os:casework-v0.1',
      envelopeRef: `enc-${'c'.repeat(64)}`,
      authorityTransfer: 'none',
      callerAuthenticated: false,
      legalValidity: 'unclaimed',
      outputRefs: [],
      evidenceRefs: [],
    },
  });
  const adapter = createCorpusAdapter(command, recorder.invoke);
  const result = await adapter.evaluate({
    envelopeRef: `enc-${'c'.repeat(64)}`,
    destinationSubjectRef: 'artifact:agreement-a',
    input: 'bounded testimony',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(recorder.requests[0], {
    schema: 'corpus-os/world-encounter-admission/v0.1',
    envelopeRef: `enc-${'c'.repeat(64)}`,
    destinationFrameRef: 'corpus-os:casework-v0.1',
    profile: 'casework.synthetic-echo/v0.1',
    destinationSubjectRef: 'artifact:agreement-a',
    input: 'bounded testimony',
  });
  assert.equal('actorId' in (recorder.requests[0] as any), false);
  assert.equal('warrant' in (recorder.requests[0] as any), false);
});

test('donor clients distinguish donor refusal from malformed local wrapper contracts', async () => {
  const donorFailure = recordingInvoker({
    schema: 'project0/world-encounter-stdio-response/v0.1',
    ok: false,
    error: { code: 'ENCOUNTER_ADDRESS_MISMATCH' },
  });
  const failed = await createProject0Adapter(command, donorFailure.invoke).verify(
    `enc-${'0'.repeat(64)}`,
    { offered: 'witness' },
  );
  assert.equal(failed.ok, false);
  if (!failed.ok) {
    assert.equal(failed.kind, 'donor');
    assert.equal(failed.code, 'ENCOUNTER_ADDRESS_MISMATCH');
  }

  const malformed = recordingInvoker({ schema: 'wrong/schema', ok: true });
  const invalid = await createTranchNodeAdapter(command, malformed.invoke).decode({
    stroke: {}, layout: {}, templates: [], decoder: {},
  });
  assert.equal(invalid.ok, false);
  if (!invalid.ok) assert.equal(invalid.kind, 'contract');
});

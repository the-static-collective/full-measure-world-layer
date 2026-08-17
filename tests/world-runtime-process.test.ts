import assert from 'node:assert/strict';
import test from 'node:test';

import {
  invokeJsonProcess,
  resolveDonorProcessConfig,
  type ProcessAdapterCommand,
} from '../src/lib/worldRuntime/processAdapter.js';

const command: ProcessAdapterCommand = {
  executable: process.execPath,
  args: ['tests/fixtures/process-adapter-fixture.mjs'],
  cwd: process.cwd(),
};

const limits = {
  timeoutMs: 250,
  maxInputBytes: 1024,
  maxOutputBytes: 1024,
};

test('bounded process adapter exchanges exactly one JSON request and response', async () => {
  const result = await invokeJsonProcess(command, { mode: 'echo', value: { hello: 'world' } }, limits);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    schema: 'fixture/process-response/v0.1',
    ok: true,
    value: { hello: 'world' },
    argv: [],
  });
});

test('process adapter preserves a structured donor response even when the donor exits nonzero', async () => {
  const result = await invokeJsonProcess(command, { mode: 'structured-exit' }, limits);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(result.value, {
    schema: 'fixture/process-response/v0.1',
    ok: false,
    error: { code: 'DONOR_REFUSAL' },
  });
});

test('process adapter rejects oversized input before spawning', async () => {
  const result = await invokeJsonProcess(command, { mode: 'echo', value: 'x'.repeat(2_000) }, limits);
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.kind, 'input-too-large');
});

test('process adapter distinguishes timeout, bare nonzero exit, malformed output, oversized output, and unavailable command', async () => {
  const timeout = await invokeJsonProcess(command, { mode: 'hang' }, limits);
  assert.equal(timeout.ok, false);
  if (!timeout.ok) assert.equal(timeout.kind, 'timeout');

  const exit = await invokeJsonProcess(command, { mode: 'exit' }, limits);
  assert.equal(exit.ok, false);
  if (!exit.ok) {
    assert.equal(exit.kind, 'process-exit');
    assert.equal(exit.exitCode, 7);
  }

  const malformed = await invokeJsonProcess(command, { mode: 'malformed' }, limits);
  assert.equal(malformed.ok, false);
  if (!malformed.ok) assert.equal(malformed.kind, 'malformed-output');

  const oversized = await invokeJsonProcess(command, { mode: 'oversize' }, limits);
  assert.equal(oversized.ok, false);
  if (!oversized.ok) assert.equal(oversized.kind, 'output-too-large');

  const unavailable = await invokeJsonProcess(
    { executable: '/definitely/not/a/real/program', args: [], cwd: process.cwd() },
    { mode: 'echo' },
    limits,
  );
  assert.equal(unavailable.ok, false);
  if (!unavailable.ok) assert.equal(unavailable.kind, 'unavailable');
});

test('donor process configuration is an allowlisted repo path plus fixed executable and argv, never a shell command string', () => {
  const env = {
    BOOT_HOUSE_TRANCHNODE_REPO: '/repos/tranchnode',
    BOOT_HOUSE_PROJECT0_REPO: '/repos/project0',
    BOOT_HOUSE_CORPUS_OS_REPO: '/repos/corpus-os',
  };

  assert.deepEqual(resolveDonorProcessConfig('tranchnode', env, 'linux'), {
    executable: 'npm',
    args: ['run', '--silent', 'intent-stroke:stdio'],
    cwd: '/repos/tranchnode',
  });
  assert.deepEqual(resolveDonorProcessConfig('project0', env, 'linux'), {
    executable: 'npm',
    args: ['run', '--silent', 'world-encounter:stdio'],
    cwd: '/repos/project0',
  });
  assert.deepEqual(resolveDonorProcessConfig('corpus-os', env, 'win32'), {
    executable: 'npm.cmd',
    args: ['run', '--silent', 'world-encounter:stdio'],
    cwd: '/repos/corpus-os',
  });
  assert.equal(resolveDonorProcessConfig('tranchnode', {}, 'linux'), null);
});

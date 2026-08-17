import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JsonProcessError,
  runJsonProcess,
  type JsonProcessCommand,
} from '../src/world-runtime/processPort.js';

const nodeCommand = (script: string, overrides: Partial<JsonProcessCommand> = {}): JsonProcessCommand => ({
  command: process.execPath,
  args: ['-e', script],
  timeoutMs: 1_000,
  maxOutputBytes: 16_384,
  ...overrides,
});

test('runs one JSON request through argv-only child process transport', async () => {
  const response = await runJsonProcess<{ hello: string }, { echoed: string }>(
    nodeCommand(`
      let input = '';
      process.stdin.setEncoding('utf8');
      process.stdin.on('data', (chunk) => input += chunk);
      process.stdin.on('end', () => {
        const body = JSON.parse(input);
        process.stdout.write(JSON.stringify({ echoed: body.hello }));
      });
    `),
    { hello: 'house' },
  );

  assert.deepEqual(response, { echoed: 'house' });
});

test('non-zero child exit is an operational adapter failure', async () => {
  await assert.rejects(
    runJsonProcess(
      nodeCommand(`process.stderr.write('donor exploded'); process.exit(7);`),
      { hello: 'house' },
    ),
    (error: unknown) => {
      assert.equal(error instanceof JsonProcessError, true);
      assert.equal((error as JsonProcessError).code, 'PROCESS_EXIT_NONZERO');
      assert.equal((error as JsonProcessError).exitCode, 7);
      assert.equal((error as JsonProcessError).response, undefined);
      return true;
    },
  );
});

test('non-zero child may preserve one structured JSON response without making exit successful', async () => {
  await assert.rejects(
    runJsonProcess(
      nodeCommand(`
        process.stdout.write(JSON.stringify({
          schema: 'donor.error/v0.1',
          status: 'error',
          code: 'DECLARED_VALIDATION_FAILURE'
        }));
        process.exit(2);
      `),
      { hello: 'house' },
    ),
    (error: unknown) => {
      assert.equal(error instanceof JsonProcessError, true);
      const processError = error as JsonProcessError;
      assert.equal(processError.code, 'PROCESS_EXIT_NONZERO');
      assert.equal(processError.exitCode, 2);
      assert.deepEqual(processError.response, {
        schema: 'donor.error/v0.1',
        status: 'error',
        code: 'DECLARED_VALIDATION_FAILURE',
      });
      return true;
    },
  );
});

test('timeout kills the donor process and fails operationally', async () => {
  await assert.rejects(
    runJsonProcess(
      nodeCommand(`setTimeout(() => process.stdout.write('{}'), 10_000);`, { timeoutMs: 25 }),
      { hello: 'house' },
    ),
    (error: unknown) => {
      assert.equal(error instanceof JsonProcessError, true);
      assert.equal((error as JsonProcessError).code, 'PROCESS_TIMEOUT');
      return true;
    },
  );
});

test('stdout larger than the declared bound is killed and rejected', async () => {
  await assert.rejects(
    runJsonProcess(
      nodeCommand(`process.stdout.write('x'.repeat(4096));`, { maxOutputBytes: 256 }),
      { hello: 'house' },
    ),
    (error: unknown) => {
      assert.equal(error instanceof JsonProcessError, true);
      assert.equal((error as JsonProcessError).code, 'PROCESS_OUTPUT_TOO_LARGE');
      return true;
    },
  );
});

test('invalid donor stdout never becomes a runtime disposition', async () => {
  await assert.rejects(
    runJsonProcess(nodeCommand(`process.stdout.write('not-json');`), { hello: 'house' }),
    (error: unknown) => {
      assert.equal(error instanceof JsonProcessError, true);
      assert.equal((error as JsonProcessError).code, 'PROCESS_INVALID_JSON');
      return true;
    },
  );
});

import { spawn } from 'node:child_process';

export type JsonProcessErrorCode =
  | 'PROCESS_SPAWN_FAILURE'
  | 'PROCESS_EXIT_NONZERO'
  | 'PROCESS_TIMEOUT'
  | 'PROCESS_INPUT_TOO_LARGE'
  | 'PROCESS_OUTPUT_TOO_LARGE'
  | 'PROCESS_INVALID_JSON';

export interface JsonProcessCommand {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs: number;
  maxInputBytes: number;
  maxOutputBytes: number;
}

export class JsonProcessError extends Error {
  readonly code: JsonProcessErrorCode;
  readonly exitCode?: number | null;
  readonly stderr?: string;
  readonly response?: unknown;

  constructor(
    code: JsonProcessErrorCode,
    message: string,
    options: {
      exitCode?: number | null;
      stderr?: string;
      response?: unknown;
      cause?: unknown;
    } = {},
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'JsonProcessError';
    this.code = code;
    this.exitCode = options.exitCode;
    this.stderr = options.stderr;
    this.response = options.response;
  }
}

function parseJsonEvidence(stdout: string): unknown | undefined {
  if (!stdout.trim()) return undefined;
  try {
    return JSON.parse(stdout);
  } catch {
    return undefined;
  }
}

export async function runJsonProcess<TRequest, TResponse>(
  command: JsonProcessCommand,
  request: TRequest,
): Promise<TResponse> {
  if (
    !command.command
    || command.timeoutMs <= 0
    || command.maxInputBytes <= 0
    || command.maxOutputBytes <= 0
  ) {
    throw new JsonProcessError('PROCESS_SPAWN_FAILURE', 'invalid process command configuration');
  }

  const payload = JSON.stringify(request);
  if (Buffer.byteLength(payload, 'utf8') > command.maxInputBytes) {
    throw new JsonProcessError('PROCESS_INPUT_TOO_LARGE', 'donor process exceeded input bound');
  }

  return await new Promise<TResponse>((resolve, reject) => {
    const child = spawn(command.command, [...command.args], {
      cwd: command.cwd,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];
    let outputBytes = 0;
    let settled = false;
    let forcedError: JsonProcessError | null = null;

    const rejectOnce = (error: JsonProcessError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };

    const timer = setTimeout(() => {
      forcedError = new JsonProcessError('PROCESS_TIMEOUT', 'donor process exceeded timeout');
      child.kill('SIGKILL');
    }, command.timeoutMs);

    const collect = (chunk: Buffer, target: Buffer[]) => {
      if (settled || forcedError) return;
      outputBytes += chunk.byteLength;
      if (outputBytes > command.maxOutputBytes) {
        forcedError = new JsonProcessError(
          'PROCESS_OUTPUT_TOO_LARGE',
          'donor process exceeded output bound',
        );
        child.kill('SIGKILL');
        return;
      }
      target.push(Buffer.from(chunk));
    };

    child.stdout.on('data', (chunk: Buffer) => collect(chunk, stdoutChunks));
    child.stderr.on('data', (chunk: Buffer) => collect(chunk, stderrChunks));

    child.on('error', (error) => {
      rejectOnce(new JsonProcessError('PROCESS_SPAWN_FAILURE', 'unable to start donor process', {
        cause: error,
      }));
    });

    child.on('close', (code) => {
      if (settled) return;
      clearTimeout(timer);

      if (forcedError) {
        rejectOnce(forcedError);
        return;
      }

      const stdout = Buffer.concat(stdoutChunks).toString('utf8');
      const stderr = Buffer.concat(stderrChunks).toString('utf8');

      if (code !== 0) {
        rejectOnce(new JsonProcessError(
          'PROCESS_EXIT_NONZERO',
          `donor process exited with code ${String(code)}`,
          {
            exitCode: code,
            stderr,
            response: parseJsonEvidence(stdout),
          },
        ));
        return;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(stdout);
      } catch (error) {
        rejectOnce(new JsonProcessError(
          'PROCESS_INVALID_JSON',
          'donor process did not emit one valid JSON response',
          { stderr, cause: error },
        ));
        return;
      }

      settled = true;
      resolve(parsed as TResponse);
    });

    child.stdin.on('error', (error) => {
      if (!settled && !forcedError) {
        rejectOnce(new JsonProcessError('PROCESS_SPAWN_FAILURE', 'unable to write donor request', {
          cause: error,
        }));
      }
    });
    child.stdin.end(payload);
  });
}

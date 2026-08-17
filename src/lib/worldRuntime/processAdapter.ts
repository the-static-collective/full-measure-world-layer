import { spawn } from 'node:child_process';

export interface ProcessAdapterCommand {
  executable: string;
  args: string[];
  cwd: string;
}

export interface ProcessAdapterLimits {
  timeoutMs: number;
  maxInputBytes: number;
  maxOutputBytes: number;
}

export type JsonProcessResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      kind:
        | 'input-too-large'
        | 'timeout'
        | 'process-exit'
        | 'malformed-output'
        | 'output-too-large'
        | 'unavailable';
      exitCode?: number | null;
      stderr?: string;
    };

export type JsonProcessInvoker = (
  command: ProcessAdapterCommand,
  request: unknown,
  limits?: ProcessAdapterLimits,
) => Promise<JsonProcessResult>;

const DEFAULT_LIMITS: ProcessAdapterLimits = {
  timeoutMs: 5_000,
  maxInputBytes: 1_048_576,
  maxOutputBytes: 1_048_576,
};

function boundedText(current: string, chunk: string, maxBytes: number): string {
  if (Buffer.byteLength(current, 'utf8') >= maxBytes) return current;
  const remaining = maxBytes - Buffer.byteLength(current, 'utf8');
  const bytes = Buffer.from(chunk, 'utf8');
  return current + bytes.subarray(0, remaining).toString('utf8');
}

export const invokeJsonProcess: JsonProcessInvoker = async (
  command,
  request,
  limits = DEFAULT_LIMITS,
) => {
  let serialized: string;
  try {
    serialized = `${JSON.stringify(request)}\n`;
  } catch {
    return { ok: false, kind: 'malformed-output' };
  }

  if (Buffer.byteLength(serialized, 'utf8') > limits.maxInputBytes) {
    return { ok: false, kind: 'input-too-large' };
  }

  return await new Promise<JsonProcessResult>((resolve) => {
    let settled = false;
    let stdout = '';
    let stdoutBytes = 0;
    let stderr = '';
    let outputTooLarge = false;
    let timedOut = false;

    const finish = (result: JsonProcessResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const child = spawn(command.executable, command.args, {
      cwd: command.cwd,
      shell: false,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, limits.timeoutMs);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      stdoutBytes += Buffer.byteLength(chunk, 'utf8');
      if (stdoutBytes > limits.maxOutputBytes) {
        outputTooLarge = true;
        child.kill('SIGKILL');
        return;
      }
      stdout += chunk;
    });

    child.stderr.on('data', (chunk: string) => {
      stderr = boundedText(stderr, chunk, limits.maxOutputBytes);
    });

    child.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        finish({ ok: false, kind: 'unavailable', stderr: error.message });
        return;
      }
      finish({ ok: false, kind: 'unavailable', stderr: error.message });
    });

    child.on('close', (code) => {
      if (settled) return;
      if (timedOut) {
        finish({ ok: false, kind: 'timeout', exitCode: code, stderr });
        return;
      }
      if (outputTooLarge) {
        finish({ ok: false, kind: 'output-too-large', exitCode: code, stderr });
        return;
      }
      if (code !== 0) {
        finish({ ok: false, kind: 'process-exit', exitCode: code, stderr });
        return;
      }

      try {
        const value = JSON.parse(stdout.trim()) as unknown;
        finish({ ok: true, value });
      } catch {
        finish({ ok: false, kind: 'malformed-output', exitCode: code, stderr });
      }
    });

    child.stdin.on('error', () => {
      // A child that exits early is classified by its process error/exit event.
    });
    child.stdin.end(serialized);
  });
};

type DonorName = 'tranchnode' | 'project0' | 'corpus-os';
type EnvLike = Record<string, string | undefined>;

export function resolveDonorProcessConfig(
  donor: DonorName,
  env: EnvLike = process.env,
  platform: NodeJS.Platform = process.platform,
): ProcessAdapterCommand | null {
  const definitions = {
    tranchnode: {
      envKey: 'BOOT_HOUSE_TRANCHNODE_REPO',
      script: 'intent-stroke:stdio',
    },
    project0: {
      envKey: 'BOOT_HOUSE_PROJECT0_REPO',
      script: 'world-encounter:stdio',
    },
    'corpus-os': {
      envKey: 'BOOT_HOUSE_CORPUS_OS_REPO',
      script: 'world-encounter:stdio',
    },
  } as const;

  const definition = definitions[donor];
  const cwd = env[definition.envKey]?.trim();
  if (!cwd) return null;

  return {
    executable: platform === 'win32' ? 'npm.cmd' : 'npm',
    args: ['run', '--silent', definition.script],
    cwd,
  };
}

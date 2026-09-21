import {
  invokeJsonProcess,
  type JsonProcessInvoker,
  type ProcessAdapterCommand,
} from '../worldRuntime/processAdapter.js';

type EnvLike = Record<string, string | undefined>;

export type GraceDogramRequest =
  | {
      operation: 'successor_delta';
      beforeActions: string[];
      afterActions: string[];
    }
  | {
      operation: 'budget_rounding';
      weights: Record<string, number>;
      budget: number;
      method?: 'largest_fractional_remainder' | 'declared_order_remainder';
    };

export type GraceDogramResult =
  | {ok: true; value: Record<string, unknown>}
  | {
      ok: false;
      kind: 'unavailable' | 'transport' | 'contract' | 'donor';
      code: string;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function resolveGraceDogramProcessConfig(
  env: EnvLike = process.env,
  platform: NodeJS.Platform = process.platform,
): ProcessAdapterCommand | null {
  const cwd = env.GRACE_DOGRAM_REPO?.trim();
  if (!cwd) return null;

  return {
    executable: platform === 'win32' ? 'python' : 'python3',
    args: ['-m', 'dogram.game_mechanics_stdio'],
    cwd,
  };
}

export function createGraceDogramAdapter(
  command: ProcessAdapterCommand,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  return {
    async calculate(request: GraceDogramRequest): Promise<GraceDogramResult> {
      const response = await invoke(command, {
        schema: 'dogram/game-mechanics-stdio-request/v0.1',
        ...request,
      });

      if (response.ok === false) {
        return {
          ok: false,
          kind: 'transport',
          code: `DOGRAM_${response.kind.toUpperCase().replaceAll('-', '_')}`,
        };
      }

      if (!isRecord(response.value)) {
        return {ok: false, kind: 'contract', code: 'DOGRAM_RESPONSE_NOT_OBJECT'};
      }
      if (response.value.schema !== 'dogram/game-mechanics-stdio-response/v0.1') {
        return {ok: false, kind: 'contract', code: 'DOGRAM_RESPONSE_SCHEMA_MISMATCH'};
      }
      if (response.value.authority !== 'none') {
        return {ok: false, kind: 'contract', code: 'DOGRAM_AUTHORITY_MUST_BE_NONE'};
      }

      if (response.value.ok === false) {
        const error = response.value.error;
        if (!isRecord(error) || typeof error.code !== 'string') {
          return {ok: false, kind: 'contract', code: 'DOGRAM_ERROR_CONTRACT_INVALID'};
        }
        return {ok: false, kind: 'donor', code: error.code};
      }

      if (response.value.ok !== true || !isRecord(response.value.result)) {
        return {ok: false, kind: 'contract', code: 'DOGRAM_SUCCESS_CONTRACT_INVALID'};
      }

      return {ok: true, value: response.value.result};
    },
  };
}

export function createGraceDogramService(
  env: EnvLike = process.env,
  platform: NodeJS.Platform = process.platform,
  invoke: JsonProcessInvoker = invokeJsonProcess,
) {
  const command = resolveGraceDogramProcessConfig(env, platform);
  const adapter = command ? createGraceDogramAdapter(command, invoke) : null;

  return {
    availability() {
      return {
        configured: adapter !== null,
        donor: 'Dogram',
        authority: 'none' as const,
      };
    },

    async calculate(request: GraceDogramRequest): Promise<GraceDogramResult> {
      if (!adapter) {
        return {
          ok: false,
          kind: 'unavailable',
          code: 'DOGRAM_NOT_CONFIGURED',
        };
      }
      return await adapter.calculate(request);
    },
  };
}

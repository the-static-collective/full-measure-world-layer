export interface WorldRuntimeFetchResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

export type WorldRuntimeFetch = (
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
) => Promise<WorldRuntimeFetchResponse>;

export type WorldRuntimeHttpClientResult<T = unknown> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: unknown };

async function request<T>(
  fetcher: WorldRuntimeFetch,
  url: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  },
): Promise<WorldRuntimeHttpClientResult<T>> {
  let response: WorldRuntimeFetchResponse;
  try {
    response = await fetcher(url, init);
  } catch {
    return {
      ok: false,
      status: 0,
      body: { error: 'WORLD_RUNTIME_HTTP_UNAVAILABLE' },
    };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return {
      ok: false,
      status: response.status,
      body: { error: 'WORLD_RUNTIME_HTTP_RESPONSE_UNREADABLE' },
    };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, body };
  }
  return { ok: true, status: response.status, body: body as T };
}

function post<T>(fetcher: WorldRuntimeFetch, url: string, body: unknown) {
  return request<T>(fetcher, url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function createWorldRuntimeClient(
  fetcher: WorldRuntimeFetch = globalThis.fetch as unknown as WorldRuntimeFetch,
) {
  return {
    getField<T = unknown>() {
      return request<T>(fetcher, '/api/world/field');
    },

    getDoors<T = unknown>() {
      return request<T>(fetcher, '/api/world/doors');
    },

    decodeStroke<T = unknown>(body: unknown) {
      return post<T>(fetcher, '/api/world/stroke/decode', body);
    },

    prepareEncounter<T = unknown>(body: unknown) {
      return post<T>(fetcher, '/api/world/encounter/prepare', body);
    },

    confirmEncounter<T = unknown>(body: unknown) {
      return post<T>(fetcher, '/api/world/encounter/confirm', body);
    },

    getResidue<T = unknown>(residueRef: string) {
      return request<T>(fetcher, `/api/world/residue/${encodeURIComponent(residueRef)}`);
    },
  };
}

export const worldRuntimeClient = createWorldRuntimeClient();

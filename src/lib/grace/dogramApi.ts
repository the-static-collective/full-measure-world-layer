export interface DogramSuccessorDelta {
  experiment: string;
  before_actions: string[];
  after_actions: string[];
  foreclosed: string[];
  newly_available: string[];
  retained: string[];
  authority: "none";
}

export type DogramSuccessorResult =
  | {status: "live"; value: DogramSuccessorDelta}
  | {status: "unavailable"; code: string}
  | {status: "error"; code: string};

type FetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Pick<Response, "ok" | "status" | "json">>;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseDelta(value: unknown): DogramSuccessorDelta | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.experiment !== "string" ||
    !isStringArray(record.before_actions) ||
    !isStringArray(record.after_actions) ||
    !isStringArray(record.foreclosed) ||
    !isStringArray(record.newly_available) ||
    !isStringArray(record.retained) ||
    record.authority !== "none"
  ) {
    return null;
  }
  return record as unknown as DogramSuccessorDelta;
}

export async function requestDogramSuccessorDelta(
  beforeActions: string[],
  afterActions: string[],
  fetchImpl: FetchLike = fetch,
): Promise<DogramSuccessorResult> {
  try {
    const response = await fetchImpl("/api/grace/dogram/calculate", {
      method: "POST",
      headers: {"content-type": "application/json"},
      body: JSON.stringify({
        operation: "successor_delta",
        beforeActions,
        afterActions,
      }),
    });
    const body = await response.json() as any;

    if (response.ok && body?.ok === true) {
      const parsed = parseDelta(body.value);
      return parsed
        ? {status: "live", value: parsed}
        : {status: "error", code: "DOGRAM_BROWSER_CONTRACT_INVALID"};
    }

    const code = typeof body?.code === "string" ? body.code : "DOGRAM_REQUEST_FAILED";
    return response.status === 503
      ? {status: "unavailable", code}
      : {status: "error", code};
  } catch {
    return {status: "unavailable", code: "DOGRAM_HTTP_UNAVAILABLE"};
  }
}

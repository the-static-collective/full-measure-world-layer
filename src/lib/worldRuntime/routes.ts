import type { WorldRuntimeHttpResult } from './http.js';

interface RouteRequest {
  body: unknown;
  params: Record<string, string>;
}

interface RouteResponse {
  status(code: number): RouteResponse;
  json(value: unknown): unknown;
}

interface WorldRuntimeRouteApp {
  get(path: string, handler: (req: RouteRequest, res: RouteResponse) => unknown): unknown;
  post(path: string, handler: (req: RouteRequest, res: RouteResponse) => unknown): unknown;
}

interface WorldRuntimeRouteHandlers {
  field(): Promise<WorldRuntimeHttpResult>;
  doors(): Promise<WorldRuntimeHttpResult>;
  decode(body: any): Promise<WorldRuntimeHttpResult>;
  prepare(body: unknown): Promise<WorldRuntimeHttpResult>;
  confirm(body: any): Promise<WorldRuntimeHttpResult>;
  residue(ref: string): Promise<WorldRuntimeHttpResult>;
}

function send(res: RouteResponse, result: WorldRuntimeHttpResult): unknown {
  return res.status(result.status).json(result.body);
}

export function registerWorldRuntimeRoutes(
  app: WorldRuntimeRouteApp,
  handlers: WorldRuntimeRouteHandlers,
): void {
  app.get('/api/world/field', async (_req, res) => send(res, await handlers.field()));
  app.get('/api/world/doors', async (_req, res) => send(res, await handlers.doors()));
  app.post('/api/world/stroke/decode', async (req, res) => send(res, await handlers.decode(req.body)));
  app.post('/api/world/encounter/prepare', async (req, res) => send(res, await handlers.prepare(req.body)));
  app.post('/api/world/encounter/confirm', async (req, res) => send(res, await handlers.confirm(req.body)));
  app.get('/api/world/residue/:ref', async (req, res) => send(res, await handlers.residue(req.params.ref)));
}

import { Router, type Request } from 'express';

import type { WorldRuntime } from './orchestrator.js';
import type { WorldDoorProjection } from './contracts.js';
import type { WorldRuntimeUnavailableReason } from './config.js';

const MAX_COORDINATE = 1_000_000;
const MAX_POINTS = 512;

export interface WorldRuntimeRouterOptions {
  runtime: WorldRuntime;
  offeredWitnessRef: string;
  resolveActorId(request: Request): string;
}

export interface UnavailableWorldRuntimeRouterOptions {
  reasonCode: WorldRuntimeUnavailableReason;
  doors: WorldDoorProjection[];
}

interface ClientPoint {
  x: number;
  y: number;
}

function parseClientPoints(value: unknown): ClientPoint[] | undefined {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_POINTS) return undefined;

  const points: ClientPoint[] = [];
  for (const raw of value) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined;
    const { x, y } = raw as Record<string, unknown>;
    if (
      typeof x !== 'number'
      || typeof y !== 'number'
      || !Number.isSafeInteger(x)
      || !Number.isSafeInteger(y)
      || x < 0
      || y < 0
      || x > MAX_COORDINATE
      || y > MAX_COORDINATE
    ) {
      return undefined;
    }
    points.push({ x, y });
  }
  return points;
}

function errorClass(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return 'WORLD_RUNTIME_ADAPTER_FAILURE';
}

export function createUnavailableWorldRuntimeRouter(
  options: UnavailableWorldRuntimeRouterOptions,
): Router {
  const router = Router();
  const field = {
    fieldRef: 'full-measure:garden/world-field/v0.1',
    projectionVersion: 'full-measure.world-field/v0.1',
    doors: options.doors.map((door) => ({
      ...door,
      provenanceRefs: [...door.provenanceRefs],
      relevanceReasons: [...door.relevanceReasons],
    })),
    admittedDestinationRefs: [],
    visibleResidueRefs: [],
  };

  router.get('/field', (_req, res) => {
    res.json({
      available: false,
      reasonCode: options.reasonCode,
      field,
    });
  });

  router.use((_req, res) => {
    return res.status(503).json({
      kind: 'world-runtime-unavailable',
      reasonCode: options.reasonCode,
    });
  });

  return router;
}

export function createWorldRuntimeRouter(options: WorldRuntimeRouterOptions): Router {
  if (!options.offeredWitnessRef.trim()) {
    throw new Error('world runtime HTTP router requires one server-pinned offered witness ref');
  }

  const router = Router();
  let strokeSequence = 0;

  router.get('/field', (_req, res) => {
    res.json({
      available: true,
      field: options.runtime.getField(),
    });
  });

  router.post('/decode', async (req, res) => {
    const points = parseClientPoints(req.body?.points);
    if (!points) {
      return res.status(400).json({
        kind: 'invalid-gesture',
        reasonCode: 'WORLD_GESTURE_INVALID',
      });
    }

    strokeSequence += 1;
    try {
      const result = await options.runtime.decodeStroke({
        rawStrokeRef: `full-measure:http-stroke:${strokeSequence}`,
        points: points.map((point, sequence) => ({ sequence, ...point })),
      });
      return res.json(result);
    } catch (error: unknown) {
      return res.status(502).json({
        kind: 'adapter-failed',
        stage: 'traversal',
        failureClass: errorClass(error),
      });
    }
  });

  router.post('/cross', async (req, res) => {
    const pendingId = typeof req.body?.pendingId === 'string' ? req.body.pendingId.trim() : '';
    const doorRef = typeof req.body?.doorRef === 'string' ? req.body.doorRef.trim() : '';
    const confirmed = req.body?.confirmed === true;
    if (!pendingId || !doorRef || !confirmed) {
      return res.status(400).json({
        kind: 'invalid-crossing-request',
        reasonCode: 'WORLD_CROSSING_CONFIRMATION_REQUIRED',
      });
    }

    const actorId = options.resolveActorId(req).trim();
    if (!actorId) {
      return res.status(403).json({
        kind: 'crossing-unavailable',
        reasonCode: 'WORLD_ACTOR_REQUIRED',
      });
    }

    try {
      const result = await options.runtime.confirmCrossing({
        pendingId,
        doorRef,
        confirmed: true,
        offeredWitnessRefs: [options.offeredWitnessRef],
        confirmedBy: actorId,
      });
      return res.json(result);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'pending traversal not found') {
        return res.status(409).json({
          kind: 'crossing-unavailable',
          reasonCode: 'WORLD_PENDING_TRAVERSAL_NOT_FOUND',
        });
      }
      if (
        error instanceof Error
        && (
          error.message === 'confirmed door is not part of the current field'
          || error.message === 'confirmed door is not a leading traversal candidate'
          || error.message === 'confirmed door is not currently reachable'
        )
      ) {
        return res.status(409).json({
          kind: 'crossing-unavailable',
          reasonCode: 'WORLD_CONFIRMED_DOOR_NOT_AVAILABLE',
        });
      }
      return res.status(502).json({
        kind: 'adapter-failed',
        stage: 'encounter-or-destination',
        failureClass: errorClass(error),
      });
    }
  });

  router.get('/residue/:residueRef', (req, res) => {
    const residueRef = req.params.residueRef;
    if (typeof residueRef !== 'string' || !residueRef.trim()) {
      return res.status(400).json({ error: 'Residue reference is required' });
    }
    const residue = options.runtime.getResidue(residueRef);
    if (!residue) {
      return res.status(404).json({ error: 'Residue not found' });
    }
    return res.json(residue);
  });

  return router;
}

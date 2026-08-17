import type { Request, Router } from 'express';

import { createConfiguredWorldRuntime } from './config.js';
import {
  createUnavailableWorldRuntimeRouter,
  createWorldRuntimeRouter,
} from './http.js';

export interface WorldRuntimeApiOptions {
  env: Record<string, string | undefined>;
  resolveActorId(request: Request): string;
}

export function createWorldRuntimeApi(options: WorldRuntimeApiOptions): Router {
  const configured = createConfiguredWorldRuntime(options.env);
  if (configured.available === false) {
    return createUnavailableWorldRuntimeRouter({
      reasonCode: configured.reasonCode,
      doors: configured.doors,
    });
  }

  return createWorldRuntimeRouter({
    runtime: configured.runtime,
    offeredWitnessRef: configured.offeredWitnessRef,
    resolveActorId: options.resolveActorId,
  });
}

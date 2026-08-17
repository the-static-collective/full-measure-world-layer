export const GARDEN_WIDTH = 360;
export const GARDEN_HEIGHT = 220;

export const GARDEN_LAYOUT = Object.freeze({
  schema: 'tranchnode/intent-stroke-layout/v0.1',
  anchors: Object.freeze([
    Object.freeze({ id: 'garden-origin', x: 30, y: 110 }),
    Object.freeze({ id: 'garden-threshold', x: 130, y: 110 }),
    Object.freeze({ id: 'corpus-door', x: 320, y: 40 }),
    Object.freeze({ id: 'band-runtime-door', x: 320, y: 110 }),
    Object.freeze({ id: 'upper-room-door', x: 320, y: 180 }),
  ]),
});

export const GARDEN_DECODER = Object.freeze({
  id: 'tranchnode/intent-stroke-dtw',
  version: '0.1',
  interpolationStepsPerSegment: 4,
  endpointPenaltyMultiplier: 3,
});

export const GARDEN_TEMPLATES = Object.freeze([
  Object.freeze({
    id: 'garden-to-corpus',
    anchorIds: Object.freeze(['garden-origin', 'garden-threshold', 'corpus-door']),
  }),
  Object.freeze({
    id: 'garden-to-band-runtime',
    anchorIds: Object.freeze(['garden-origin', 'garden-threshold', 'band-runtime-door']),
  }),
  Object.freeze({
    id: 'garden-to-upper-room',
    anchorIds: Object.freeze(['garden-origin', 'garden-threshold', 'upper-room-door']),
  }),
]);

const TEMPLATE_TO_DOOR = new Map<string, string>([
  ['garden-to-corpus', 'world-door:corpus-casework-v0.1'],
  ['garden-to-band-runtime', 'world-door:band-runtime-fixture-v0.1'],
  ['garden-to-upper-room', 'world-door:upper-room-fixture-v0.1'],
]);

export interface RawPointerPoint {
  x: number;
  y: number;
}

export interface GardenStrokePoint {
  sequence: number;
  x: number;
  y: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizePointerStroke(points: RawPointerPoint[]): GardenStrokePoint[] {
  return points.map((point, sequence) => ({
    sequence,
    x: clamp(Math.round(point.x), 0, GARDEN_WIDTH),
    y: clamp(Math.round(point.y), 0, GARDEN_HEIGHT),
  }));
}

export function doorRefForTemplate(templateId: string): string | null {
  return TEMPLATE_TO_DOOR.get(templateId) ?? null;
}

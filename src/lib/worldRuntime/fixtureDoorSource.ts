import type { WorldDoorProjection, WorldFieldProjection } from './types.js';

const FIELD: WorldFieldProjection = {
  fieldRef: 'full-measure:garden:v0.1',
  projectionVersion: 'boot-the-house-fixture/v0.1',
  sourceMode: 'fixture',
  sourceRefs: [
    'full-measure:main:c62275019c452a881565e3a6ce444b6a66968714',
  ],
  unresolvedRefs: [
    'founder-node:pollen-scout-live-adapter-pending',
  ],
  excludedSourceClasses: [
    'private-material',
    'held-material',
    'destination-payload',
  ],
};

const DOORS: WorldDoorProjection[] = [
  {
    doorRef: 'world-door:corpus-casework-v0.1',
    destinationRef: 'corpus-os:casework-v0.1',
    relation: 'constitutional-encounter',
    reachability: 'reachable',
    provenanceRefs: [
      'tranchnode:main:bf886c0b4938a1444a79afb7a7b384e91b5d5197',
      'project0:main:6341b0223f2b57148d617dcc98d1e0d0c68e14a5',
      'corpus-os:main:63c0be4cd49c383ae167ded99103b79ba4626416',
    ],
    relevanceReasons: [
      'first approved destination-local admission specimen',
      'real bounded stdio boundary is landed',
    ],
    requiredCrossingProfile: 'casework.synthetic-echo/v0.1',
    authority: 'none',
    sourceMode: 'fixture',
  },
  {
    doorRef: 'world-door:band-runtime-fixture-v0.1',
    destinationRef: 'band-runtime:groove-room',
    relation: 'musical-encounter',
    reachability: 'unknown',
    provenanceRefs: [
      'boot-the-house:fixture:band-runtime-candidate',
    ],
    relevanceReasons: [
      'approved later candidate for a materially different sovereign room',
    ],
    requiredCrossingProfile: 'unresolved',
    authority: 'none',
    sourceMode: 'fixture',
  },
  {
    doorRef: 'world-door:upper-room-fixture-v0.1',
    destinationRef: 'upper-room:scripture-room',
    relation: 'reading-encounter',
    reachability: 'unknown',
    provenanceRefs: [
      'boot-the-house:fixture:upper-room-candidate',
    ],
    relevanceReasons: [
      'approved later candidate for a shared reading/witness room',
    ],
    requiredCrossingProfile: 'unresolved',
    authority: 'none',
    sourceMode: 'fixture',
  },
];

function cloneField(field: WorldFieldProjection): WorldFieldProjection {
  return {
    ...field,
    sourceRefs: [...field.sourceRefs],
    unresolvedRefs: [...field.unresolvedRefs],
    excludedSourceClasses: [...field.excludedSourceClasses],
  };
}

function cloneDoor(door: WorldDoorProjection): WorldDoorProjection {
  return {
    ...door,
    provenanceRefs: [...door.provenanceRefs],
    relevanceReasons: [...door.relevanceReasons],
  };
}

export function getFixtureWorldField(): WorldFieldProjection {
  return cloneField(FIELD);
}

export function getFixtureDoorProjection(): WorldDoorProjection[] {
  return DOORS.map(cloneDoor);
}

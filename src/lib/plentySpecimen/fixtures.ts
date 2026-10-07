import type {
  PlentyCapabilityClaim,
  PlentyEvaluationInput,
  PlentyParticular,
} from './types.js';

const SURFACES = [
  ['email', 'Email'],
  ['signal', 'Signal'],
  ['matrix', 'Matrix'],
  ['discord', 'Discord'],
  ['webz', 'webZ'],
  ['shared-document', 'shared document'],
  ['voip', 'VoIP'],
] as const;

export function createPowerCutSpecimen(): PlentyEvaluationInput {
  const particulars: PlentyParticular[] = [
    {
      particularRef: 'particular:power:primary',
      kind: 'power-source',
      sourceRefs: ['fixture:power-cut:primary-power'],
    },
    ...SURFACES.map(([slug]) => ({
      particularRef: `particular:surface:${slug}`,
      kind: 'communication-surface',
      sourceRefs: [`fixture:power-cut:surface:${slug}`],
    })),
  ];

  const power: PlentyCapabilityClaim = {
    capabilityRef: 'capability:power:primary',
    particularRef: 'particular:power:primary',
    capability: 'provide-electricity',
    evidenceClass: 'observed',
    provenanceKind: 'system-observation',
    currentness: 'current',
    availability: 'unavailable',
    access: 'accessible',
    authority: 'authorized',
    dependencyRefs: ['dependency:power:primary'],
    requiresCapabilityRefs: [],
    sourceRefs: ['fixture:power-cut:power-off'],
  };

  const communications: PlentyCapabilityClaim[] = SURFACES.map(([slug, label]) => ({
    capabilityRef: `capability:communicate:${slug}`,
    particularRef: `particular:surface:${slug}`,
    capability: 'communicate-100-miles',
    evidenceClass: 'observed',
    provenanceKind: 'system-observation',
    currentness: 'current',
    availability: 'available',
    access: 'accessible',
    authority: 'authorized',
    dependencyRefs: ['dependency:power:primary'],
    requiresCapabilityRefs: ['capability:power:primary'],
    sourceRefs: [`fixture:power-cut:${label}`],
  }));

  return {
    need: {
      needRef: 'need:communicate-100-miles',
      capabilityRequirement: 'communicate-100-miles',
    },
    particulars,
    capabilities: [power, ...communications],
    candidatePaths: SURFACES.map(([slug]) => ({
      pathRef: `path:communicate:${slug}`,
      needRef: 'need:communicate-100-miles',
      capabilityRefs: [
        `capability:communicate:${slug}`,
        'capability:power:primary',
      ],
      dependencyRefs: [],
      satisfiesCapabilityRequirement: true,
      constraintResults: [],
    })),
  };
}

import type {
  PlentyCapabilityClaim,
  PlentyCandidatePath,
  PlentyEvaluationInput,
  PlentyPathReceipt,
  PlentyReceipt,
} from './types.js';

export class PlentySpecimenError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'PlentySpecimenError';
    this.code = code;
  }
}

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function validate(input: PlentyEvaluationInput): Map<string, PlentyCapabilityClaim> {
  const particulars = new Map<string, PlentyEvaluationInput['particulars'][number]>();
  for (const item of input.particulars) {
    const existing = particulars.get(item.particularRef);
    if (existing && !sameRefs(existing.sourceRefs, item.sourceRefs)) {
      throw new PlentySpecimenError(
        'PLENTY_PARTICULAR_CONFLICT',
        `Conflicting particular identity: ${item.particularRef}`,
      );
    }
    if (!existing) particulars.set(item.particularRef, item);
  }

  const capabilities = new Map<string, PlentyCapabilityClaim>();
  for (const claim of input.capabilities) {
    if (!particulars.has(claim.particularRef)) {
      throw new PlentySpecimenError(
        'PLENTY_UNKNOWN_PARTICULAR',
        `Unknown particular: ${claim.particularRef}`,
      );
    }
    if (
      claim.evidenceClass === 'witnessed'
      && (
        claim.provenanceKind === 'model-output'
        || claim.provenanceKind === 'plenty-receipt'
        || claim.provenanceKind === 'self-report'
      )
    ) {
      throw new PlentySpecimenError(
        'PLENTY_WITNESS_LAUNDERING',
        `Provenance cannot establish witnessed evidence: ${claim.provenanceKind}`,
      );
    }
    capabilities.set(claim.capabilityRef, claim);
  }

  for (const path of input.candidatePaths) {
    if (path.needRef !== input.need.needRef) {
      throw new PlentySpecimenError(
        'PLENTY_NEED_MISMATCH',
        `Path ${path.pathRef} targets ${path.needRef}, not ${input.need.needRef}`,
      );
    }
    for (const capabilityRef of unique(path.capabilityRefs)) {
      if (!capabilities.has(capabilityRef)) {
        throw new PlentySpecimenError(
          'PLENTY_UNKNOWN_CAPABILITY',
          `Unknown capability: ${capabilityRef}`,
        );
      }
    }
  }

  return capabilities;
}

function deriveStructuralState(
  needRequirement: string,
  path: PlentyCandidatePath,
  capabilities: Map<string, PlentyCapabilityClaim>,
): 'complete' | 'incomplete' {
  if (!path.satisfiesCapabilityRequirement) return 'incomplete';

  const pathRefs = new Set(unique(path.capabilityRefs));
  const targetRefs = [...pathRefs].filter(
    (ref) => capabilities.get(ref)?.capability === needRequirement,
  );
  if (targetRefs.length === 0) return 'incomplete';

  const resolves = (ref: string, visiting: Set<string>): boolean => {
    if (!pathRefs.has(ref)) return false;
    if (visiting.has(ref)) return false;
    const claim = capabilities.get(ref);
    if (!claim) return false;
    const next = new Set(visiting);
    next.add(ref);
    return claim.requiresCapabilityRefs.every((requiredRef) => resolves(requiredRef, next));
  };

  return targetRefs.some((ref) => resolves(ref, new Set())) ? 'complete' : 'incomplete';
}

function deriveViabilityState(
  input: PlentyEvaluationInput,
  path: PlentyCandidatePath,
  claims: PlentyCapabilityClaim[],
  structuralState: 'complete' | 'incomplete',
): {
  state: 'viable' | 'blocked' | 'unresolved';
  blockingRefs: string[];
  unresolvedRefs: string[];
} {
  if (structuralState === 'incomplete') {
    return { state: 'blocked', blockingRefs: ['structure'], unresolvedRefs: [] };
  }

  const blockingRefs: string[] = [];
  const unresolvedRefs: string[] = [];

  for (const claim of claims) {
    if (
      claim.currentness === 'stale'
      || claim.availability === 'unavailable'
      || claim.access === 'inaccessible'
      || claim.authority === 'unauthorized'
    ) {
      blockingRefs.push(claim.capabilityRef);
      continue;
    }
    if (
      claim.currentness === 'unknown'
      || claim.availability === 'unknown'
      || claim.access === 'unknown'
      || claim.authority === 'unknown'
    ) {
      unresolvedRefs.push(claim.capabilityRef);
    }
  }

  const results = new Map(path.constraintResults.map((result) => [result.constraintRef, result]));
  for (const constraint of input.need.constraints ?? []) {
    if (!constraint.hard) continue;
    const result = results.get(constraint.constraintRef);
    if (!result || result.result === 'unknown') {
      unresolvedRefs.push(constraint.constraintRef);
    } else if (result.result === 'failed') {
      blockingRefs.push(constraint.constraintRef);
    }
  }

  if (blockingRefs.length > 0) {
    return {
      state: 'blocked',
      blockingRefs: unique(blockingRefs).sort(),
      unresolvedRefs: unique(unresolvedRefs).sort(),
    };
  }
  if (unresolvedRefs.length > 0) {
    return {
      state: 'unresolved',
      blockingRefs: [],
      unresolvedRefs: unique(unresolvedRefs).sort(),
    };
  }
  return { state: 'viable', blockingRefs: [], unresolvedRefs: [] };
}

function pathReceipt(
  input: PlentyEvaluationInput,
  capabilities: Map<string, PlentyCapabilityClaim>,
  path: PlentyCandidatePath,
): PlentyPathReceipt {
  const claims = unique(path.capabilityRefs).map((ref) => capabilities.get(ref)!);
  const dependencyRefs = unique([
    ...path.dependencyRefs,
    ...claims.flatMap((claim) => claim.dependencyRefs),
  ]).sort();
  const structuralState = deriveStructuralState(
    input.need.capabilityRequirement,
    path,
    capabilities,
  );
  const viability = deriveViabilityState(input, path, claims, structuralState);

  return {
    pathRef: path.pathRef,
    structuralState,
    viabilityState: viability.state,
    dependencyRefs,
    blockingRefs: viability.blockingRefs,
    unresolvedRefs: viability.unresolvedRefs,
  };
}

export function evaluatePlenty(input: PlentyEvaluationInput): PlentyReceipt {
  const capabilities = validate(input);
  const pathReceipts = input.candidatePaths.map((path) => pathReceipt(input, capabilities, path));
  const structurallyCompletePathCount = pathReceipts.filter(
    (path) => path.structuralState === 'complete',
  ).length;
  const viablePathCount = pathReceipts.filter((path) => path.viabilityState === 'viable').length;

  return {
    needRef: input.need.needRef,
    candidatePathCount: input.candidatePaths.length,
    structurallyCompletePathCount,
    viablePathCount,
    independentPathCount: viablePathCount > 0 ? 1 : 0,
    independentPathRefs:
      viablePathCount > 0
        ? [pathReceipts.find((path) => path.viabilityState === 'viable')!.pathRef]
        : [],
    blockingDependencyRefs: [],
    fragileDependencyRefs: [],
    unusedCapabilityRefs: input.capabilities
      .filter((claim) =>
        !input.candidatePaths.some((path) => path.capabilityRefs.includes(claim.capabilityRef))
      )
      .map((claim) => claim.capabilityRef)
      .sort(),
    unresolvedClaimRefs: input.capabilities
      .filter((claim) =>
        claim.currentness === 'unknown'
        || claim.availability === 'unknown'
        || claim.access === 'unknown'
        || claim.authority === 'unknown'
      )
      .map((claim) => claim.capabilityRef)
      .sort(),
    pathReceipts,
    disposition:
      structurallyCompletePathCount === 0
        ? 'NO_KNOWN_PATH'
        : viablePathCount === 0
          ? 'POSSIBILITIES_ONLY'
          : 'VIABLE_BUT_FRAGILE',
  };
}

export type {
  PlentyEvaluationInput,
  PlentyPathReceipt,
  PlentyReceipt,
} from './types.js';

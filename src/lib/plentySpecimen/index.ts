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

function canonicalPath(path: PlentyCandidatePath): string {
  return JSON.stringify({
    needRef: path.needRef,
    capabilityRefs: unique(path.capabilityRefs).sort(),
    dependencyRefs: unique(path.dependencyRefs).sort(),
    satisfiesCapabilityRequirement: path.satisfiesCapabilityRequirement,
    constraintResults: [...path.constraintResults]
      .map((result) => ({ ...result }))
      .sort((left, right) => left.constraintRef.localeCompare(right.constraintRef)),
  });
}

function validate(input: PlentyEvaluationInput): {
  capabilities: Map<string, PlentyCapabilityClaim>;
  candidatePaths: PlentyCandidatePath[];
} {
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

  const candidatePaths: PlentyCandidatePath[] = [];
  const pathIdentity = new Map<string, string>();
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

    const canonical = canonicalPath(path);
    const existing = pathIdentity.get(path.pathRef);
    if (existing !== undefined) {
      if (existing !== canonical) {
        throw new PlentySpecimenError(
          'PLENTY_PATH_CONFLICT',
          `Conflicting path identity: ${path.pathRef}`,
        );
      }
      continue;
    }
    pathIdentity.set(path.pathRef, canonical);
    candidatePaths.push({
      ...path,
      capabilityRefs: unique(path.capabilityRefs),
      dependencyRefs: unique(path.dependencyRefs),
      constraintResults: path.constraintResults.map((result) => ({ ...result })),
    });
  }

  return { capabilities, candidatePaths };
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

function pathFingerprint(
  path: PlentyCandidatePath,
  dependencyRefs: readonly string[],
): string {
  return JSON.stringify({
    capabilityRefs: unique(path.capabilityRefs).sort(),
    dependencyRefs: [...dependencyRefs].sort(),
  });
}

function lexicographicallyBefore(left: readonly string[], right: readonly string[]): boolean {
  const a = [...left].sort();
  const b = [...right].sort();
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    const comparison = a[index].localeCompare(b[index]);
    if (comparison < 0) return true;
    if (comparison > 0) return false;
  }
  return a.length < b.length;
}

function chooseIndependentPathRefs(
  viable: Array<{
    path: PlentyCandidatePath;
    receipt: PlentyPathReceipt;
  }>,
): string[] {
  const representatives = new Map<string, {
    pathRef: string;
    dependencies: Set<string>;
  }>();

  for (const entry of viable) {
    const fingerprint = pathFingerprint(entry.path, entry.receipt.dependencyRefs);
    const existing = representatives.get(fingerprint);
    if (!existing || entry.path.pathRef.localeCompare(existing.pathRef) < 0) {
      representatives.set(fingerprint, {
        pathRef: entry.path.pathRef,
        dependencies: new Set(entry.receipt.dependencyRefs),
      });
    }
  }

  const choices = [...representatives.values()]
    .sort((left, right) => left.pathRef.localeCompare(right.pathRef));

  let best: string[] = [];

  const visit = (
    index: number,
    selected: string[],
    usedDependencies: Set<string>,
  ): void => {
    if (selected.length + (choices.length - index) < best.length) return;
    if (index === choices.length) {
      const candidate = [...selected].sort();
      if (
        candidate.length > best.length
        || (candidate.length === best.length && lexicographicallyBefore(candidate, best))
      ) {
        best = candidate;
      }
      return;
    }

    const choice = choices[index];
    const conflicts = [...choice.dependencies].some((dep) => usedDependencies.has(dep));
    if (!conflicts) {
      const nextDependencies = new Set(usedDependencies);
      for (const dependency of choice.dependencies) nextDependencies.add(dependency);
      visit(index + 1, [...selected, choice.pathRef], nextDependencies);
    }

    visit(index + 1, selected, usedDependencies);
  };

  visit(0, [], new Set());
  return best;
}

export function evaluatePlenty(input: PlentyEvaluationInput): PlentyReceipt {
  const validated = validate(input);
  const capabilities = validated.capabilities;
  const candidatePaths = validated.candidatePaths;
  const evaluated = candidatePaths.map((path) => ({
    path,
    receipt: pathReceipt(input, capabilities, path),
  }));
  const pathReceipts = evaluated.map((entry) => entry.receipt);
  const structurallyCompletePathCount = pathReceipts.filter(
    (path) => path.structuralState === 'complete',
  ).length;
  const viableEntries = evaluated.filter((entry) => entry.receipt.viabilityState === 'viable');
  const viablePathCount = viableEntries.length;
  const independentPathRefs = chooseIndependentPathRefs(viableEntries);
  const independentPathCount = independentPathRefs.length;

  const dependencyUseCounts = new Map<string, number>();
  for (const { receipt } of viableEntries) {
    for (const dependency of receipt.dependencyRefs) {
      dependencyUseCounts.set(dependency, (dependencyUseCounts.get(dependency) ?? 0) + 1);
    }
  }
  const fragileDependencyRefs = [...dependencyUseCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([dependency]) => dependency)
    .sort();

  const blockingDependencyRefs = unique(
    evaluated
      .filter((entry) => entry.receipt.viabilityState === 'blocked')
      .filter((entry) => entry.receipt.blockingRefs.some((ref) => capabilities.has(ref)))
      .flatMap((entry) => entry.receipt.dependencyRefs),
  ).sort();

  const disposition =
    structurallyCompletePathCount === 0
      ? 'NO_KNOWN_PATH'
      : viablePathCount === 0
        ? 'POSSIBILITIES_ONLY'
        : independentPathCount <= 1
          ? 'VIABLE_BUT_FRAGILE'
          : fragileDependencyRefs.length > 0
            ? 'MULTIPATH'
            : 'RESILIENT_MULTIPATH';

  return {
    needRef: input.need.needRef,
    candidatePathCount: candidatePaths.length,
    structurallyCompletePathCount,
    viablePathCount,
    independentPathCount,
    independentPathRefs,
    blockingDependencyRefs,
    fragileDependencyRefs,
    unusedCapabilityRefs: input.capabilities
      .filter((claim) =>
        !candidatePaths.some((path) => path.capabilityRefs.includes(claim.capabilityRef))
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
    disposition,
  };
}

export type {
  PlentyEvaluationInput,
  PlentyPathReceipt,
  PlentyReceipt,
} from './types.js';

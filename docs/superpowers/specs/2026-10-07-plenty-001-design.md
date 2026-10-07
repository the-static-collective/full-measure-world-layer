# PLENTY-001 — Scarcity Inverter Specimen

Date: 2026-10-07  
Repository: `the-static-collective/full-measure-world-layer`  
Status: approved design, not yet implemented

## Objective

Add a Full Measure-local proof primitive that evaluates whether a declared need can be reached through presently known particulars and capabilities without confusing quantity, possibility, access, or model assertion with actual capacity.

PLENTY-001 does not create resources, grant permission, establish witness, mutate donor systems, or manufacture abundance. It reports a bounded state of reachable possibility from the evidence supplied to it.

Founding question:

> Given a need and the particulars presently known, how many independently viable paths actually reach the need without falsely upgrading possibility into availability?

## Core laws

```text
PARTICULAR != CAPABILITY
CAPABILITY != AVAILABILITY
AVAILABILITY != ACCESS
ACCESS != AUTHORITY
POSSIBILITY != VIABILITY
SUBSTITUTE != EQUIVALENT
PATH COUNT != PATH INDEPENDENCE
PATH INDEPENDENCE != SUCCESS
CLAIMED RESOURCE != OBSERVED RESOURCE
SHARED CAPABILITY != OWNED CAPABILITY
OUTPUT != REPRODUCTIVE SEED
OMISSION != ABSENCE
FAILURE OF ONE PATH != FAILURE OF NEED
RECOMPOSITION != SOURCE MUTATION
ABUNDANCE != QUANTITY
```

Full Measure authority law:

> PLENTY MAY REPORT POSSIBILITY. IT MAY NOT MANUFACTURE CAPACITY.

A model-generated declaration, synthetic fixture, or PLENTY receipt is never sufficient by itself to promote a proposed capability into witnessed Full Measure capacity.

## Scope

PLENTY-001 is intentionally local and dependency-free.

It should add:

```text
src/lib/plentySpecimen/
  index.ts
  types.ts
  fixtures.ts

tests/
  plenty-specimen.test.ts
```

No UI, server route, persistence layer, GHoT adapter, Rack adapter, reLATTE adapter, network integration, external service, or cross-repository mutation belongs in 001.

Those are later consumers if the local proof survives hostile testing.

## Conceptual model

PLENTY evaluates a graph:

```text
NEED
 ↓
known PARTICULARS
 ↓
declared CAPABILITIES
 ↓
candidate COMPOSITIONS
 ↓
constraint + authority checks
 ↓
VIABLE PATHS
 ↓
dependency/correlation attack
 ↓
RESILIENT PATH SET
 ↓
receipt
```

A large number of syntactically distinct routes may collapse to one dependency family. For example, seven communication applications that all require the same electrical supply do not represent seven independent viable paths after that supply is removed.

## Inputs

### Need

A need declares the target condition to be satisfied.

Minimum fields:

```ts
type PlentyNeed = {
  needRef: string;
  capabilityRequirement: string;
  deadlineRef?: string;
  constraints?: PlentyConstraint[];
};
```

A need is not itself evidence that any path exists.

### Particular

A particular is an addressable thing, person, source, tool, artifact, or bounded resource known to the specimen.

Minimum fields:

```ts
type PlentyParticular = {
  particularRef: string;
  kind: string;
  sourceRefs: string[];
};
```

A particular may expose zero or more capability claims.

### Capability claim

A capability claim connects a particular to a bounded function it may provide.

Minimum fields:

```ts
type PlentyCapabilityClaim = {
  capabilityRef: string;
  particularRef: string;
  capability: string;
  evidenceClass: "declared" | "observed" | "witnessed";
  availability: "available" | "unavailable" | "unknown";
  access: "accessible" | "inaccessible" | "unknown";
  authority: "authorized" | "unauthorized" | "unknown";
  dependencyRefs: string[];
  sourceRefs: string[];
};
```

The specimen may reason over declared and observed claims, but only the supplied evidence class may be reported. PLENTY never upgrades evidence class.

### Candidate path

A candidate path is an explicitly declared or deterministically derived composition from capabilities to the need.

Minimum fields:

```ts
type PlentyCandidatePath = {
  pathRef: string;
  needRef: string;
  capabilityRefs: string[];
  dependencyRefs: string[];
  satisfiesCapabilityRequirement: boolean;
  constraintResults: PlentyConstraintResult[];
};
```

A candidate path is not viable merely because it is structurally complete.

## Evaluation

The evaluator must distinguish at least four stages.

### 1. Structural completeness

A path is structurally complete only when its capability chain can satisfy the declared need without a cycle that leaves an unresolved requirement.

Structural completeness does not establish availability, access, authority, affordability, timeliness, or independence.

### 2. Present viability

A structurally complete path is presently viable only if every required capability is:

- presently available;
- accessible under the supplied evidence;
- authorized for the proposed use;
- within declared resource constraints;
- within any declared time constraint;
- free of unresolved hard blockers.

Unknown values do not become false and do not become true. They keep the path unresolved.

### 3. Dependency normalization

PLENTY must normalize shared dependency references before counting independent paths.

Aliases may not create independence. Multiple paths that rely on the same normalized dependency family remain correlated even if their surface labels differ.

001 should use explicit dependency identity from fixtures and inputs. It should not attempt probabilistic entity resolution or fuzzy alias inference.

### 4. Independent path calculation

Independent path count is the count of presently viable paths after collapsing paths that share a declared critical dependency whose failure would disable all members of that set.

001 does not need a generalized reliability probability model. It only needs deterministic dependency-family separation.

## Output

Do not emit a scalar abundance score.

Return an inspectable receipt:

```ts
type PlentyReceipt = {
  needRef: string;
  candidatePathCount: number;
  structurallyCompletePathCount: number;
  viablePathCount: number;
  independentPathCount: number;
  blockingDependencyRefs: string[];
  fragileDependencyRefs: string[];
  unusedCapabilityRefs: string[];
  unresolvedClaimRefs: string[];
  pathReceipts: PlentyPathReceipt[];
  disposition:
    | "NO_KNOWN_PATH"
    | "POSSIBILITIES_ONLY"
    | "VIABLE_BUT_FRAGILE"
    | "MULTIPATH"
    | "RESILIENT_MULTIPATH";
};
```

Disposition semantics:

- `NO_KNOWN_PATH`: no structurally complete candidate reaches the need.
- `POSSIBILITIES_ONLY`: one or more structurally complete candidates exist, but none is presently established as viable.
- `VIABLE_BUT_FRAGILE`: at least one presently viable path exists, but the viable set resolves to one critical dependency family.
- `MULTIPATH`: more than one independent viable path exists, but known shared fragilities remain.
- `RESILIENT_MULTIPATH`: more than one independent viable path exists and no declared single critical dependency disables the entire viable set.

The receipt carries no authority beyond its inputs and computation.

## Seed semantics

PLENTY must not treat every output as a reusable seed.

A derivative may be marked reproductive only when the supplied evidence includes a distinct recipe, source lineage, or reconstruction instruction sufficient to reproduce its relevant capability.

Therefore:

```text
OUTPUT != REPRODUCTIVE SEED
DUPLICATE DESCRIPTION != NEW CAPABILITY
RECIPE CLAIM != REPRODUCIBILITY PROOF
```

001 only evaluates declared reproductive evidence. It does not execute the reproduction.

## Failure behavior

The specimen should fail closed on malformed or internally contradictory inputs.

Examples:

- candidate references unknown capability;
- capability references unknown particular;
- duplicate identity with contradictory immutable source references;
- circular path with no externally satisfied break;
- path claims a need it was not evaluated for;
- dependency graph contains an impossible self-identity declaration;
- receipt input attempts to cite a PLENTY receipt as authority for the capability being evaluated.

Unknown evidence should remain representable as unknown rather than throwing when the input itself is structurally valid.

## BAT hardening matrix

The implementation is not complete until the hostile suite proves the following.

### Inventory inflation

Duplicate the same particular or capability surface representation many times.

Expected: independent path count does not increase.

### Alias attack

Represent one dependency under multiple labels while preserving one normalized dependency ref.

Expected: aliases remain one dependency family.

### Hidden choke point

Many apparently different paths share one critical dependency.

Expected: path count may be high while independent path count remains one.

### Fake substitution

A capability with a superficially related tag but the wrong declared requirement may not satisfy the need.

Expected: structurally incomplete or constraint-failed path.

### Unavailable capability

A known capability marked unavailable cannot contribute to present viability.

### Unauthorized capability

An accessible resource without authority cannot contribute to present viability.

### Stale availability

A stale or explicitly non-current claim cannot be silently promoted to present availability.

001 may represent this with an unresolved claim rather than adding a clock service.

### Circular composition

A requires B, B requires C, C requires A with no externally satisfied capability.

Expected: no structurally complete path.

### Recursive abundance

A PLENTY receipt cannot be cited as new source authority for a capability in the same or subsequent evaluation.

### Seed laundering

A derivative without reconstruction evidence cannot be counted as a reproductive capability source merely because it exists.

### Correlated failure

Several providers that share one declared upstream dependency remain correlated.

### Single-person bottleneck

Many candidate routes depending on one person remain one fragile dependency family where that person is critical.

### Cost impossibility

A path outside declared resource bounds is not presently viable.

### Time impossibility

A path that cannot satisfy a declared deadline is not presently viable.

### Witness laundering

A model assertion or local PLENTY conclusion cannot create witnessed Full Measure capacity.

### Unknown is not false

Unknown availability, access, or authority remains unresolved and is not rewritten as unavailable or refused.

### Path destruction

Removing one dependency invalidates only paths that require it and recomputes the receipt from the remaining graph.

### Source preservation

Evaluation and recomposition never mutate the input particulars or source lineage.

### Adversarial cardinality

Large numbers of syntactic variants around one underlying dependency family must not inflate independent path count.

### Power-cut specimen

Need: communicate 100 miles away.

Candidate surfaces:

```text
email
Signal
Matrix
Discord
webZ
shared document
VoIP
```

All depend on one electrical supply.

When that electrical dependency is unavailable and no alternate supply is supplied:

Expected: zero presently viable paths, regardless of seven surface routes.

## Explicit non-goals

PLENTY-001 does not:

- assign monetary value;
- score human worth;
- infer private resources;
- scrape external availability;
- optimize purchases;
- automatically acquire anything;
- authorize use of shared resources;
- convert proposal into capacity;
- rank people by usefulness;
- infer equivalence from semantic similarity;
- calculate universal economic abundance;
- mutate Full Measure Garden measures;
- perform cross-world admission;
- call GHoT, Rack, reLATTE, SupaBardo, TranchNode, or any donor repository.

## Future seam

If 001 survives BAT hardening, a later specimen may consume external capability manifests by adapter.

That later integration must preserve donor authority:

```text
REMOTE CAPABILITY CLAIM != LOCAL CAPACITY
DISCOVERY != ACCESS
ACCESS != PERMISSION
CROSSING != ADMISSION
RECOMMENDATION != SELECTION
```

PLENTY should remain a resolver and witnessable analysis surface, not a central inventory authority.

## Success criteria

PLENTY-001 is successful when:

1. the local evaluator returns deterministic receipts for fixed fixtures;
2. proposed, observed, and witnessed evidence remain distinct;
3. unknown state never upgrades itself;
4. duplicate and aliased routes cannot inflate independent path count;
5. shared choke points remain visible;
6. malformed and authority-laundering inputs fail closed;
7. source objects remain unchanged after evaluation;
8. the power-cut specimen resolves to zero viable paths;
9. tests cover every BAT case named in this design;
10. the full repository `npm run check` is green on the implementation branch before any completion claim.

## Implementation boundary

The implementation plan should prefer a small pure TypeScript evaluator with immutable inputs and no production dependencies.

The first useful primitive is not "find me abundance." It is:

> Show me, truthfully, how many viable paths remain from what is actually present to what is actually needed.

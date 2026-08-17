# Boot the House — Federated World Encounter Loop v0.1

**Status:** proposed design

## Design sentence

> Prove that a person can inhabit Full Measure, discover a bounded neighboring door, express a traversal intent, cross one constitutional boundary, receive a destination-local disposition, and return to a visibly changed world without any participating repository surrendering its authority, identity, or history.

## Purpose

The Static Collective now has enough independently proven organs to attempt one complete cross-project heartbeat:

- **Full Measure** owns the playable World Layer and Garden.
- **Authority Kit / Founder Node** describe ecosystem capabilities and evidenced nearby growth without turning relevance into authority.
- **TranchNode** has deterministic Intent Stroke / Swype NAV decoding with preserved raw evidence, ambiguity, and `authority: none`.
- **Project0** has NAV crossing witnesses and is advancing the World Encounter Envelope boundary: testimony may cross while sovereignty stays local.
- **Corpus OS** owns destination-local admission/execution semantics, refusals, failures, receipts, and constituted-world reconstruction.
- **GitBook** preserves portable laws, evidence, frontier, and re-entry context without becoming runtime authority.

The next proof should therefore not be another isolated application or a new master integration service. It should be one inhabited loop that exercises those boundaries together.

## Core claim under test

> Can the Collective behave like one inhabitable world while remaining a federation of sovereign organs?

The v0.1 heartbeat is:

```text
human
  -> Full Measure Garden / current field
  -> bounded nearby-door projection
  -> human traversal gesture
  -> TranchNode Intent Stroke decoding
  -> explicit human crossing confirmation
  -> Project0 World Encounter Envelope
  -> destination-local Corpus OS evaluation
  -> admitted | refused | indeterminate | failed
  -> attributable return residue
  -> Full Measure projects a changed field
  -> declared return / reconstruction path remains inspectable
```

The visible continuity should feel like one world. The evidence must prove that no central runtime became sovereign over the participating systems.

## Architectural decision

### Full Measure owns orchestration as world projection, not constitutional authority

Full Measure is the correct home for v0.1 because it already owns the human-facing world and already defines integrations by reference and adapter.

Full Measure may project the current field, request bounded door metadata, collect a gesture, delegate decoding, require human confirmation, request a Project0 encounter envelope, submit the encounter to a destination adapter, and render the returned disposition and evidence.

Full Measure may not define Project0 identity, mint destination authority, overwrite TranchNode lineage, treat Founder Node relevance as permission, execute Corpus OS operations without Corpus OS admission, reinterpret refusal as success, use UI state as canonical constitutional state, or make GitBook narrative authoritative over repository evidence.

### Rejected: a new central orchestrator repository

A new `world-runtime` repository would immediately be tempted to become the canonical registry, policy engine, identity resolver, transport, and integration owner. That would create the sovereign center this experiment is meant to avoid.

Do not create a new repository for v0.1.

### Rejected: absorb donor logic into Full Measure

Copying Project0, TranchNode, Corpus OS, or Founder Node semantics into Full Measure would make the demo easier and the architecture false. The proof requires real boundaries.

## Ownership map

| Concern | Canonical owner | Full Measure relationship |
|---|---|---|
| Inhabited world / Garden / crossing UX | Full Measure | product owner |
| Capability and invariant registry | Authority Kit | observed metadata only |
| Nearby-door projection | Founder Node | advisory adapter |
| Gesture evidence / traversal decoding | TranchNode | delegated decoder |
| Identity / NAV / encounter-envelope law | Project0 | versioned contract adapter |
| Destination-local admission / execution | Corpus OS | destination adapter |
| Portable patterns / public evidence / re-entry | GitBook | post-proof documentation only |

Composition does not transfer ownership.

## First world heartbeat

### 1. Enter one field

The user begins in the existing Full Measure Garden. Full Measure constructs a bounded `WorldFieldProjection` from Full Measure-owned state plus explicitly admitted references. It does not crawl the ecosystem.

The projection records its field id, projection version, source snapshot/receipt refs, visible unresolved refs, and excluded source classes.

### 2. Reveal three nearby doors

The Garden requests at most three candidates through `NearbyDoorSource`.

Preferred live source: Founder Node Pollen Scout over Authority Kit once the relevant implementation is landed and compatible.

CI fallback: a pinned fixture snapshot using the same adapter contract. A fixture must be visibly identified as fixture/prototype evidence; it may not be represented as a live Founder Node observation.

Each door exposes boundary metadata only:

```ts
interface WorldDoorProjection {
  doorRef: string;
  destinationRef: string;
  relation: string;
  reachability: "reachable" | "blocked" | "unknown";
  provenanceRefs: string[];
  relevanceReasons: string[];
  requiredCrossingProfile: string;
  authority: "none";
}
```

No destination payload is loaded during the scan.

One door in the first human proof leads to a Corpus OS destination capable of evaluating the encounter. The other two remain visible but uncrossed.

### 3. Traversal becomes input

The doors are projected into a fixed local field layout. The user swipes or drags approximately through the desired route. Full Measure records the raw gesture and delegates decoding to TranchNode Intent Stroke.

The decoder returns candidates and collisions; it does not choose the crossing.

```text
human stroke != selected destination
ranked traversal != accepted crossing
```

Full Measure renders the candidate result and any ambiguity. The user performs a separate explicit **Cross this door** confirmation. Exact collisions remain unresolved until the user chooses or redraws.

The confirmation receipt is a **Full Measure-local evidence event** proving that the human selected a proposed crossing. It is not destination authority.

### 4. Construct one authority-preserving encounter

After confirmation, Full Measure creates a local `ConfirmedCrossingIntent` containing the selected door, source field, offered bounded witness refs, and traversal evidence refs.

A Project0 adapter then produces or validates the compatible World Encounter Envelope.

Required laws:

- crossing is not authority transfer;
- receiving is not canonizing;
- verification state stays separate from authority;
- disclosure precedes payload inspection;
- source history is immutable;
- foreign vocabulary may remain foreign;
- exact replay uses Project0's existing canonicalization/addressing floor.

If the required Project0 implementation is not landed on a compatible mainline, the live adapter is unavailable. Full Measure reports the dependency rather than cloning the contract locally.

Malformed, tampered, or incompatible encounter envelopes are **validation/compatibility failures**. They do not become destination constitutional refusals, and the destination is not invoked.

### 5. Destination decides locally

The first destination is Corpus OS because it provides a materially distinct authority and execution domain.

Full Measure sends the valid encounter through `WorldDestinationAdapter`. The adapter accepts only declared bounded capabilities; UI text cannot become arbitrary executable command.

```ts
type WorldDestinationDisposition =
  | { status: "admitted"; destinationFrameRef: string; receiptRefs: string[]; outputRefs: string[]; authorityRefs: string[] }
  | { status: "refused"; destinationFrameRef: string; reasonCodes: string[]; receiptRefs: string[] }
  | { status: "indeterminate"; destinationFrameRef: string; unresolved: string[]; receiptRefs: string[] }
  | { status: "failed"; destinationFrameRef?: string; failureClass: string; evidenceRefs: string[] };
```

`refused` means the destination evaluated the encounter and constitutionally declined it. `failed` means an operational/runtime failure. They must never be interchangeable.

The destination cites only authority valid in its own frame.

### 6. Return residue without rewriting history

Full Measure builds a local `WorldEncounterResidue` containing references to the source field, door, raw gesture, decoding, human confirmation, Project0 encounter, destination disposition, NAV witness where available, unresolved remainder, and return/reconstruction evidence.

The Full Measure residue store holds only local projection history and foreign evidence references. It is not a competing immutable artifact store or a second canonical identity law.

### 7. Reproject the world

The Garden changes according to the actual outcome:

- **admitted:** destination or returned artifact may become newly illuminated/reachable under ordinary Full Measure law;
- **refused:** constituted source state remains unchanged, but an attributable boundary scar/refusal residue may be visible;
- **indeterminate:** the frontier remains fogged/contested rather than coerced into success or refusal;
- **failed:** an operational failure marker may appear, explicitly outside constitutional topology.

History may change the visible world. A failed or refused transition must never be rendered as though the attempted destination state became constituted.

This gives Refusal Topology its first possible product surface without promoting that incubating pattern into universal law.

## Full Measure-local application seams

These names are application contracts, not proposed Project0 or TranchNode ontology:

```ts
interface WorldFieldProjection {
  fieldRef: string;
  projectionVersion: string;
  sourceRefs: string[];
  unresolvedRefs: string[];
  excludedSourceClasses: string[];
}

interface TraversalIntentProjection {
  rawStrokeRef: string;
  fieldLayoutRef: string;
  decodingRef: string;
  candidateDoorRefs: string[];
  collision: boolean;
  authority: "none";
}

interface ConfirmedCrossingIntent {
  sourceFieldRef: string;
  destinationDoorRef: string;
  traversalEvidenceRefs: string[];
  offeredWitnessRefs: string[];
  confirmedBy: string;
  confirmationReceiptRef: string;
}

interface WorldEncounterResidue {
  sourceFieldRef: string;
  doorRef: string;
  crossingRef: string;
  destinationStatus: "admitted" | "refused" | "indeterminate" | "failed";
  evidenceRefs: string[];
  unresolvedRefs: string[];
  returnRefs: string[];
}
```

## Adapter boundaries

**`NearbyDoorSource`** returns explainable nearby doors. It cannot cross a door, grant permission, use hidden model preference as authority, or inspect destination bodies during threshold scan.

**`TraversalDecoder`** delegates raw stroke + layout + candidate templates to TranchNode. It cannot hide collisions or confirm a crossing.

**`EncounterEnvelopePort`** delegates Project0 encounter construction/validation. It cannot introduce another canonicalizer, translate source authority into destination authority, or inspect undisclosed payload.

**`WorldDestinationAdapter`** offers one valid encounter to one destination and returns the destination's own result. It cannot silently retry a refusal as a changed operation or translate host failure into refusal/success.

**`WorldResidueStore`** keeps Full Measure-local projection history and references needed for reconstruction. Donor evidence stays under donor identity/durability law.

## Failure matrix

| Case | Required result |
|---|---|
| Nearby-door source unavailable | Garden still renders; doors report unavailable |
| Registry/projection version unsupported | fail closed before door display |
| Intent Stroke unavailable | doors may remain visible; gesture crossing disabled |
| Gesture collision | unresolved candidates; no implicit choice |
| User declines confirmation | no crossing emitted |
| Envelope invalid/tampered/incompatible | validation failure; destination not invoked |
| Disclosure insufficient | destination payload not inspected |
| Destination refuses | source constituted state unchanged; refusal residue preserved |
| Destination indeterminate | unresolved frontier preserved |
| Destination runtime fails | explicit operational failure, not refusal |
| Return evidence incomplete | reconstruction marked partial; no invented lineage |
| Adapter version drifts | compatibility failure until explicitly upgraded |

## Security and authority constraints

1. No central credentials plane in Full Measure.
2. No ambient arbitrary execution.
3. No destination-content retrieval during boundary scan.
4. No destination mutation of source frame or gesture evidence.
5. No UI affordance implies permission.
6. Founder Node relevance affects visibility only.
7. TranchNode gesture decoding affects candidates only.
8. Project0 envelope validity does not grant destination execution authority.
9. Receipts prove bounded events/evaluations, not every payload claim.
10. GitBook narration is downstream of repository evidence.

## Testing strategy

### Unit and adversarial proof

Full Measure tests must prove:

- door projection never implies authority;
- collision cannot auto-select;
- human confirmation is independent from decoding;
- admitted/refused/indeterminate/failed produce distinct projections;
- envelope validation failure remains distinct from destination refusal;
- refused encounters cannot produce admitted-world consequence;
- version incompatibility fails closed;
- private/held material stays absent from field construction.

Pinned fixtures cover three doors; intended, perturbed, reversed, and collision strokes; valid/tampered/disclosure-blocked envelopes; all destination result classes; and incomplete return evidence. Every fixture records source project, contract version, and source commit/ref.

### Cross-repository integration proof

Mocks alone are insufficient. At least one composed proof must exercise compatible real implementations from:

- TranchNode Intent Stroke;
- Project0 encounter-envelope / NAV boundary;
- Corpus OS destination-local admission or a Corpus-owned bounded adapter;
- Full Measure orchestration.

Founder Node / Authority Kit joins the live proof when its relevant implementation is landed and compatible. Until then, the nearby-door adapter may be fixture-backed if the UI and receipt truthfully say so.

### Human witness

One person must:

1. see three bounded doors;
2. gesture toward one;
3. see the decoded candidate/ambiguity;
4. explicitly confirm;
5. witness one real destination-local disposition;
6. return to a visibly changed Garden;
7. inspect the evidence chain explaining the change.

Machine-green integration is necessary but insufficient for the claim that the House is inhabitable.

## Acceptance criteria

Boot the House v0.1 succeeds when:

- [ ] Full Measure remains the playable shell, not donor authority.
- [ ] One complete field -> door -> gesture -> confirmation -> encounter -> destination disposition -> residue -> changed-field loop works.
- [ ] Three bounded doors are visible with metadata-only threshold scanning.
- [ ] Live vs fixture-backed doors are truthfully distinguished.
- [ ] TranchNode decodes without selecting or authorizing.
- [ ] Separate human confirmation is required.
- [ ] Project0's compatible encounter law is consumed without a second canonicalizer.
- [ ] Corpus OS or another explicitly approved destination-owned adapter makes the destination-local decision.
- [ ] `admitted`, `refused`, `indeterminate`, `failed`, and pre-destination validation failure remain distinct.
- [ ] Refusal does not mutate constituted source state.
- [ ] Residue is durable/attributable but non-authoritative.
- [ ] Return/reconstruction states what was and was not recovered.
- [ ] One human session proves visible world change from recorded history.
- [ ] No universal world node, master graph, central authority service, or new canonicalization floor appears.

## Non-goals

Do not add in v0.1: global route search, autonomous traversal, recursive scouts, internet federation, SSO, plugin marketplace, VR/3D, MMO presence, automatic door creation, automatic Refusal Topology promotion, master Multiverse NAV graph, central event bus, a new orchestration repository, or integration of every project.

## Stop conditions

Return to design if implementation requires:

- duplicating Project0 canonicalization or encounter law;
- importing donor state directly rather than using an explicit adapter;
- treating gesture rank or Founder Node relevance as permission;
- inspecting destination content before disclosure;
- letting Full Measure decide destination authority;
- silently changing an operation after refusal;
- presenting fixture participation as live donor participation;
- storing reusable external credentials merely to make the demo work;
- inventing one global graph to render three doors;
- requiring future projects to adopt Full Measure domain types to participate.

## Evolution after v0.1

Only after the first heartbeat is witnessed should a second materially different destination be added.

Likely sequence:

```text
v0.1  Full Measure -> Corpus OS
      constitutional / execution crossing

v0.2  Full Measure -> Band Runtime
      live sovereign-participant encounter

v0.3  Full Measure -> Upper Room
      shared reading / witness-channel encounter
```

Multiple real rooms must become easier to traverse without collapse before Multiverse NAV graduates from instrument hypothesis toward a product surface.

## Consequences

The gain is large: the ecosystem can become one inhabitable world without merging into one application; new projects can join by declaring bounded surfaces; Project0, TranchNode, Corpus OS, and Founder Node gain real product proofs; refusal and indeterminate residue can begin accumulating meaningful negative-space evidence.

The cost is also real: cross-repo version discipline, explicit adapter compatibility, more demanding verification, and UX that preserves distinctions ordinary apps usually collapse. Those costs are intentional. Removing them by centralizing authority would falsify the experiment.

## Governing compression

> **The House boots when one person can move through several sovereign systems as one continuous world, and every boundary still remembers who owns what.**

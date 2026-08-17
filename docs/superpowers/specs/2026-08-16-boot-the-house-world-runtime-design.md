# Boot the House — Federated World Encounter Loop v0.1

**Status:** proposed design

## Design sentence

> Prove that a person can inhabit Full Measure, discover a bounded neighboring door, express a traversal intent, cross one constitutional boundary, receive a destination-local disposition, and return to a visibly changed world without any participating repository surrendering its authority, identity, or history.

## Purpose

The Static Collective now has several independently proven organs that are beginning to meet at the same seam:

- **Full Measure** already owns the playable World Layer and the human-facing Garden.
- **Founder Node / Authority Kit** can project nearby ecosystem capabilities without converting relevance into authority.
- **TranchNode** now has deterministic Intent Stroke / Swype NAV decoding while keeping raw gesture evidence, ambiguity, and `authority: none` distinct.
- **Project0** has NAV frame/crossing witnesses and is advancing the World Encounter Envelope boundary for source testimony that may cross without transporting sovereignty.
- **Corpus OS** has the execution/admission side of the ecosystem: local authority, one-shot warrants, admitted/refused execution, receipts, and constituted-world reconstruction.
- **GitBook** preserves portable laws, evidence, frontier, and re-entry context without becoming runtime authority.

The next useful proof is therefore not another isolated application and not a master integration service. It is one complete, inhabited cross-project heartbeat.

This design deliberately makes the move large in architectural reach and narrow in proof surface.

## Core claim under test

The v0.1 experiment asks one falsifiable question:

> Can the Collective behave like one inhabitable world while remaining a federation of sovereign organs?

A successful run must look approximately like this:

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
  -> exact return path remains inspectable
```

The experiment succeeds only if the visible continuity feels like one world **and** the evidence proves that no central runtime silently became sovereign over the participating systems.

## Architectural decision

### Decision: Full Measure owns orchestration as a world projection, not as constitutional authority

Full Measure is the correct home for the v0.1 design and human interaction because it already defines itself as the world people play inside and already has a project-weave contract for integrating other systems by reference and adapter.

Full Measure may:

- project the current inhabited field;
- request bounded nearby-door metadata;
- collect a traversal gesture;
- ask TranchNode to decode that gesture;
- require a human confirmation before crossing;
- construct or request a Project0-compatible encounter envelope;
- submit the offered encounter to a destination adapter;
- render the destination's returned disposition and evidence;
- project resulting scars, residue, illumination, or unresolved fog into the Garden.

Full Measure may **not**:

- define canonical identity for Project0;
- mint destination authority;
- overwrite TranchNode lineage;
- treat Founder Node relevance as permission;
- execute a Corpus OS operation without Corpus OS admission;
- reinterpret a refusal as success;
- use UI state as canonical constitutional state;
- make GitBook narrative authoritative over repository-owned evidence.

### Rejected option: a new central orchestrator repository

A new `world-runtime` repository would appear clean but would immediately create pressure to become the canonical registry, transport, policy engine, identity resolver, and integration owner. That duplicates responsibilities already held elsewhere and creates a de facto sovereign center.

Do not create a new repository for v0.1.

### Rejected option: absorb donor logic into Full Measure

Copying Project0, TranchNode, Corpus OS, or Founder Node semantics into Full Measure would make the demo easier and the architecture false. The proof requires actual boundaries, not simulated constitutional diversity hidden inside one codebase.

## Repository ownership map

| Concern | Canonical owner | Full Measure relationship |
|---|---|---|
| Inhabited world, Garden, human crossing experience | Full Measure | owns product projection |
| Ecosystem capability / invariant registry | Authority Kit | observes declared metadata only |
| Nearby-growth / nearby-door projection | Founder Node | consumes through adapter; relevance remains advisory |
| Gesture evidence and traversal-candidate decoding | TranchNode | delegates decoding; never treats rank as authority |
| Canonical identity, frame comparison, encounter-envelope law | Project0 | consumes versioned contracts / witnesses |
| Destination-local admission and execution | Corpus OS | invokes through explicit destination adapter |
| Portable patterns, evidence summaries, public re-entry map | GitBook | publishes evidence after the runtime proof; never runtime authority |

No row transfers ownership merely because Full Measure composes the experience.

## The first world heartbeat

The first acceptance specimen is intentionally one route.

### 1. Enter one inhabited field

The user begins in the existing Full Measure Garden.

The Garden constructs a bounded `WorldFieldProjection` from Full Measure-owned state plus explicitly admitted references. It does not crawl the ecosystem.

The projection must state:

- current field id;
- field projection version;
- exact source snapshot / receipt refs used;
- unresolved items currently visible;
- capability to request nearby-door metadata;
- what private or unavailable sources were excluded.

### 2. Reveal exactly three bounded nearby doors

The Garden requests up to three candidate doors through a `NearbyDoorSource` adapter.

Preferred live source: Founder Node Pollen Scout over the Authority Kit registry once the relevant branch has landed and is compatible.

CI fallback: a pinned fixture snapshot with the same public adapter contract. The fixture is test evidence, not a second registry.

Each door exposes only boundary metadata:

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

For the first human proof, one of the three doors must lead to a Corpus OS destination fixture or live local Corpus OS adapter that can actually evaluate an encounter. The other two may remain visible but uncrossed.

### 3. Traversal itself becomes input

The three doors are projected into a fixed local field layout.

The user swipes or drags approximately through the desired route. Full Measure records the raw gesture and delegates decoding to TranchNode Intent Stroke v0.1 or a compatible later version.

The decoder may return ranked candidates and collisions. It may not choose the crossing.

Required distinction:

```text
human stroke
  != selected destination
ranked traversal
  != accepted crossing
```

Full Measure renders the best-ranked candidate plus ambiguity. The user must perform a separate explicit confirmation such as **Cross this door**.

Exact collisions remain unresolved until the human chooses or redraws.

### 4. Construct one authority-preserving encounter

After explicit confirmation, Full Measure creates a `ConfirmedCrossingIntent` containing the selected door, gesture/decoding evidence refs, source field ref, and the bounded witness or object being offered.

A Project0 adapter then produces or validates the versioned World Encounter Envelope profile.

This step must inherit these laws:

- crossing is not authority transfer;
- receiving is not canonizing;
- source verification state remains separate from authority;
- disclosure precedes payload inspection;
- source history is immutable;
- foreign vocabulary may remain foreign;
- exact replay uses Project0's existing canonicalization / addressing floor.

If the required Project0 World Encounter Envelope implementation is not landed on a compatible mainline, the live-crossing adapter remains unavailable. Full Measure must report the dependency honestly rather than ship a local clone of the contract.

### 5. Destination decides locally

The first destination is Corpus OS because it already has the strongest distinct execution/admission semantics.

Full Measure sends the encounter through a `WorldDestinationAdapter`. The adapter does not accept arbitrary shell text or permit Full Measure to name executable authority directly.

Candidate destination result:

```ts
type WorldDestinationDisposition =
  | {
      status: "admitted";
      destinationFrameRef: string;
      receiptRefs: string[];
      outputRefs: string[];
      authorityRefs: string[];
    }
  | {
      status: "refused";
      destinationFrameRef: string;
      reasonCodes: string[];
      receiptRefs: string[];
    }
  | {
      status: "indeterminate";
      destinationFrameRef: string;
      unresolved: string[];
      receiptRefs: string[];
    }
  | {
      status: "failed";
      destinationFrameRef?: string;
      failureClass: string;
      evidenceRefs: string[];
    };
```

`failed` is operational failure, not constitutional refusal.

The destination must cite only authority valid in its own frame.

### 6. Return residue without rewriting the crossing

Full Measure receives the destination result and builds a local `WorldEncounterResidue` projection.

The residue must preserve:

- source field ref;
- selected door ref;
- raw gesture ref;
- traversal decoding ref;
- confirmed crossing intent ref;
- encounter envelope ref;
- destination disposition and receipt refs;
- NAV before/crossing/after witness where available;
- unresolved remainder;
- return / reconstruction refs.

The residue is historical and attributable. It is not executable authority.

### 7. The world changes visibly

The Garden reprojects after the encounter.

The change must depend on the actual result class:

- **admitted:** the new destination or returned artifact may become newly illuminated or reachable according to ordinary Full Measure rules;
- **refused:** the source field remains unchanged constitutionally, but an attributable boundary scar / refusal residue may become visible;
- **indeterminate:** the frontier remains fogged or contested rather than coerced into refusal or success;
- **failed:** an operational failure marker may appear, clearly distinct from constitutional topology.

The visible world may change because history changed. It must not pretend that a failed or refused transition constituted the attempted destination state.

This is the first practical bridge to later Refusal Topology without declaring that incubating pattern universal law in v0.1.

## Full Measure application contracts

The following names are local application seams, not proposed Project0 or TranchNode ontology:

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

These contracts exist to keep Full Measure understandable. They must not become a hidden universal schema.

## Adapter boundaries

### `NearbyDoorSource`

Responsibility: return a bounded list of explainable nearby doors.

Must not:

- cross a door;
- rank by hidden model preference;
- grant permission;
- inspect destination content merely to improve relevance.

### `TraversalDecoder`

Responsibility: submit raw stroke + declared layout + candidate templates to TranchNode and return the addressed decoding.

Must not:

- hide collisions;
- turn cost/rank into confidence-as-truth;
- confirm a crossing.

### `EncounterEnvelopePort`

Responsibility: produce / validate the Project0 encounter object using the exact compatible contract.

Must not:

- implement a second canonicalizer;
- translate source authority into destination authority;
- inspect undisclosed payload.

### `WorldDestinationAdapter`

Responsibility: offer the encounter to one destination and return the destination's own disposition/evidence.

Must not:

- allow UI text to become arbitrary executable command;
- silently retry a constitutional refusal as another operation;
- translate host failure into refusal or success.

### `WorldResidueStore`

Responsibility: keep Full Measure's projection-level encounter history and refs required to reconstruct the world experience.

It may reference TranchNode-addressed evidence. It must not become a competing immutable artifact law.

## Error and refusal behavior

The v0.1 implementation must make the following cases visibly distinct:

| Case | Required result |
|---|---|
| Nearby-door source unavailable | current world still renders; nearby doors report unavailable |
| Registry/projection version unsupported | fail closed before door display |
| Intent Stroke decoder unavailable | doors may remain visible; gesture crossing disabled |
| Exact gesture collision | unresolved candidates shown; no implicit choice |
| User declines confirmation | no crossing object emitted |
| Encounter envelope invalid/tampered | crossing refused before destination evaluation |
| Disclosure insufficient | destination payload is not inspected |
| Destination refuses | source constituted state unchanged; refusal residue preserved |
| Destination indeterminate | unresolved frontier preserved distinctly |
| Destination host/runtime fails | explicit operational failure; not a refusal |
| Return evidence incomplete | reconstruction marked partial; no invented lineage |
| Adapter version drifts | compatibility refusal until explicitly upgraded |

## Security and authority constraints

1. **No central credentials plane.** Full Measure does not collect reusable credentials for donor systems.
2. **No ambient arbitrary execution.** Crossing into Corpus OS must select an already declared bounded operation/capability.
3. **No hidden retrieval.** Door discovery and gesture decoding cannot load undisclosed destination material.
4. **No source mutation by destination.** Destination result cannot rewrite the source frame or gesture evidence.
5. **No UI authority.** A rendered button or door never implies permission.
6. **No relevance authority.** Founder Node / Pollen Scout evidence may affect visibility only.
7. **No gesture authority.** TranchNode decoding may affect traversal candidates only.
8. **No transport authority.** Project0 envelope validity proves a crossing object is well formed; it does not grant destination execution rights.
9. **No receipt inflation.** A receipt proves the recorded event or evaluation occurred under its declared law; it does not make every payload claim true.
10. **No narrative authority.** GitBook or generative narration may describe a witnessed run only after the repository evidence exists.

## Testing strategy

### Full Measure unit tests

Prove:

- door projections never imply authority;
- collision cannot auto-select;
- crossing confirmation is required independently from decoding;
- each destination result maps to a distinct Garden projection state;
- operational failure cannot be displayed as refusal;
- a refused encounter cannot produce an admitted-world consequence;
- adapter version incompatibility fails closed;
- private/held material stays absent from source-field construction.

### Contract / adversarial fixtures

Pin fixture vectors for:

- three bounded doors;
- intended, perturbed, reversed, and collision strokes;
- valid, malformed, tampered, and disclosure-blocked encounter envelopes;
- admitted, refused, indeterminate, and failed destination responses;
- partial return / missing evidence.

Fixtures must record their source project, contract version, and source commit/ref. They are conformance evidence, not copied authority.

### Cross-repository integration proof

The implementation is not complete with mocks alone.

At least one developer-run or CI-composed proof must exercise compatible real implementations from:

- TranchNode Intent Stroke;
- Project0 encounter-envelope / NAV boundary;
- Corpus OS destination-local admission or a repository-owned bounded adapter;
- Full Measure orchestration.

Founder Node / Authority Kit should join the proof when the relevant nearby-growth implementation is landed and compatible; until then, its adapter may remain fixture-backed without blocking the constitutional crossing proof.

### Human witness

The final v0.1 proof requires one hands-on Garden session in which a person:

1. sees three evidence-backed doors;
2. gestures toward one;
3. sees the decoded candidate / ambiguity state;
4. explicitly confirms the crossing;
5. witnesses one real destination-local disposition;
6. returns to a visibly changed Garden;
7. can inspect the evidence chain explaining why it changed.

Machine-green integration is necessary but insufficient for the claim that the House is inhabitable.

## Acceptance criteria

Boot the House v0.1 succeeds when all of the following are true:

- [ ] Full Measure remains the playable shell and does not become canonical authority for donor projects.
- [ ] Exactly one complete source-field -> door -> gesture -> confirmation -> encounter -> destination disposition -> return-residue -> changed-field loop works.
- [ ] At least three nearby doors are visible in the acceptance specimen, with boundary metadata only during scan.
- [ ] TranchNode decodes the gesture without selecting or authorizing the crossing.
- [ ] A separate human confirmation is required.
- [ ] Project0's compatible encounter-envelope law is used without a second canonicalizer or authority-transfer shortcut.
- [ ] Corpus OS or another explicitly approved destination-owned adapter makes the destination-local admission/refusal/indeterminate decision.
- [ ] `admitted`, `refused`, `indeterminate`, and `failed` remain mechanically and visually distinct.
- [ ] Refusal does not mutate constituted source state.
- [ ] Residue is durable and attributable but cannot itself authorize a later crossing.
- [ ] A return/reconstruction path can explain the encounter without claiming unrecovered context.
- [ ] One human session proves that the world visibly changes from actual recorded history.
- [ ] No new universal ontology, global world id, master graph, central authority service, or new canonicalization floor is introduced.

## Explicit non-goals

Do not add in v0.1:

- a universal `World` node;
- global route search;
- autonomous traversal;
- recursive scouts;
- cross-internet federation;
- remote account federation / SSO;
- a general plugin marketplace;
- VR / 3D rendering;
- MMO presence;
- automatic door creation;
- automatic promotion of refusal residue into constitutional law;
- a master Multiverse NAV graph;
- a new central event bus;
- a new repository solely to host orchestration;
- an attempt to integrate every Static Collective project.

Those may become later consequences. They are not prerequisites for proving the House can boot.

## Stop conditions

Stop and return to design if implementation appears to require any of the following:

- duplicating Project0 canonicalization or encounter semantics inside Full Measure;
- importing donor repository state directly instead of using an explicit adapter/contract;
- treating a gesture-decoder rank as permission;
- treating Founder Node relevance as permission;
- inspecting destination content before disclosure permits it;
- letting Full Measure decide the destination's authority;
- translating destination refusal into a retry that changes the requested action without a new human decision;
- hiding a missing donor implementation behind a fixture while claiming the live donor participated;
- storing reusable external credentials in Full Measure solely to make the demo work;
- inventing one global graph so the Garden can render three doors;
- requiring every future project to adopt Full Measure-specific domain types in order to participate.

## Evolution after v0.1

Only after the first heartbeat is witnessed should the architecture consider adding a second materially different destination.

The most useful sequence is likely:

```text
v0.1
Full Measure -> Corpus OS
constitutional / execution crossing

v0.2 candidate
Full Measure -> Band Runtime
live sovereign participant encounter

v0.3 candidate
Full Measure -> Upper Room
shared reading / witness-channel encounter
```

A second and third domain would test whether the adapter model actually preserves sovereignty across materially different kinds of rooms.

Only after multiple real rooms are easier to traverse without collapse should Multiverse NAV graduate from instrument hypothesis toward a product surface.

## Consequences

### What becomes possible

- The ecosystem can be experienced as one world without being merged into one application.
- New projects can become rooms/capabilities by declaring bounded surfaces rather than inventing bespoke global integration doctrine.
- Refusals and indeterminate crossings can begin accumulating useful, attributable negative-space evidence.
- Full Measure gains a concrete path from prototype Garden to genuine ecosystem World Layer.
- Corpus OS gains a human-facing encounter source without needing to own the world UI.
- TranchNode gesture/navigation work gets a real product surface.
- Project0 adapter-boundary work gets an inhabited proof rather than only fixture-level evidence.

### What becomes harder

- Integration must respect exact contract versions instead of copying convenient logic.
- Development spans multiple repositories and must tolerate donor availability/version drift.
- Product UX must preserve distinctions that ordinary apps often collapse: relevance/permission, intent/choice, receiving/admission, refusal/failure, residue/authority.
- Cross-repo verification becomes part of release truth.

Those costs are intentional. If they are removed by centralizing authority, the experiment has failed.

## Governing compression

> **The House boots when one person can move through several sovereign systems as one continuous world, and every boundary still remembers who owns what.**

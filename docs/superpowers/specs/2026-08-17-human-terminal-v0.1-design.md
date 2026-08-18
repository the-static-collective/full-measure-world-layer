# Human Terminal v0.1 — Basic-Human Operator Membrane

**Status:** approved architectural direction; design-only slice

**Tracking:** #18

## Design sentence

> Give the composed Full Measure world runtime a legible human operator surface that can explain and suggest reachable moves without becoming a new authority plane, command ontology, or arbitrary execution shell.

## Why this belongs in Full Measure

Boot the House already landed the hard cross-project machinery:

```text
human
  -> Full Measure Garden
  -> TranchNode traversal decoding
  -> explicit human confirmation
  -> Project0 encounter address / verification
  -> Corpus OS destination-local disposition
  -> Full Measure residue / changed projection
```

Full Measure already owns the human-facing world projection and the HTTP/client boundary that exposes the composed runtime. Human Terminal therefore belongs here as another **projection over those existing seams**.

It must not become a new central orchestrator repository or absorb donor logic. The operator layer is allowed to make the machinery legible. It is not allowed to make the machinery sovereign.

## Governing law

> **Human language may project reachable operations; only existing bounded application contracts may perform them. Suggestion is not authority.**

A plain-English sentence, a ranked suggestion, or an inferred likely next move is never itself executable authority.

The first version preserves three separate layers:

```text
human phrase
    ↓
interpreted operator intent
    ↓
bounded Full Measure operation
    ↓
existing donor/runtime machinery
```

Each layer remains inspectable. The interpretation layer cannot silently widen the operation underneath it.

## Existing runtime floor

Human Terminal v0.1 consumes the already-landed Full Measure world runtime rather than creating a second integration path.

Current application routes:

```text
GET  /api/world/field
GET  /api/world/doors
POST /api/world/stroke/decode
POST /api/world/encounter/prepare
POST /api/world/encounter/confirm
GET  /api/world/residue/:ref
```

The existing `worldRuntimeClient` is the preferred application seam for the first implementation. Human Terminal should not call TranchNode, Project0, Corpus OS, or future Founder Node adapters directly.

That keeps this chain intact:

```text
Human Terminal
    ↓
worldRuntimeClient / Full Measure application contracts
    ↓
Full Measure orchestration
    ↓
repo-owned donor adapters
```

## Product distinction

The Garden and Human Terminal are complementary surfaces.

**Garden** is the inhabited/world interface. It lets a person experience the field, gesture toward doors, cross deliberately, and witness changed projection.

**Human Terminal** is the operator/navigation interface. It explains where the person is, what is nearby, what evidence supports a door, what bounded actions are currently possible, and what happened after prior actions.

Human Terminal does not replace the Garden and does not create an alternate constitutional crossing path.

## Operator intents

v0.1 uses a small versioned vocabulary of **Full Measure-local operator intents**. These are product/application types, not Project0 ontology and not universal Static Collective commands.

Initial intents:

```ts
type HumanTerminalIntent =
  | { kind: 'orient' }
  | { kind: 'list-nearby-doors' }
  | { kind: 'explain-door'; doorRef: string }
  | { kind: 'list-safe-moves' }
  | { kind: 'inspect-residue'; residueRef?: string }
  | { kind: 'explain-evidence'; evidenceRefs: string[] }
  | { kind: 'list-human-gates' }
  | { kind: 'begin-crossing'; doorRef: string };
```

The exact TypeScript shape may be tightened during implementation, but these semantic boundaries are fixed for v0.1.

Unknown text remains unknown. The interpreter must not turn an unrecognized request into a guessed shell command, donor operation, or improvised mutation.

## Human-facing vocabulary

The first visible surface may stay deliberately small:

1. **Where am I?**
2. **What doors are nearby?**
3. **Why is this door here?**
4. **What can I safely do?**
5. **Enter a crossing**
6. **What happened last time?**
7. **Show the evidence**
8. **What needs me?**

These labels are contextual affordances, not globally privileged keywords. A later interface may accept more natural phrasing, but all accepted phrasing must resolve into the bounded intent set before any operation can occur.

## Proposed move projection

Human Terminal should reason about **moves**, not raw commands.

```ts
type HumanTerminalMoveState =
  | 'read-only'
  | 'requires-human-confirmation'
  | 'unavailable'
  | 'blocked'
  | 'unknown';

interface HumanTerminalMove {
  moveRef: string;
  label: string;
  explanation: string;
  intent: HumanTerminalIntent;
  state: HumanTerminalMoveState;
  evidenceRefs: string[];
  sourceMode?: 'live' | 'fixture';
  authority: 'none';
}
```

`authority: 'none'` records the operator-layer rule: being suggested or visible does not authorize the underlying mutation.

A move may be derived only from state Full Measure can actually witness. If the evidence is unavailable or ambiguous, the move must say so rather than filling the gap narratively.

## Execution classes

### Read-only projection

Read-only intents may resolve immediately against current Full Measure projections.

Examples:

- `orient` -> current field projection;
- `list-nearby-doors` -> current `NearbyDoorSource` projection through Full Measure;
- `explain-door` -> human-readable explanation from the door's relation, reachability, provenance, and relevance reasons;
- `inspect-residue` -> existing residue lookup and readable projection;
- `list-human-gates` -> known explicit Full Measure human gates visible from current application state.

Read-only projection must not retrieve destination bodies merely because the operator asks why a door is nearby.

### Crossing handoff

`begin-crossing` is not an execution primitive. It is a handoff into the existing Boot the House crossing flow.

The Terminal may select or surface the target door and explain what the crossing will disclose or require. It may not skip the existing separation between preparation and explicit human confirmation.

```text
Terminal says "enter this crossing"
    != crossing confirmed
    != destination admitted
```

If the existing Garden/Boot the House flow requires a gesture, candidate resolution, preparation, or explicit `Cross this door` confirmation, Human Terminal preserves that law rather than inventing a shortcut.

## Interpretation boundary

A model or heuristic interpreter may be used later to map natural language to the bounded intent vocabulary, but the architecture does not trust model output as an executable command.

The safe boundary is:

```text
freeform text
    ↓
interpreter proposes known intent
    ↓
validate exact intent shape
    ↓
map through deterministic operation registry
    ↓
run read-only operation OR enter existing human confirmation flow
```

There is no fallback path from unknown text to `exec`, shell interpolation, arbitrary HTTP, arbitrary repository mutation, or donor-specific freeform input.

## Operation registry

v0.1 should have one boring, deterministic mapping from known intent kinds to known Full Measure handlers.

Conceptually:

```ts
interface HumanTerminalOperationDefinition {
  kind: HumanTerminalIntent['kind'];
  effect: 'read-only' | 'crossing-handoff';
  describe(intent: HumanTerminalIntent): string;
  run(intent: HumanTerminalIntent): Promise<HumanTerminalResult>;
}
```

This registry is an application allowlist, not a universal command catalog. Adding a new operation requires code/review, not prompt wording.

## Truth-state projection

Human Terminal must preserve the truth distinctions the current world runtime already proves.

Nearby doors must retain at least:

- reachable / blocked / unknown;
- live / fixture-backed / unavailable where applicable;
- provenance and relevance reasons;
- `authority: none`.

Crossing outcomes must remain distinct:

- admitted;
- refused;
- indeterminate;
- destination failed;
- pre-destination validation failed.

Plain English may simplify vocabulary, but it cannot collapse these states. In particular:

```text
"it didn't happen"
```

is insufficient when the evidence knows whether the destination refused, could not decide, failed operationally, or was never invoked because Project0 validation failed.

## Explanation law

Human-readable explanation is downstream of evidence.

The Terminal may say:

```text
Corpus is nearby because the current door projection records a shared constitutional/reachability relation.
```

only if the current projection carries evidence supporting that statement.

It may not invent relationship reasons from model familiarity with the repositories.

Every substantive explanation should retain inspectable source/evidence refs. The user should be able to move from:

```text
basic human explanation
    ↓
structured Full Measure projection
    ↓
source / receipt refs
```

without the prose becoming a competing authority record.

## Nearby-door evolution

The first Human Terminal can operate against the current fixture-backed `NearbyDoorSource` as long as that status remains visible.

When Full Measure #11 swaps the source to the Founder Node bounded adapter, Human Terminal should not require a semantic rewrite. It consumes the same Full Measure door projection.

Therefore:

```text
fixture NearbyDoorSource
        ↓
Human Terminal

later

FounderNode NearbyDoorSource
        ↓
Human Terminal
```

Founder Node relevance influences visibility only. It never grants permission or execution authority.

## Residue and memory

Human Terminal may make the latest or selected `WorldEncounterResidue` understandable in basic language.

It may summarize:

- what field the user was in;
- which door was selected;
- what crossing was attempted;
- whether the destination was invoked;
- the destination result class;
- which evidence/return refs exist;
- what reconstruction remains partial or unresolved.

It does not create a second residue store, rewrite canonical refs, or claim to reconstruct destination-private state.

A future "what happened last time?" memory convenience should therefore remain a projection over Full Measure residue history, not a separate narrative event log with independent truth semantics.

## Human gates

`list-human-gates` is intentionally useful but narrow.

For v0.1 it reports explicit known gates exposed by Full Measure application state. It does not crawl every repository for TODOs or infer that a GitHub issue "needs the human" from prose alone.

The first important gate remains the outstanding Boot the House human witness in #6. Human Terminal does not close that gate merely by existing.

## Failure behavior

| Case | Required Terminal behavior |
|---|---|
| World runtime unavailable | state plainly that the operator surface cannot witness current world state |
| Field unreadable | no invented orientation |
| Door source unavailable | orientation remains usable; nearby-door action says unavailable |
| Fixture doors active | label them fixture-backed |
| Door evidence incomplete | preserve unknown / incomplete explanation |
| Unknown human phrase | return unknown intent; offer bounded visible moves |
| Read-only operation fails | report failure without retrying as a different operation |
| Crossing requested | enter existing crossing flow; no implicit confirmation |
| Destination refuses | explain refusal as refusal; do not suggest it succeeded |
| Destination fails | explain operational failure; do not relabel refusal |
| Validation fails before destination | state destination was not invoked |
| Residue incomplete | mark reconstruction partial |

## Security and authority constraints

1. No freeform LLM-to-shell execution.
2. No arbitrary process spawning from human phrasing.
3. No hidden automatic crossing.
4. No hidden retry after refusal or failure.
5. No donor-repository direct mutation from the operator layer.
6. No destination-body retrieval during nearby-door scan.
7. No model relevance promoted into permission.
8. No new canonical identity or receipt scheme.
9. No second constitutional state store.
10. No operator label may imply authority the underlying operation does not possess.
11. Unknown intent fails closed into explanation/suggestion, not guessed execution.
12. GitBook or UI prose never outranks current repository/runtime evidence.

## First implementation slice

After this design is reviewed and landed, the smallest useful implementation is one Full Measure-local operator module built on `worldRuntimeClient`.

Start with four read-only intents:

```text
orient
list-nearby-doors
explain-door
inspect-residue
```

Then add `list-safe-moves` as a pure projection over the witnessed state.

Only after those are proven should `begin-crossing` be added as a narrow handoff to the existing crossing UI/state machine.

No donor adapter changes are required for that first implementation slice.

## Testing strategy

### Pure intent / move tests

Prove:

- only known intent kinds resolve;
- unknown text cannot produce an operation;
- every move carries `authority: none`;
- read-only vs crossing-handoff classification is deterministic;
- unavailable evidence produces unavailable/unknown moves rather than confident prose.

### World-runtime mapping tests

Using a fake `worldRuntimeClient`, prove:

- `orient` uses field projection only;
- nearby-door operations use Full Measure door projection only;
- explanation does not fetch destination bodies;
- residue inspection preserves exact evidence refs;
- crossing intent cannot call `confirmEncounter` directly.

### Regression boundary

The existing Boot the House tests and composed proof remain authoritative for donor semantics. Human Terminal tests should prove that the new operator layer does not bypass them.

## Acceptance criteria

Human Terminal v0.1 is successful when:

- [ ] a person can ask where they are and receive a truthful current-field explanation;
- [ ] a person can see nearby doors with evidence/reachability and fixture/live truth preserved;
- [ ] a person can ask why a door is nearby without loading destination bodies;
- [ ] the system can project a bounded set of safe next moves from witnessed state;
- [ ] read-only moves execute only through existing Full Measure application seams;
- [ ] unknown text cannot become arbitrary execution;
- [ ] crossing-related intent cannot bypass the existing explicit human confirmation boundary;
- [ ] residue can be rendered in basic human language while underlying refs remain inspectable;
- [ ] admitted/refused/indeterminate/failed/validation-failed remain distinct;
- [ ] donor semantics remain owned by their donor repositories;
- [ ] Full Measure remains orchestration/projection, not constitutional authority;
- [ ] Garden remains the inhabited interface and Human Terminal remains the operator interface.

## Non-goals

Do not build in v0.1:

- a standalone Human Terminal repository;
- a general-purpose shell replacement;
- a global command vocabulary for every Static Collective project;
- autonomous agents choosing and crossing doors;
- GitHub mutation commands;
- recursive ecosystem crawling;
- a master project graph;
- a new credentials plane;
- natural-language mutation of arbitrary donor capabilities;
- replacement of the existing Garden crossing UX.

## Relationship to current work

- **Full Measure #6:** outstanding human Garden witness; remains independently required.
- **Full Measure #11:** live nearby-door discovery through Founder Node; Human Terminal should consume the same projection shape.
- **Full Measure PR #16:** current real composed machine proof floor.
- **Founder Node #3:** future bounded local-process door source; no direct Terminal dependency required beyond Full Measure's adapter swap.

## Stop conditions

Return to design if implementation requires:

- calling donor repositories directly from Human Terminal;
- adding arbitrary shell/process execution;
- inventing new crossing confirmation semantics;
- hiding fixture-backed state;
- treating an LLM interpretation as authorization;
- creating a second canonical command/receipt/addressing layer;
- collapsing refusal, failure, indeterminate, and validation failure for UX convenience;
- changing donor contracts merely to make the Terminal easier to implement.

## Governing compression

> **The Human Terminal may tell a person what the House can presently see and what doors it can presently offer. It may never pretend that seeing a door is permission to walk through it.**

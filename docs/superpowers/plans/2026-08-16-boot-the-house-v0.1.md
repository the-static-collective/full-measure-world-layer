# Boot the House v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one real, human-confirmed Full Measure Garden traversal cross TranchNode → Project0 → Corpus OS through repository-owned local process adapters, return a destination-local disposition, and visibly reproject the Garden without centralizing donor authority.

**Architecture:** Full Measure remains the human-facing orchestrator and invokes donor-owned local commands using bounded JSON over stdin/stdout. TranchNode owns gesture decoding, Project0 owns encounter construction/validation and destination-local envelope evaluation law, Corpus OS owns the destination decision, and Full Measure owns only the local projection/history needed to explain the user experience. No cross-repository source imports, common database, daemon, network service, or new canonicalizer are introduced.

**Tech Stack:** TypeScript, Node.js child processes, Express, React/Vite, Node test runner, repository-native GitHub Actions.

## Global Constraints

- Crossing never carries sovereignty.
- Nearby-door relevance and gesture ranking are non-authoritative.
- A separate explicit human confirmation is required before any crossing command is emitted.
- `admitted`, `refused`, `indeterminate`, destination runtime `failed`, and pre-destination validation/compatibility failure remain distinct.
- Full Measure must not duplicate Project0 canonicalization, TranchNode decoding, Corpus OS admission, or donor durability law.
- Donor integrations use repository-owned local process adapters with versioned JSON request/response contracts.
- Fixtures must be visibly identified as fixtures and may not be represented as live donor observations.
- No universal World node, master graph, autonomous routing, hidden destination retrieval, central credentials plane, or network transport in v0.1.

---

## File structure locked for v0.1

### TranchNode
- Create `scripts/intent-stroke-stdio.ts` — one-shot stdin/stdout adapter around the landed Intent Stroke decoder.
- Create `test/intent-stroke-stdio.test.ts` — process-boundary conformance and failure tests.
- Modify `package.json` — add `intent-stroke:stdio` command only.

### Project0
- Create `scripts/world-encounter-stdio.ts` — one-shot adapter around landed `src/world-encounter/*` APIs.
- Create `tests/world-encounter-stdio.test.ts` — process-boundary identity, tamper, disclosure, and disposition tests.
- Modify `package.json` — add `world-encounter:stdio` command only.

### Corpus OS
- Create `kernel/world-encounter-destination.ts` — bounded Corpus-owned adapter from a valid Project0 encounter offer into one declared Corpus capability decision.
- Create `scripts/world-encounter-destination.ts` — stdin/stdout host for that adapter.
- Create `tests/world-encounter-destination.test.mjs` — admitted/refused/indeterminate/failed separation and no-authority-escalation tests.
- Modify `kernel/index.ts` — export only the new destination adapter API.
- Modify `package.json` — add `world:encounter` and include the test in the kernel gate.

### Full Measure
- Create `src/world-runtime/contracts.ts` — Full Measure-local projection/result types only.
- Create `src/world-runtime/processPort.ts` — bounded one-shot child-process JSON runner.
- Create `src/world-runtime/doors.ts` — exactly-three-door source with explicit `live | fixture` provenance.
- Create `src/world-runtime/orchestrator.ts` — field → decode → confirmation → encounter → destination → residue state machine.
- Create `src/world-runtime/residue.ts` — local projection history only; foreign evidence remains referenced.
- Create `tests/worldRuntime.test.ts` — unit/adversarial state-machine tests.
- Create `tests/worldRuntimeProcesses.test.ts` — configured donor-command integration contract tests.
- Modify `server.ts` — narrow API endpoints for field, decode, confirm/cross, residue.
- Modify `src/lib/api.ts` — browser client methods for those endpoints.
- Create `src/components/WorldDoors.tsx` — three-door + gesture + confirmation + result UI.
- Modify `src/App.tsx` — mount WorldDoors in the Garden.
- Modify `.env.example` — configured donor command paths, no credentials.
- Modify `package.json` — composed witness/check command only.

### Cross-repository witness
- Create `scripts/boot-house-witness.mjs` in Full Measure — runs one pinned composed local-process specimen and writes a JSON receipt under `artifacts/boot-house/`.
- Create `docs/BOOT_THE_HOUSE_V0_1.md` in Full Measure — operator steps and evidence interpretation.

---

### Task 1: Give TranchNode a repository-owned Intent Stroke process port

**Files:**
- Create: `scripts/intent-stroke-stdio.ts`
- Create: `test/intent-stroke-stdio.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: landed `addressIntentStroke`, `addressIntentStrokeFieldLayout`, `decodeIntentStroke`, and related types from `src/intent-stroke.ts`.
- Produces: command `npm run intent-stroke:stdio` accepting one JSON request on stdin and emitting one JSON response on stdout.

- [ ] **Step 1: Write the failing process-boundary test**

```ts
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const validRequest = {
  schema: "tranchnode.intent-stroke-process/v0.1",
  operation: "decode",
  stroke: { schema: "tranchnode/intent-stroke/v0.1", fieldLayoutRef: "__FILLED_BY_TEST__", points: [
    { sequence: 0, x: 0, y: 0 },
    { sequence: 1, x: 100, y: 0 },
  ] },
  layout: { schema: "tranchnode/intent-stroke-layout/v0.1", anchors: [
    { id: "garden", x: 0, y: 0 },
    { id: "corpus", x: 100, y: 0 },
    { id: "upper-room", x: 0, y: 100 },
  ] },
  templates: [
    { id: "garden-to-corpus", anchorIds: ["garden", "corpus"] },
    { id: "garden-to-upper-room", anchorIds: ["garden", "upper-room"] },
  ],
  decoder: { id: "boot-house-v0.1", version: "0.1", interpolationStepsPerSegment: 4, endpointPenaltyMultiplier: 1 },
};

test("stdio adapter returns the native non-authoritative decoding", () => {
  const child = spawnSync(process.execPath, ["--import", "tsx", "scripts/intent-stroke-stdio.ts"], {
    input: JSON.stringify(validRequest),
    encoding: "utf8",
  });
  assert.equal(child.status, 0);
  const body = JSON.parse(child.stdout);
  assert.equal(body.schema, "tranchnode.intent-stroke-process-result/v0.1");
  assert.equal(body.status, "ok");
  assert.equal(body.decoding.authority, "none");
  assert.equal(body.decoding.candidates[0].templateId, "garden-to-corpus");
});
```

The test helper must first address the layout with the native address function and place that hash into `stroke.fieldLayoutRef`; do not implement a second hash path in the adapter.

- [ ] **Step 2: Verify RED in GitHub Actions**

Push the test-only commit to `agent/boot-house-intent-stroke-port`, open a draft PR, and run the existing `npm run check` workflow.
Expected: FAIL because `scripts/intent-stroke-stdio.ts` does not exist.

- [ ] **Step 3: Implement the minimal one-shot adapter**

```ts
export interface IntentStrokeProcessRequest {
  schema: "tranchnode.intent-stroke-process/v0.1";
  operation: "decode";
  stroke: IntentStroke;
  layout: IntentStrokeFieldLayout;
  templates: TraversalTemplate[];
  decoder: IntentStrokeDecoderIdentity;
}

// stdin JSON -> native addressing -> native decodeIntentStroke -> stdout JSON
// Errors become { schema, status: "error", code, message } and non-zero exit.
```

The adapter must call `addressIntentStrokeFieldLayout(request.layout)` and `addressIntentStroke(request.stroke)`; if the stroke declares a different layout hash, native decoding must reject it.

- [ ] **Step 4: Verify GREEN**

Run repository `npm run check` through Actions.
Expected: existing suite plus process adapter tests PASS.

- [ ] **Step 5: Commit/push and leave PR draft-ready**

Commit message: `feat: expose Intent Stroke local process port`

---

### Task 2: Give Project0 a repository-owned World Encounter process port

**Files:**
- Create: `scripts/world-encounter-stdio.ts`
- Create: `tests/world-encounter-stdio.test.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: landed `src/world-encounter/index.ts` APIs from Project0 PR #41.
- Produces: `npm run world-encounter:stdio`, supporting only explicit operations required by the heartbeat: `address`, `verify`, and `evaluate`.

- [ ] **Step 1: Write failing tests for exact native identity and tamper refusal**

```ts
test("process port returns the same encounter ref as native addressing", () => {
  // build the pinned Project0 -> Corpus OS fixture input
  // run process operation: "address"
  // compare returned ref to addressEncounterRecord(nativeBody).ref
});

test("tampered addressed encounter fails before destination evaluation", () => {
  // run operation: "verify" with body changed after addressing
  // expect status:error and a stable validation code
});
```

- [ ] **Step 2: Verify RED**

Expected: workflow fails only because `scripts/world-encounter-stdio.ts` is missing.

- [ ] **Step 3: Implement the minimal operation switch**

```ts
type WorldEncounterProcessRequest =
  | { schema: "project0.world-encounter-process/v0.1"; operation: "address"; encounter: WorldEncounterRecord }
  | { schema: "project0.world-encounter-process/v0.1"; operation: "verify"; addressed: AddressedWorldEncounter }
  | { schema: "project0.world-encounter-process/v0.1"; operation: "evaluate"; envelope: WorldEncounterEnvelope; destination: DestinationContext; options: EvaluationOptions };
```

Delegate every operation to exported Project0 functions. Do not reproduce validation, canonicalization, disclosure checks, or disposition consistency checks in the script.

- [ ] **Step 4: Verify GREEN with `npm run verify:all`**

Expected: Project0's full TypeScript, Node tests, Python fixture verification, and conformance gate pass.

- [ ] **Step 5: Commit/push and leave PR draft-ready**

Commit message: `feat: expose World Encounter local process port`

---

### Task 3: Add one bounded Corpus OS destination adapter

**Files:**
- Create: `kernel/world-encounter-destination.ts`
- Create: `scripts/world-encounter-destination.ts`
- Create: `tests/world-encounter-destination.test.mjs`
- Modify: `kernel/index.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: a Project0-verified encounter body plus a declared Corpus destination capability id.
- Produces: Corpus-owned `admitted | refused | indeterminate | failed` result with Corpus receipt/evidence refs. It does not accept source-frame authority as executable destination authority.

- [ ] **Step 1: Write RED tests for the four distinct result classes**

```js
test("foreign source authority cannot satisfy Corpus destination authority", async () => {
  const result = await evaluateWorldEncounterDestination({
    encounter: admittedFixtureWithSourceAuthority,
    capability: "corpus.inspect-bounded-witness/v0.1",
    destinationAuthority: [],
  });
  assert.equal(result.status, "refused");
  assert.equal(result.reasonCodes.includes("DESTINATION_AUTHORITY_REQUIRED"), true);
});

test("runtime failure is not constitutional refusal", async () => {
  const result = await evaluateWorldEncounterDestination(failingHostFixture);
  assert.equal(result.status, "failed");
});
```

Also add admitted and indeterminate tests, and assert the source encounter object is byte-for-byte unchanged after evaluation.

- [ ] **Step 2: Verify RED with `npm run test:session` or a dedicated test command**

Expected: FAIL because the destination adapter does not exist.

- [ ] **Step 3: Implement one declared capability only**

```ts
export type CorpusWorldEncounterCapability = "corpus.inspect-bounded-witness/v0.1";

export function evaluateWorldEncounterDestination(input: CorpusWorldEncounterInput): CorpusWorldEncounterDisposition {
  // validate only Corpus-owned capability and destination-local authority inputs
  // do not re-canonicalize Project0 identity
  // do not mutate encounter
  // produce one of admitted/refused/indeterminate; host wrapper maps thrown operational failures to failed
}
```

The first capability may inspect only the bounded witness fields already disclosed by the valid Project0 encounter. No shell command, arbitrary path, or free-form executable string is accepted.

- [ ] **Step 4: Add the stdin/stdout host**

Request schema: `corpus.world-encounter-destination/v0.1`.
Response schema: `corpus.world-encounter-disposition/v0.1`.
The host reads one request, invokes the kernel adapter, writes one response, and exits.

- [ ] **Step 5: Verify GREEN**

Run `npm run check`.
Expected: full Corpus gate passes; new test proves refusal/failure distinction and source immutability.

- [ ] **Step 6: Commit/push and leave PR draft-ready**

Commit message: `feat: add bounded World Encounter destination`

---

### Task 4: Build Full Measure's process transport and world-runtime state machine

**Files:**
- Create: `src/world-runtime/contracts.ts`
- Create: `src/world-runtime/processPort.ts`
- Create: `src/world-runtime/doors.ts`
- Create: `src/world-runtime/orchestrator.ts`
- Create: `src/world-runtime/residue.ts`
- Create: `tests/worldRuntime.test.ts`
- Create: `tests/worldRuntimeProcesses.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Consumes: configured commands for TranchNode, Project0, Corpus OS.
- Produces: Full Measure-local `WorldFieldProjection`, `TraversalIntentProjection`, `ConfirmedCrossingIntent`, and `WorldEncounterResidue`.

- [ ] **Step 1: Write RED state-machine tests**

```ts
test("decode never crosses without a separate confirmation", async () => {
  const runtime = createWorldRuntime(fakePorts);
  const decoded = await runtime.decodeStroke(stroke);
  assert.equal(decoded.authority, "none");
  assert.equal(fakePorts.project0.calls.length, 0);
  assert.equal(fakePorts.corpus.calls.length, 0);
});

test("pre-destination Project0 validation failure never invokes Corpus", async () => {
  // Project0 port returns validation failure
  // assert Corpus call count is zero and local result.kind === "validation-failed"
});

test("refused crossing records residue without constituted destination consequence", async () => {
  // Corpus returns refused
  // assert residue exists, Garden consequence is not admitted/reachable
});
```

- [ ] **Step 2: Verify RED**

Expected: tests fail because `src/world-runtime/*` does not exist.

- [ ] **Step 3: Implement `processPort.ts`**

```ts
export interface JsonProcessCommand {
  command: string;
  args: string[];
  cwd?: string;
  timeoutMs: number;
}

export async function runJsonProcess<TRequest, TResponse>(command: JsonProcessCommand, request: TRequest): Promise<TResponse>;
```

Rules: one process per operation; JSON only; bounded timeout; bounded stdout/stderr size; non-zero exit is an operational adapter failure; no shell interpolation (`spawn` with argv, never `exec`).

- [ ] **Step 4: Implement exactly-three-door source**

Return three `WorldDoorProjection` objects. Each includes `evidenceMode: "live" | "fixture"`, provenance refs, and `authority: "none"`. Until Founder Node Pollen Scout lands compatibly, use a pinned fixture and render that fact.

- [ ] **Step 5: Implement orchestrator transitions**

Allowed sequence:

```text
field -> decoded -> confirmation-required -> confirmed -> envelope-validating -> destination-evaluating -> terminal residue
```

No method may skip from `decoded` to `destination-evaluating`.

- [ ] **Step 6: Verify GREEN**

Run `npm test` then `npm run check`.

- [ ] **Step 7: Commit/push**

Commit message: `feat: add federated world runtime core`

---

### Task 5: Expose the heartbeat through the Full Measure server and Garden

**Files:**
- Modify: `server.ts`
- Modify: `src/lib/api.ts`
- Create: `src/components/WorldDoors.tsx`
- Modify: `src/App.tsx`
- Modify: `tests/worldRuntime.test.ts`

**Interfaces:**
- HTTP endpoints remain Full Measure-local UI APIs; they do not become donor protocols.

- [ ] **Step 1: Write RED endpoint tests**

Required behavior:
- `GET /api/world/field` returns current bounded field + exactly three metadata-only doors.
- `POST /api/world/decode` records/decodes a stroke and returns candidates/ambiguity only.
- `POST /api/world/cross` requires a server-issued pending decode id plus explicit `{ confirmed: true }`.
- replaying/forging a confirmation id fails closed.
- `GET /api/world/residue/:id` returns only local residue plus foreign evidence refs.

- [ ] **Step 2: Verify RED**

Expected: missing routes.

- [ ] **Step 3: Implement narrow routes**

Do not expose command names, cwd paths, donor process argv, source credentials, or arbitrary operation strings to the browser.

- [ ] **Step 4: Implement `WorldDoors.tsx`**

UI states:
- three doors with `LIVE` or `FIXTURE` evidence badge;
- gesture surface;
- decoded candidate plus collision state;
- separate **Cross this door** button;
- terminal result rendered as `ADMITTED`, `REFUSED`, `INDETERMINATE`, `FAILED`, or `VALIDATION FAILED`;
- evidence drawer showing only attributable refs and unresolved fog.

- [ ] **Step 5: Verify GREEN**

Run `npm run check`.

- [ ] **Step 6: Commit/push**

Commit message: `feat: inhabit the first federated world crossing`

---

### Task 6: Prove one composed cross-repository witness

**Files:**
- Create: `scripts/boot-house-witness.mjs`
- Create: `docs/BOOT_THE_HOUSE_V0_1.md`
- Modify: `package.json`

**Interfaces:**
- Consumes configured checked-out donor repository paths and exact donor refs/versions.
- Produces one machine-readable `artifacts/boot-house/<run-id>.json` receipt and console summary.

- [ ] **Step 1: Write RED witness test/verification**

The witness command must fail if any configured donor command is absent, its declared process schema is unsupported, or fixture/live evidence is mislabeled.

- [ ] **Step 2: Implement one pinned specimen**

The specimen must record:
- Full Measure commit/ref;
- TranchNode commit/ref + decoding fingerprint;
- Project0 commit/ref + encounter ref;
- Corpus OS commit/ref + disposition/receipt refs;
- raw stroke + layout ref;
- human confirmation ref;
- result class;
- unresolved refs;
- whether each door was live or fixture-backed.

- [ ] **Step 3: Run composed witness**

Expected: one exact route completes through all real process adapters. Founder Node may remain fixture-backed if explicitly labeled.

- [ ] **Step 4: Run all four repository gates on the exact heads**

- TranchNode: `npm run check`
- Project0: `npm run verify:all`
- Corpus OS: `npm run check`
- Full Measure: `npm run check`

- [ ] **Step 5: Human Garden witness**

A person sees three doors, gestures, sees decoding/ambiguity, explicitly confirms, receives one real destination-local result, returns to a visibly changed Garden, and can inspect the evidence chain.

- [ ] **Step 6: Record project evidence in GitBook only after repository evidence exists**

GitBook records the specimen as project-backed evidence; it does not define the runtime contract.

---

## Execution order and landing discipline

1. TranchNode process port.
2. Project0 process port.
3. Corpus OS destination adapter.
4. Full Measure runtime core.
5. Full Measure Garden/API surface.
6. Composed witness and GitBook evidence.

Each repository gets its own branch and PR. Do not merge one repository merely because another is approved. Every landing decision must bind to the exact current PR head and repository-native checks/reviews.

## Self-review result

- Spec coverage: all acceptance states, authority boundaries, fixture truthfulness, human confirmation, process transport, return residue, and human witness have explicit tasks.
- Placeholder scan: no TBD/TODO implementation steps remain.
- Type consistency: Full Measure local types stay local; donor process schemas are separately namespaced and never presented as universal domain types.
- Critical dependency check: Project0 World Encounter Envelope v0.1 is landed on `main`; Founder Node remains optional/fixture-backed for v0.1 nearby-door discovery.
